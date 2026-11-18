import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Address, beginCell } from '@ton/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LaunchpadJetton, type CurveState, type JettonData } from '../src/contracts/LaunchpadJetton';
import { buildOnchainContent } from '../src/lib/metadata';

// GET /api/tokens over the real chain session and chain reads. Only TonClient is a stand-in: it answers each request
// after a fixed latency, on fake timers. So the request spacing, the 7 s budget, the read order and the list's read
// concurrency all take part, and these tests pin how many tokens one refresh can list (docs/ARCHITECTURE.md).

const FACTORY = Address.parse('EQD__________________________________________0vo');
const CREATOR = Address.parse('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI');
const T0 = Date.UTC(2026, 10, 18);
const NOTHING_DEPLOYED = 'Unable to execute get method. Got exit_code: -13';

const toncenter = vi.hoisted(() => ({
  /** Time toncenter takes to answer a getter, and the factory's transactions. */
  getterMs: 200,
  historyMs: 600,
  /** Curve state and jetton data per raw address; a launch missing here reads as "nothing deployed". */
  tokens: new Map<string, { state: unknown; data: unknown }>(),
  transactions: [] as unknown[],
  requests: 0,
}));

vi.mock('@ton/ton', () => {
  const answer = async <T>(ms: number, value: () => T) => {
    toncenter.requests++;
    await new Promise((resolve) => setTimeout(resolve, ms));
    return value();
  };
  return {
    TonClient: class {
      open(contract: { address: Address }) {
        const token = () => toncenter.tokens.get(contract.address.toRawString());
        return {
          getGetCurveState: () =>
            answer(toncenter.getterMs, () => {
              const t = token();
              if (!t) throw new Error(NOTHING_DEPLOYED);
              return t.state;
            }),
          getGetJettonData: () => answer(toncenter.getterMs, () => token()?.data),
        };
      }
      getTransactions() {
        return answer(toncenter.historyMs, () => toncenter.transactions);
      }
    },
  };
});

const curveState = (salt: bigint): CurveState => ({
  $$type: 'CurveState',
  factory: FACTORY,
  creator: CREATOR,
  salt,
  treasury: CREATOR,
  liquidityManager: CREATOR,
  dex: { $$type: 'DexConfig', router: FACTORY, ptonWallet: FACTORY },
  initialized: true,
  virtualTon: 30_000_000_000n,
  virtualTokens: 10n ** 18n,
  realTonRaised: 0n,
  totalSupply: 0n,
  graduated: false,
  migrated: false,
  graduationTarget: 1_500_000_000_000n,
  totalCreatorFees: 0n,
  totalPlatformFees: 0n,
  tradeCount: 0n,
  progressBps: 0n,
  totalReferrerFees: 0n,
});

const jettonData = (n: number): JettonData => ({
  $$type: 'JettonData',
  totalSupply: 0n,
  mintable: true,
  adminAddress: null,
  content: buildOnchainContent({ name: `Token ${n}`, symbol: `TK${n}`, description: '', image: 'https://img.example/t.png' }),
  walletCode: beginCell().endCell(),
});

/**
 * The factory's history: `count` launched tokens, newest first, an hour old or more, and before them `empty` newer
 * launches whose jetton never deployed (a setup that bounced). Returns the tokens' raw addresses.
 */
async function factoryWith(count: number, empty = 0) {
  toncenter.tokens.clear();
  const tokens: Address[] = [];
  for (let n = 1; n <= count; n++) {
    const salt = BigInt(n);
    const { address } = await LaunchpadJetton.fromInit(FACTORY, CREATOR, salt);
    toncenter.tokens.set(address.toRawString(), { state: curveState(salt), data: jettonData(n) });
    tokens.push(address);
  }
  const bounced = Array.from({ length: empty }, (_, i) => Address.parse(`0:${(i + 1).toString(16).padStart(64, 'e')}`));
  const setup = (dest: Address, i: number) => ({
    now: Math.floor(T0 / 1000) - 3600 - i * 60,
    outMessages: { values: () => [{ info: { type: 'internal', dest }, body: beginCell().storeUint(0x4c500002, 32).endCell() }] },
  });
  toncenter.transactions = [...bounced, ...tokens].map(setup);
  return tokens.map((a) => a.toRawString());
}

