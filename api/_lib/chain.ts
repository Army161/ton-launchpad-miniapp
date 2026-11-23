import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { LaunchpadJetton } from '../../src/contracts/LaunchpadJetton.js';
import { JettonWallet } from '../../src/contracts/JettonWallet.js';
import { isValidLink, LINK_KEYS, METADATA_LIMITS, parseOnchainContent, type LinkKey } from '../../src/lib/metadata.js';
import { callPolicy, getterExitCode, toncenterSession, type ToncenterSession } from './toncenter.js';

const OP_JETTON_SETUP = 0x4c500002;

export type Network = 'mainnet' | 'testnet';

export function serverNetwork(): Network {
  const n = process.env.TON_NETWORK ?? process.env.VITE_NETWORK ?? 'mainnet';
  return n === 'testnet' ? 'testnet' : 'mainnet';
}

export function serverFactory(): Address | null {
  const raw = process.env.FACTORY_ADDRESS ?? process.env.VITE_FACTORY_ADDRESS;
  if (!raw || raw === 'PENDING_DEPLOY') return null;
  try {
    return Address.parse(raw);
  } catch {
    return null;
  }
}

export type ChainSession = ToncenterSession<TonClient>;

/**
 * One API invocation's access to the chain. Create one per request and pass it to every read below: the reads then
 * share toncenter spacing, retries and one time budget (`api/_lib/toncenter.ts`). When toncenter cannot answer, a
 * read throws ChainUnavailableError.
 */
export function chainSession(): ChainSession {
  const endpoint =
    serverNetwork() === 'testnet'
      ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
      : 'https://toncenter.com/api/v2/jsonRPC';
  const apiKey = process.env.TONCENTER_API_KEY?.trim() || undefined;
  // A client per attempt, so each attempt's HTTP timeout can be cut to what is left of the budget.
  return toncenterSession((timeout) => new TonClient({ endpoint, apiKey, timeout }), callPolicy(apiKey));
}

/** JSON-safe token view. All amounts are nano strings. */
export type TokenView = {
  address: string;
  creator: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  /** Creator's project links (ADR-013); each is '' or a link that passed isValidLink. */
  telegram: string;
  website: string;
  twitter: string;
  virtualTon: string;
  virtualTokens: string;
  realTonRaised: string;
  totalSupply: string;
  graduationTarget: string;
  progressBps: number;
  graduated: boolean;
  migrated: boolean;
  tradeCount: number;
  /** STON.fi router the token graduates to; part of every holder's wallet address. */
  dexRouter: string;
};

const friendly = (a: Address) => a.toString({ bounceable: true, testOnly: serverNetwork() === 'testnet' });

type TokenMetadata = Pick<TokenView, 'name' | 'symbol' | 'description' | 'image' | LinkKey>;

/**
 * Jetton content of each token this instance has read, by raw address. The factory's JettonSetup writes it once,
 * when the curve becomes initialized, and nothing changes it afterwards, so get_jetton_data is read once per token
 * and every later read of the token is a single request.
 */
const metadataCache = new Map<string, TokenMetadata>();
/** Bounds the memory one instance spends on it; the oldest entry goes first (a Map keeps insertion order). */
const METADATA_CACHE_LIMIT = 1000;

/**
 * Creator-chosen text, held to the Create page's limits: a launch made outside the app can store far more, and that
 * would bloat the cache and every list. Text is cut (by code point); a URL over its limit is dropped, since a cut
 * one would be broken.
 */
const cut = (text: string | undefined, max: number) => Array.from(text ?? '').slice(0, max).join('');
const url = (text: string | undefined) => (text !== undefined && text.length <= METADATA_LIMITS.url ? text : '');
/** A link is shown only when it passes the Create page's check, so a launch made outside the app cannot list a
 *  javascript: or look-alike link (SECURITY #31). */
const link = (key: LinkKey, text: string | undefined) => (text !== undefined && isValidLink(key, text) ? text : '');
const links = (content: Partial<Record<LinkKey, string>>) =>
  Object.fromEntries(LINK_KEYS.map((key) => [key, link(key, content[key])])) as Record<LinkKey, string>;

