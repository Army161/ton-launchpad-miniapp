import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Address } from '@ton/core';
import { chainSession, listLaunches, mapLimit, readLaunchpadToken, serverFactory, type Launch, type TokenView } from '../_lib/chain.js';
import { chainUnavailable, serverError } from '../_lib/http.js';
import { BudgetSpentError, ChainUnavailableError } from '../_lib/toncenter.js';

// Tokens are discovered from the factory's on-chain history, not from a
// user-writable registry, so nothing unverified can be listed.

/** A list is served from memory this long, and the edge caches it with LIST_CACHE. */
const LIST_MS = 20_000;
const LIST_CACHE = 's-maxage=15, stale-while-revalidate=30';
/** A list that misses a token, or the last list served again after a failed refresh, is refreshed sooner. */
const SHORT_MS = 5_000;
const SHORT_CACHE = 's-maxage=5, stale-while-revalidate=30';
/** A launch this recent that reads as "nothing deployed" may still be deploying, so the list is refreshed sooner. */
const DEPLOYING_MS = 60_000;
/**
 * Once a token read of a refresh fails (toncenter did not answer it), the tokens that refresh did not read are filled
 * in only from a view read this recently, or left out (partial), so an outage shows as one and not as old data. While
 * toncenter answers, a token the refresh had no time left for is shown as last read, however long ago: the instance
 * re-reads its tokens in turn, longest unread first, and on a quiet instance with many tokens a round takes longer.
 */
const FILL_MAX_AGE_MS = 30 * 60_000;
/** After a failed refresh the last list is served again only if it was read this recently; otherwise 503. */
const LIST_MAX_AGE_MS = 5 * 60_000;

type Listing = { tokens: TokenView[]; partial: boolean; short: boolean; listedAt: number };

/** Last view read of each listed token (by raw address) and when it was read. Fills in a token not read this time. */
const lastRead = new Map<string, { view: TokenView; at: number }>();
/** Launches whose last read found no token of ours (not deployed yet, or a setup that failed), and when. */
const lastEmpty = new Map<string, number>();
/** Launches whose reads failed in a row (toncenter did not answer them): how many times, and when last. */
const failing = new Map<string, { times: number; at: number }>();
let cache: (Listing & { expiresAt: number }) | null = null;
let refreshing: Promise<Listing> | null = null;

const errorText = (err: unknown) => (err instanceof Error ? err.message : 'unknown error');
const keyOf = (address: Address) => address.toRawString();
/** True when a read at `at` may have come before the launch's jetton was deployed. */
const mayBeDeploying = (launch: Launch, at: number) => at - launch.at < DEPLOYING_MS;

/**
 * When a launch was last read, for the read order: 0 for never, and also for one last read as empty while it may
 * still have been deploying, so both go first. A launch read as empty after its first minute takes its turn with the
 * tokens, so launches that never deploy cannot use up every refresh's budget before a token is read. A failed read
 * leaves the launch where it was, so it is tried first again; after two failed reads in a row it takes its turn by
 * when it last failed, so launches whose reads keep failing cannot use up every refresh before the others are read.
 */
function readAt(launch: Launch): number {
  const key = keyOf(launch.address);
  const failed = failing.get(key);
  if (failed && failed.times >= 2) return failed.at;
  const token = lastRead.get(key);
  if (token) return token.at;
  const empty = lastEmpty.get(key);
  return empty === undefined || mayBeDeploying(launch, empty) ? 0 : empty;
}