type Answer = { status: number; headers: Record<string, string>; body: { tokens: { address: string }[]; partial?: boolean } };

/** One GET /api/tokens, with virtual time running until it has surely answered (a refresh ends within 7.25 s). */
async function get(handler: (req: VercelRequest, res: VercelResponse) => unknown): Promise<Answer> {
  const answer = { status: 200, headers: {}, body: undefined } as unknown as Answer;
  const res = {
    setHeader(name: string, value: string) {
      answer.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      answer.status = code;
      return res;
    },
    json(body: Answer['body']) {
      answer.body = body;
      return res;
    },
  };
  const done = handler({ method: 'GET', query: {} } as unknown as VercelRequest, res as unknown as VercelResponse);
  await vi.advanceTimersByTimeAsync(8000);
  await done;
  return answer;
}

/** A fresh instance: new modules, so no list, no last reads, no metadata cache and a full retry budget. */
async function freshInstance() {
  vi.resetModules();
  return (await import('../api/tokens/index')).default;
}

/** GET /api/tokens every time the last list's cache runs out; returns how many tokens each list had. */
async function refreshes(handler: Awaited<ReturnType<typeof freshInstance>>, times: number) {
  const listed: { count: number; partial: boolean }[] = [];
  for (let i = 0; i < times; i++) {
    const { status, body } = await get(handler);
    expect(status).toBe(200);
    listed.push({ count: body.tokens.length, partial: body.partial === true });
    await vi.advanceTimersByTimeAsync(20_000); // past the 5 s (partial) and the 20 s (complete) cache
  }
  return listed;
}

beforeEach(() => {
  vi.useFakeTimers({ now: T0 });
  vi.stubEnv('TON_NETWORK', 'mainnet');
  vi.stubEnv('FACTORY_ADDRESS', FACTORY.toString());
  toncenter.requests = 0;
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/tokens progress per refresh', () => {
  it('without a key, lists 2 more new tokens per refresh until it lists them all', async () => {
    vi.stubEnv('TONCENTER_API_KEY', '');
    const tokens = await factoryWith(9);
    const listed = await refreshes(await freshInstance(), 6);
    expect(listed).toEqual([
      { count: 2, partial: true },
      { count: 4, partial: true },
      { count: 6, partial: true },
      { count: 8, partial: true },
      { count: 9, partial: false },
      { count: 9, partial: false },
    ]);
    const { body } = await get(await freshInstance());
    expect(body.tokens.map((t) => Address.parse(t.address).toRawString())).toEqual(tokens.slice(0, 2)); // newest first
  });

  it('without a key, launches that never deployed cannot keep the tokens out of the list', async () => {
    vi.stubEnv('TONCENTER_API_KEY', '');
    await factoryWith(4, 6);
    const listed = await refreshes(await freshInstance(), 5);
    // The 6 newest launches never deployed. The first refresh spends its budget on them, as they might still be
    // deploying for all it knows; after that they take their turn by when they were read, behind the tokens.
    expect(listed).toEqual([
      { count: 0, partial: true },
      { count: 1, partial: true },
      { count: 3, partial: true },
      { count: 4, partial: false },
      { count: 4, partial: false },
    ]);
  });

  it('with a key, lists 22 more new tokens per refresh', async () => {
    vi.stubEnv('TONCENTER_API_KEY', 'a-key');
    await factoryWith(60);
    const listed = await refreshes(await freshInstance(), 4);
    expect(listed).toEqual([
      { count: 22, partial: true },
      { count: 44, partial: true },
      { count: 60, partial: false },
      { count: 60, partial: false },
    ]);
  });
});
