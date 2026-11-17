import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { LaunchpadJetton } from '../../src/contracts/LaunchpadJetton.js';
import { JettonWallet } from '../../src/contracts/JettonWallet.js';
import { parseOnchainContent } from '../../src/lib/metadata.js';
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
  telegram: string;
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

  const data = await chain.call((c) => c.open(jetton).getGetJettonData());
  const meta = parseOnchainContent(data.content) ?? {};
  return {
    address: friendly(address),
    creator: friendly(state.creator),
    name: meta.name ?? '',
    symbol: meta.symbol ?? '',
    description: meta.description ?? '',
    image: meta.image ?? '',
    telegram: meta.telegram ?? '',
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

/** Addresses of jettons the factory has set up, newest first. */
export async function listLaunchAddresses(factory: Address, limit = 100, chain: ChainSession = chainSession()): Promise<Address[]> {
  const txs = await chain.call((c) => c.getTransactions(factory, { limit, archival: true }));
  const seen = new Map<string, Address>();
  for (const tx of txs) {
    for (const msg of tx.outMessages.values()) {
      if (msg.info.type !== 'internal') continue;
      const body = msg.body.beginParse();
      if (body.remainingBits < 32 || body.loadUint(32) !== OP_JETTON_SETUP) continue;
      const key = msg.info.dest.toRawString();
      if (!seen.has(key)) seen.set(key, msg.info.dest);
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