async function readListing(factory: Address): Promise<Listing> {
  const chain = chainSession();
  const launches = await listLaunches(factory, 100, chain);
  // One session fits about 50 requests with TONCENTER_API_KEY (6 without), and a token costs 1 request, or 2 the
  // first time. So read the launches never read here first, then the ones read longest ago: the budget then leaves
  // the most recently read for the next refresh, and successive refreshes cover every launch.
  const now = Date.now();
  const order = [...launches].sort((a, b) => readAt(a) - readAt(b));
  /** Launches this refresh did not read: no time was left for them, or their read failed. */
  const unread: Launch[] = [];
  let failed = 0;
  let reason = '';
  let deploying = 0;
  await mapLimit(order, 3, async (launch) => {
    const key = keyOf(launch.address);
    try {
      const view = await readLaunchpadToken(launch.address, factory, chain);
      failing.delete(key);
      if (view) {
        lastRead.set(key, { view, at: Date.now() });
        lastEmpty.delete(key);
      } else {
        lastRead.delete(key);
        lastEmpty.set(key, Date.now());
        if (mayBeDeploying(launch, Date.now())) deploying++;
      }
    } catch (err) {
      // Unreadable is not "not ours": the launch keeps its last view, or its last empty read. A read the session had
      // no time left to start asked toncenter nothing, so only the others count as failed.
      unread.push(launch);
      if (err instanceof BudgetSpentError) return;
      failing.set(key, { times: (failing.get(key)?.times ?? 0) + 1, at: Date.now() });
      failed++;
      reason ||= errorText(err);
    }
  });
  const listed = new Set(launches.map((l) => keyOf(l.address)));
  for (const key of lastRead.keys()) if (!listed.has(key)) lastRead.delete(key);
  for (const key of lastEmpty.keys()) if (!listed.has(key)) lastEmpty.delete(key);
  for (const key of failing.keys()) if (!listed.has(key)) failing.delete(key);
  /** A view read before this is too old to show. Reads of this refresh are all newer. */
  const oldest = failed > 0 ? now - FILL_MAX_AGE_MS : Number.NEGATIVE_INFINITY;
  const shown = (key: string) => {
    const last = lastRead.get(key);
    return last !== undefined && last.at >= oldest ? last.view : undefined;
  };
  let missing = 0;
  for (const launch of unread) {
    const key = keyOf(launch.address);
    if (shown(key)) continue;
    // Missing: a launch never read here, a token whose last view is too old, or a launch last read as empty while it
    // may have been deploying (it may be a token now). One that read as empty is refreshed sooner while it may still
    // be deploying; once read as empty after its first minute it is no token of ours.
    const empty = lastEmpty.get(key);
    if (empty === undefined) missing++;
    else if (mayBeDeploying(launch, Date.now())) deploying++;
    else if (mayBeDeploying(launch, empty)) missing++;
  }
  if (failed > 0) console.warn(`[tokens] ${failed} of ${launches.length} token reads failed, ${missing} left out (${reason})`);
  const tokens = launches.map((l) => shown(keyOf(l.address))).filter((v): v is TokenView => v !== undefined);
  return { tokens, partial: missing > 0, short: missing > 0 || deploying > 0, listedAt: now };
}

/** One refresh at a time per instance: requests that arrive meanwhile wait for it instead of reading the chain too. */
function refresh(factory: Address): Promise<Listing> {
  refreshing ??= readListing(factory).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/**
 * GET /api/tokens: the factory's launches, newest first. A token a refresh does not read is shown as last read on this
 * instance, but only from the last 30 minutes once a read of that refresh failed; one never read here, or not in that
 * time, is left out and the list says `partial: true`.
 * A list is cached here for 20 s (15 s at the edge), or for 5 s when it is partial or a launch may still be deploying.
 * When the factory's history cannot be read, the last list is served again if it was read in the last 5 minutes;
 * otherwise, as with no list yet, 503 (Retry-After).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const factory = serverFactory();
  if (!factory) return res.status(200).json({ configured: false, tokens: [] });

  try {
    if (!cache || Date.now() > cache.expiresAt) {
      try {
        const listing = await refresh(factory);
        cache = { ...listing, expiresAt: Date.now() + (listing.short ? SHORT_MS : LIST_MS) };
      } catch (err) {
        if (!cache || Date.now() - cache.listedAt > LIST_MAX_AGE_MS) throw err;
        console.warn(`[tokens] serving the last list again: ${errorText(err)}`);
        cache = { ...cache, short: true, expiresAt: Date.now() + SHORT_MS };
      }
    }
    res.setHeader('Cache-Control', cache.short ? SHORT_CACHE : LIST_CACHE);
    const body = { configured: true, tokens: cache.tokens };
    return res.status(200).json(cache.partial ? { ...body, partial: true } : body);
  } catch (err) {
    if (err instanceof ChainUnavailableError) return chainUnavailable(res, 'tokens', err);
    return serverError(res, 'tokens', err);
  }
}
