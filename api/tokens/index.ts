import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Address } from '@ton/core';
import { chainSession, listLaunches, mapLimit, readLaunchpadToken, serverFactory, type TokenView } from '../_lib/chain.js';
import { chainUnavailable, serverError } from '../_lib/http.js';
import { ChainUnavailableError } from '../_lib/toncenter.js';

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

type Listing = { tokens: TokenView[]; partial: boolean; short: boolean };

/** Last view read of each listed token (by raw address) and when it was read. Fills in a token whose read fails. */
const lastRead = new Map<string, { view: TokenView; at: number }>();
let cache: (Listing & { expiresAt: number }) | null = null;
let refreshing: Promise<Listing> | null = null;

const errorText = (err: unknown) => (err instanceof Error ? err.message : 'unknown error');
const keyOf = (address: Address) => address.toRawString();
const readAt = (address: Address) => lastRead.get(keyOf(address))?.at ?? 0;

async function readListing(factory: Address): Promise<Listing> {
  const chain = chainSession();
  const launches = await listLaunches(factory, 100, chain);
  // One session fits about 50 requests with TONCENTER_API_KEY (6 without), and a token costs 1 request, or 2 the
  // first time. So read the tokens never read here first, then the ones read longest ago: the budget then leaves
  // the most recently read tokens for the next refresh, and successive refreshes cover every token.
  const order = [...launches].sort((a, b) => readAt(a.address) - readAt(b.address));
  let failed = 0;
  let missing = 0;
  let deploying = 0;
  let reason = '';
  await mapLimit(order, 3, async (launch) => {
    const key = keyOf(launch.address);
    try {
      const view = await readLaunchpadToken(launch.address, factory, chain);
      if (view) {
        lastRead.set(key, { view, at: Date.now() });
      } else {
        lastRead.delete(key);
        if (Date.now() - launch.at < DEPLOYING_MS) deploying++;
      }
    } catch (err) {
      // Unreadable is not "not ours": keep showing the last view read, if there is one.
      failed++;
      reason ||= errorText(err);
      if (!lastRead.has(key)) missing++;
    }
  });
  const listed = new Set(launches.map((l) => keyOf(l.address)));
  for (const key of lastRead.keys()) if (!listed.has(key)) lastRead.delete(key);
  if (failed > 0) console.warn(`[tokens] ${failed} of ${launches.length} token reads failed, ${missing} never read (${reason})`);
  const tokens = launches.map((l) => lastRead.get(keyOf(l.address))?.view).filter((v): v is TokenView => v !== undefined);
  return { tokens, partial: missing > 0, short: missing > 0 || deploying > 0 };
}

/** One refresh at a time per instance: requests that arrive meanwhile wait for it instead of reading the chain too. */
function refresh(factory: Address): Promise<Listing> {
  refreshing ??= readListing(factory).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/**
 * GET /api/tokens: the factory's launches, newest first. A token whose read fails is shown as last read; one never
 * read on this instance is left out and the list says `partial: true`. A list is cached here for 20 s (15 s at the
 * edge), or for 5 s when it is partial or a launch may still be deploying. When the factory's history cannot be read,
 * the last list is served again; with no list yet, 503 (Retry-After).
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
        if (!cache) throw err;
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