/**
 * Reads a jetton and proves it came from our factory: the curve must name our
 * factory, and its address must be the one the factory derives for
 * (creator, salt). Anything else returns null, so a look-alike contract can
 * never be listed. A getter exit code (no such getter, or no contract at the
 * address) also returns null. When the chain cannot be read, this throws
 * ChainUnavailableError rather than calling the token unknown.
 */
export async function readLaunchpadToken(address: Address, factory: Address, chain: ChainSession = chainSession()): Promise<TokenView | null> {
  // The factory derives every token in the basechain; skip the requests for any other workchain.
  if (address.workChain !== 0) return null;
  const jetton = LaunchpadJetton.fromAddress(address);
  const state = await chain.call((c) => c.open(jetton).getGetCurveState()).catch((e: unknown) => {
    if (getterExitCode(e) !== null) return null;
    throw e;
  });
  if (!state || !state.initialized || !state.factory.equals(factory)) return null;
  const expected = await LaunchpadJetton.fromInit(factory, state.creator, state.salt);
  if (!expected.address.equals(address)) return null;

  const key = address.toRawString();
  let meta = metadataCache.get(key);
  if (!meta) {
    const data = await chain.call((c) => c.open(jetton).getGetJettonData());
    const content = parseOnchainContent(data.content) ?? {};
    meta = {
      name: cut(content.name, METADATA_LIMITS.name),
      symbol: cut(content.symbol, METADATA_LIMITS.symbol),
      description: cut(content.description, METADATA_LIMITS.description),
      image: url(content.image),
      ...links(content),
    };
    if (metadataCache.size >= METADATA_CACHE_LIMIT) metadataCache.delete(metadataCache.keys().next().value as string);
    metadataCache.set(key, meta);
  }
  return {
    address: friendly(address),
    creator: friendly(state.creator),
    ...meta,
    virtualTon: state.virtualTon.toString(),
    virtualTokens: state.virtualTokens.toString(),
    realTonRaised: state.realTonRaised.toString(),
    totalSupply: state.totalSupply.toString(),
    graduationTarget: state.graduationTarget.toString(),
    progressBps: Number(state.progressBps),
    graduated: state.graduated,
    migrated: state.migrated,
    tradeCount: Number(state.tradeCount),
    dexRouter: friendly(state.dex.router),
  };
}

export async function readHolderBalance(jetton: Address, owner: Address, dexRouter: Address, chain: ChainSession = chainSession()): Promise<bigint> {
  const wallet = await JettonWallet.fromInit(owner, jetton, dexRouter);
  if (!(await chain.call((c) => c.isContractDeployed(wallet.address)))) return 0n;
  return (await chain.call((c) => c.open(wallet).getGetWalletData())).balance;
}

/** A jetton the factory has set up, and when (ms since epoch) the factory sent its JettonSetup. */
export type Launch = { address: Address; at: number };

/**
 * Jettons the factory has set up, newest first. The jetton itself is deployed by that JettonSetup, in a later
 * transaction, so for a few seconds after `at` a launch can still read as "nothing deployed".
 */
export async function listLaunches(factory: Address, limit = 100, chain: ChainSession = chainSession()): Promise<Launch[]> {
  const txs = await chain.call((c) => c.getTransactions(factory, { limit, archival: true }));
  const seen = new Map<string, Launch>();
  for (const tx of txs) {
    for (const msg of tx.outMessages.values()) {
      if (msg.info.type !== 'internal') continue;
      const body = msg.body.beginParse();
      if (body.remainingBits < 32 || body.loadUint(32) !== OP_JETTON_SETUP) continue;
      const key = msg.info.dest.toRawString();
      if (!seen.has(key)) seen.set(key, { address: msg.info.dest, at: tx.now * 1000 });
    }
  }
  return [...seen.values()];
}

/** Run async work with bounded concurrency. A shared ChainSession still spaces the requests themselves. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}
