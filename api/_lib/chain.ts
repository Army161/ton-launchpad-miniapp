import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { LaunchpadJetton } from '../../src/contracts/LaunchpadJetton';
import { JettonWallet } from '../../src/contracts/JettonWallet';
import { parseOnchainContent } from '../../src/lib/metadata';

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

let client: TonClient | null = null;
export function tonClient(): TonClient {
  if (!client) {
    const endpoint =
      serverNetwork() === 'testnet'
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC';
    client = new TonClient({ endpoint, apiKey: process.env.TONCENTER_API_KEY || undefined, timeout: 8000 });
  }
  return client;
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
};

const friendly = (a: Address) => a.toString({ bounceable: true, testOnly: serverNetwork() === 'testnet' });

/**
 * Reads a jetton and proves it came from our factory: the curve must name our
 * factory, and its address must be the one the factory derives for
 * (creator, salt). Anything else returns null, so a look-alike contract can
 * never be listed.
 */
export async function readLaunchpadToken(address: Address, factory: Address): Promise<TokenView | null> {
  const jetton = tonClient().open(LaunchpadJetton.fromAddress(address));
  const state = await jetton.getGetCurveState();
  if (!state.initialized || !state.factory.equals(factory)) return null;
  const expected = await LaunchpadJetton.fromInit(factory, state.creator, state.salt);
  if (!expected.address.equals(address)) return null;

  const data = await jetton.getGetJettonData();
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
  };
}

export async function readHolderBalance(jetton: Address, owner: Address): Promise<bigint> {
  const wallet = await JettonWallet.fromInit(owner, jetton);
  const c = tonClient();
  if (!(await c.isContractDeployed(wallet.address))) return 0n;
  return (await c.open(wallet).getGetWalletData()).balance;
}

/** Addresses of jettons the factory has set up, newest first. */
export async function listLaunchAddresses(factory: Address, limit = 100): Promise<Address[]> {
  const txs = await tonClient().getTransactions(factory, { limit, archival: true });
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

/** Run async work with bounded concurrency (toncenter rate limits). */
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
