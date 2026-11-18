import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chainSession } from '../api/_lib/chain';
import { ChainUnavailableError } from '../api/_lib/toncenter';

// chainSession() is the one place that reads TONCENTER_API_KEY and builds TonClients. A stand-in TonClient records
// what each attempt gets, on fake timers, so the key, the spacing and the per-attempt timeout are checked as wired.
const built = vi.hoisted(() => [] as { endpoint: string; apiKey?: string; timeout: number }[]);
vi.mock('@ton/ton', () => ({
  TonClient: class {
    constructor(options: { endpoint: string; apiKey?: string; timeout: number }) {
      built.push(options);
    }
  },
}));

const MAINNET = 'https://toncenter.com/api/v2/jsonRPC';

/** Starts `n` concurrent calls at time 0, runs the clock past the budget, and returns when each call ran. */
async function run(n: number) {
  const session = chainSession();
  const starts: number[] = [];
  const calls = Array.from({ length: n }, () =>
    session
      .call(async () => {
        starts.push(Date.now());
        return 'ok';
      })
      .catch((e: unknown) => e),
  );
  await vi.advanceTimersByTimeAsync(8000);
  return { starts, outcomes: await Promise.all(calls) };
}

beforeEach(() => {
  built.length = 0;
  vi.useFakeTimers({ now: 0 });
  vi.stubEnv('TON_NETWORK', 'mainnet');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('chainSession', () => {
  it('sends TONCENTER_API_KEY and spaces requests 120 ms apart with it', async () => {
    vi.stubEnv('TONCENTER_API_KEY', ' a-key ');
    const { starts } = await run(3);
    expect(starts).toEqual([0, 120, 240]);
    expect(built).toEqual([
      { endpoint: MAINNET, apiKey: 'a-key', timeout: 5000 },
      { endpoint: MAINNET, apiKey: 'a-key', timeout: 5000 },
      { endpoint: MAINNET, apiKey: 'a-key', timeout: 5000 },
    ]);
  });

  it('without a key, spaces requests 1100 ms apart and cuts each timeout to the 7 s budget', async () => {
    vi.stubEnv('TONCENTER_API_KEY', '');
    const { starts, outcomes } = await run(7);
    expect(starts).toEqual([0, 1100, 2200, 3300, 4400, 5500]);
    expect(built.map((o) => o.timeout)).toEqual([5000, 5000, 4800, 3700, 2600, 1500]);
    expect(built.every((o) => o.endpoint === MAINNET && o.apiKey === undefined)).toBe(true);
    expect(outcomes[6]).toBeInstanceOf(ChainUnavailableError);
  });

  it('reads testnet toncenter on testnet', async () => {
    vi.stubEnv('TON_NETWORK', 'testnet');
    vi.stubEnv('TONCENTER_API_KEY', 'a-key');
    await run(1);
    expect(built).toEqual([{ endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC', apiKey: 'a-key', timeout: 5000 }]);
  });
});
