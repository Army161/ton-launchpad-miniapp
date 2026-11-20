import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Address } from '@ton/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Launch, TokenView } from '../api/_lib/chain';

// The chain module is mocked: these tests cover how the endpoints map read results to HTTP answers.
const chain = vi.hoisted(() => ({
  serverFactory: vi.fn(),
  listLaunches: vi.fn(),
  readLaunchpadToken: vi.fn(),
  readHolderBalance: vi.fn(),
}));
vi.mock('../api/_lib/chain', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/_lib/chain')>()),
  ...chain,
}));

const FACTORY = 'EQD__________________________________________0vo';
const WALLET = 'UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI';
const TOKEN_A = `0:${'a'.repeat(64)}`;
const TOKEN_B = `0:${'b'.repeat(64)}`;
const TOKEN_C = `0:${'c'.repeat(64)}`;
const T0 = Date.UTC(2026, 10, 18);
const LONG_AGO = T0 - 3_600_000;

const view = (address: string, tradeCount = 0): TokenView => ({
  address,
  creator: WALLET,
  name: 'Super Doge',
  symbol: 'SDOGE',
  description: '',
  image: '',
  telegram: '',
  website: '',
  twitter: '',
  youtube: '',
  instagram: '',
  facebook: '',
  virtualTon: '30000000000',
  virtualTokens: '1000000000000000000',
  realTonRaised: '0',
  totalSupply: '0',
  graduationTarget: '1500000000000',
  progressBps: 0,
  graduated: false,
  migrated: false,
  tradeCount,
  dexRouter: FACTORY,
});
const launch = (address: string, at = LONG_AGO): Launch => ({ address: Address.parse(address), at });

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;
type Answer = { status: number; headers: Record<string, string>; body: unknown };

async function get(handler: Handler, query: Record<string, string> = {}): Promise<Answer> {
  const answer: Answer = { status: 200, headers: {}, body: undefined };
  const res = {
    setHeader(name: string, value: string) {
      answer.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      answer.status = code;
      return res;
    },
    json(body: unknown) {
      answer.body = body;
      return res;
    },
  };
  await handler({ method: 'GET', query } as unknown as VercelRequest, res as unknown as VercelResponse);
  return answer;
}

/** Fresh endpoint modules per test (index.ts keeps its cache in module state), plus the error class they check. */
async function load() {
  vi.resetModules();
  const { default: tokenHandler } = await import('../api/tokens/[address]');
  const { default: listHandler } = await import('../api/tokens/index');
  const { BudgetSpentError, ChainUnavailableError } = await import('../api/_lib/toncenter');
  return {
    tokenHandler,
    listHandler,
    unavailable: () => new ChainUnavailableError('toncenter: HTTP 429 after 4 attempts'),
    /** A read the session had no time left to start. */
    budgetSpent: () => new BudgetSpentError(),
  };
}

/** Token reads that answer from `views` (raw address → view, null for "not ours", Error to throw) and log the order. */
function readsFrom(views: Record<string, TokenView | null | Error>) {
  const order: string[] = [];
  chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
    const key = a.toRawString();
    order.push(key);
    const v = key in views ? views[key] : view(key);
    if (v instanceof Error) throw v;
    return v;
  });
  return order;
}

const LIST_CACHE = 's-maxage=15, stale-while-revalidate=30';
const SHORT_CACHE = 's-maxage=5, stale-while-revalidate=30';

beforeEach(() => {
  for (const fn of Object.values(chain)) fn.mockReset();
  chain.serverFactory.mockReturnValue(Address.parse(FACTORY));
  vi.setSystemTime(T0);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GET /api/tokens/:address', () => {
  it('answers 404 when the chain says the address is not one of our tokens', async () => {
    const { tokenHandler } = await load();
    chain.readLaunchpadToken.mockResolvedValue(null);
    const answer = await get(tokenHandler, { address: TOKEN_A });
    expect(answer.status).toBe(404);
    expect(answer.body).toEqual({ error: 'Not a launchpad token' });
  });

  it('answers 503 with Retry-After, never 404, when the token read cannot reach toncenter', async () => {
    const { tokenHandler, unavailable } = await load();
    chain.readLaunchpadToken.mockRejectedValue(unavailable());
    const answer = await get(tokenHandler, { address: TOKEN_A });
    expect(answer.status).toBe(503);
    expect(answer.headers['retry-after']).toBe('5');
    expect(answer.headers['cache-control']).toBe('no-store');
    expect(answer.body).toEqual({ error: 'Chain temporarily unavailable' });
  });

  it('answers 200 with the token and no balance when only the holder balance cannot be read', async () => {
    const { tokenHandler, unavailable } = await load();
    chain.readLaunchpadToken.mockResolvedValue(view(TOKEN_A, 4));
    chain.readHolderBalance.mockRejectedValue(unavailable());
    const answer = await get(tokenHandler, { address: TOKEN_A, holder: WALLET });
    expect(answer.status).toBe(200);
    expect(answer.headers['cache-control']).toBe('no-store');
    // JSON drops the undefined balance: the client reads it as "balance unknown".
    expect(JSON.parse(JSON.stringify(answer.body))).toEqual({ token: view(TOKEN_A, 4) });
  });

  it('answers 500 when the holder balance read fails for another reason', async () => {
    const { tokenHandler } = await load();
    chain.readLaunchpadToken.mockResolvedValue(view(TOKEN_A));
    chain.readHolderBalance.mockRejectedValue(new Error('Malformed response: Required'));
    const answer = await get(tokenHandler, { address: TOKEN_A, holder: WALLET });
    expect(answer.status).toBe(500);
  });

  it('answers 200 with the token and the balance, both read in one session', async () => {
    const { tokenHandler } = await load();
    chain.readLaunchpadToken.mockResolvedValue(view(TOKEN_A));
    chain.readHolderBalance.mockResolvedValue(123n);
    const answer = await get(tokenHandler, { address: TOKEN_A, holder: WALLET });
    expect(answer.status).toBe(200);
    expect(answer.headers['cache-control']).toBe('no-store');
    expect(answer.body).toEqual({ token: view(TOKEN_A), balance: '123' });
    const session = chain.readLaunchpadToken.mock.calls[0][2];
    expect(session).toBeDefined();
    expect(chain.readHolderBalance.mock.calls[0][3]).toBe(session);
  });

  it('answers 500 for other errors', async () => {
    const { tokenHandler } = await load();
    chain.readLaunchpadToken.mockRejectedValue(new Error('Malformed response: Required'));
    const answer = await get(tokenHandler, { address: TOKEN_A });
    expect(answer.status).toBe(500);
    expect(answer.body).toEqual({ error: 'Internal error' });
  });
});

describe('GET /api/tokens', () => {
  it('caches a complete list for 20 s', async () => {
    const { listHandler } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({});
    const first = await get(listHandler);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ configured: true, tokens: [view(TOKEN_A), view(TOKEN_B)] });
    expect(first.headers['cache-control']).toBe(LIST_CACHE);

    vi.setSystemTime(T0 + 19_000);
    expect((await get(listHandler)).body).toEqual(first.body);
    expect(chain.listLaunches).toHaveBeenCalledTimes(1);

    vi.setSystemTime(T0 + 21_000);
    await get(listHandler);
    expect(chain.listLaunches).toHaveBeenCalledTimes(2);
  });

  it('shows a token whose read fails as last read, and caches the list as usual', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 1), [TOKEN_B]: view(TOKEN_B, 1) });
    await get(listHandler);

    vi.setSystemTime(T0 + 21_000);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 2), [TOKEN_B]: unavailable() });
    const answer = await get(listHandler);
    expect(answer.body).toEqual({ configured: true, tokens: [view(TOKEN_A, 2), view(TOKEN_B, 1)] });
    expect(answer.headers['cache-control']).toBe(LIST_CACHE);
  });

  it('leaves out a token never read, says partial, caches that for 5 s, then fills the token in', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({ [TOKEN_B]: unavailable() });
    const partial = await get(listHandler);
    expect(partial.status).toBe(200);
    expect(partial.body).toEqual({ configured: true, tokens: [view(TOKEN_A)], partial: true });
    expect(partial.headers['cache-control']).toBe(SHORT_CACHE);

    vi.setSystemTime(T0 + 4_000);
    expect((await get(listHandler)).body).toEqual(partial.body);
    expect(chain.listLaunches).toHaveBeenCalledTimes(1);

    vi.setSystemTime(T0 + 6_000);
    readsFrom({});
    const complete = await get(listHandler);
    expect(complete.body).toEqual({ configured: true, tokens: [view(TOKEN_A), view(TOKEN_B)] });
    expect(complete.headers['cache-control']).toBe(LIST_CACHE);
    expect(chain.listLaunches).toHaveBeenCalledTimes(2);
  });

  it('answers an empty partial list when no token has been read yet', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A)]);
    readsFrom({ [TOKEN_A]: unavailable() });
    const answer = await get(listHandler);
    expect(answer.body).toEqual({ configured: true, tokens: [], partial: true });
    expect(answer.headers['cache-control']).toBe(SHORT_CACHE);
  });

  it('reads the tokens never read first, then the ones read longest ago, and lists them newest first', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_B), launch(TOKEN_A)]);
    readsFrom({});
    await get(listHandler); // A and B read at T0

    vi.setSystemTime(T0 + 21_000);
    chain.listLaunches.mockResolvedValue([launch(TOKEN_C), launch(TOKEN_B), launch(TOKEN_A)]);
    readsFrom({ [TOKEN_B]: unavailable() }); // C and A read at T0 + 21 s, B still from T0
    await get(listHandler);

    vi.setSystemTime(T0 + 42_000);
    const order = readsFrom({});
    const answer = await get(listHandler);
    expect(order).toEqual([TOKEN_B, TOKEN_C, TOKEN_A]);
    expect(answer.body).toEqual({ configured: true, tokens: [view(TOKEN_C), view(TOKEN_B), view(TOKEN_A)] });
  });

  it('reads launches that never deployed in turn with the tokens, so they cannot keep a token out of every list', async () => {
    const { listHandler, unavailable } = await load();
    // B and C were set up long ago and read as empty; A is a token. Each refresh's budget fits two reads.
    let budget = 0;
    chain.listLaunches.mockImplementation(async () => {
      budget = 2;
      return [launch(TOKEN_B), launch(TOKEN_C), launch(TOKEN_A)];
    });
    const order: string[] = [];
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
      const key = a.toRawString();
      order.push(key);
      if (budget-- <= 0) throw unavailable();
      return key === TOKEN_A ? view(TOKEN_A) : null;
    });

    const first = await get(listHandler);
    expect(order).toEqual([TOKEN_B, TOKEN_C, TOKEN_A]);
    expect(first.body).toEqual({ configured: true, tokens: [], partial: true });

    vi.setSystemTime(T0 + 6_000);
    order.length = 0;
    const second = await get(listHandler);
    expect(order).toEqual([TOKEN_A, TOKEN_B, TOKEN_C]);
    // C could not be read this time, but it read as empty before: it is not a missing token.
    expect(second.body).toEqual({ configured: true, tokens: [view(TOKEN_A)] });
    expect(second.headers['cache-control']).toBe(LIST_CACHE);

    vi.setSystemTime(T0 + 27_000);
    order.length = 0;
    const third = await get(listHandler);
    expect(order).toEqual([TOKEN_C, TOKEN_B, TOKEN_A]);
    expect(third.body).toEqual({ configured: true, tokens: [view(TOKEN_A)] });
  });

  it('tries a failed read first again once, then lets a launch whose reads keep failing wait, longer each time up to a minute', async () => {
    const { listHandler, unavailable, budgetSpent } = await load();
    // B and C are newer than token A, and their reads fail until `readable` says otherwise. Each refresh's budget fits
    // two reads.
    let budget = 0;
    const readable = new Set([TOKEN_A]);
    chain.listLaunches.mockImplementation(async () => {
      budget = 2;
      return [launch(TOKEN_B), launch(TOKEN_C), launch(TOKEN_A)];
    });
    const order: string[] = [];
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
      if (budget-- <= 0) throw budgetSpent();
      const key = a.toRawString();
      order.push(key);
      if (readable.has(key)) return view(key);
      throw unavailable();
    });
    const refreshAt = async (ms: number) => {
      vi.setSystemTime(T0 + ms);
      order.length = 0;
      return get(listHandler);
    };

    expect((await refreshAt(0)).body).toEqual({ configured: true, tokens: [], partial: true });
    expect(order).toEqual([TOKEN_B, TOKEN_C]);

    // A single failure keeps a launch first.
    expect((await refreshAt(6_000)).body).toEqual({ configured: true, tokens: [], partial: true });
    expect(order).toEqual([TOKEN_B, TOKEN_C]);

    // B and C have failed twice in a row: they wait 15 s, read after A while they wait.
    expect((await refreshAt(12_000)).body).toEqual({ configured: true, tokens: [view(TOKEN_A)], partial: true });
    expect(order).toEqual([TOKEN_A, TOKEN_B]); // B fails a third time: it now waits 30 s, until 42 s
    await refreshAt(18_000);
    expect(order).toEqual([TOKEN_A, TOKEN_C]); // C, whose wait ends first, also fails a third time: until 48 s

    // B's wait is over: it is read first again, fails a fourth time and waits 60 s. C still waits.
    await refreshAt(43_000);
    expect(order).toEqual([TOKEN_B, TOKEN_A]);

    // C's wait is over and it answers now: it is listed, and no longer waits.
    readable.add(TOKEN_C);
    const listed = await refreshAt(49_000);
    expect(order).toEqual([TOKEN_C, TOKEN_A]);
    expect(listed.body).toEqual({ configured: true, tokens: [view(TOKEN_C), view(TOKEN_A)], partial: true });
    await refreshAt(55_000);
    expect(order).toEqual([TOKEN_C, TOKEN_A]); // both read at 49 s, so the newest first; B waits until 103 s

    // The wait doubles at most to one minute, so a launch that fails often in a rate-limit storm is still tried
    // about once a minute, while one that never answers costs at most one read a minute.
    await refreshAt(103_000);
    expect(order[0]).toBe(TOKEN_B); // fifth failure: 120 s, capped at 60 s
    for (const at of [163_000, 223_000, 283_000]) {
      await refreshAt(at - 6_000); // past the 5 s cache of the last partial list
      expect(order).not.toContain(TOKEN_B);
      await refreshAt(at);
      expect(order[0]).toBe(TOKEN_B);
    }
  });

  it('lists a new token that failed twice within seconds after its wait, not after every other token is read again', async () => {
    const { listHandler, unavailable, budgetSpent } = await load();
    // 20 known tokens, read before T0; each refresh's budget fits two reads. N is launched and fails twice.
    const known = Array.from({ length: 20 }, (_, i) => `0:${(i + 1).toString(16).padStart(64, '0')}`);
    const NEW = `0:${'d'.repeat(64)}`;
    chain.listLaunches.mockImplementation(async () => {
      budget = 2;
      return [launch(NEW), ...known.map((k) => launch(k))];
    });
    let budget = 0;
    let newFails = 2;
    const order: string[] = [];
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
      if (budget-- <= 0) throw budgetSpent();
      const key = a.toRawString();
      order.push(key);
      if (key === NEW && newFails-- > 0) throw unavailable();
      return view(key);
    });
    // Warm up: every known token read once (N is not launched yet).
    chain.listLaunches.mockImplementationOnce(async () => {
      budget = 20;
      return known.map((k) => launch(k));
    });
    vi.setSystemTime(T0 - 60_000);
    await get(listHandler);

    const listedAt: number[] = [];
    for (let at = 0; at <= 60_000; at += 6_000) {
      vi.setSystemTime(T0 + at);
      const answer = await get(listHandler);
      const tokens = (answer.body as { tokens: TokenView[] }).tokens;
      if (tokens.some((t) => t.address === NEW)) listedAt.push(at);
    }
    // Fails at 0 s and 6 s, waits 15 s, read first again at 24 s. Reading every token again would take 10 refreshes.
    expect(listedAt[0]).toBe(24_000);
  });

  it('runs one refresh at a time: requests that arrive meanwhile wait for it', async () => {
    const { listHandler } = await load();
    let release: (launches: Launch[]) => void = () => undefined;
    chain.listLaunches.mockReturnValue(new Promise<Launch[]>((resolve) => (release = resolve)));
    readsFrom({});
    const pending = [get(listHandler), get(listHandler), get(listHandler)];
    release([launch(TOKEN_A)]);
    const answers = await Promise.all(pending);
    expect(chain.listLaunches).toHaveBeenCalledTimes(1);
    expect(chain.readLaunchpadToken).toHaveBeenCalledTimes(1);
    for (const answer of answers) expect(answer.body).toEqual({ configured: true, tokens: [view(TOKEN_A)] });
  });

  it('answers 503 with Retry-After when the factory history cannot be read and no list was read yet', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockRejectedValue(unavailable());
    const answer = await get(listHandler);
    expect(answer.status).toBe(503);
    expect(answer.headers['retry-after']).toBe('5');
    expect(answer.headers['cache-control']).toBe('no-store');
    expect(chain.readLaunchpadToken).not.toHaveBeenCalled();
  });

  it('serves the last list for 5 s when a refresh fails, with one chain refresh for concurrent requests', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A)]);
    readsFrom({});
    const first = await get(listHandler);

    vi.setSystemTime(T0 + 21_000);
    let fail: (err: Error) => void = () => undefined;
    chain.listLaunches.mockReturnValue(new Promise<Launch[]>((_resolve, reject) => (fail = reject)));
    const pending = [get(listHandler), get(listHandler)];
    fail(unavailable());
    for (const answer of await Promise.all(pending)) {
      expect(answer.status).toBe(200);
      expect(answer.body).toEqual(first.body);
      expect(answer.headers['cache-control']).toBe(SHORT_CACHE);
    }
    expect(chain.listLaunches).toHaveBeenCalledTimes(2);

    vi.setSystemTime(T0 + 25_000);
    await get(listHandler);
    expect(chain.listLaunches).toHaveBeenCalledTimes(2);
    vi.setSystemTime(T0 + 27_000);
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A)]);
    expect((await get(listHandler)).headers['cache-control']).toBe(LIST_CACHE);
    expect(chain.listLaunches).toHaveBeenCalledTimes(3);
  });

  it('fills in a failed read only from a view of the last 30 minutes, then leaves the token out and says partial', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 1), [TOKEN_B]: view(TOKEN_B, 1) });
    await get(listHandler);

    readsFrom({ [TOKEN_A]: view(TOKEN_A, 2), [TOKEN_B]: unavailable() });
    vi.setSystemTime(T0 + 1_800_000);
    const filled = await get(listHandler);
    expect(filled.body).toEqual({ configured: true, tokens: [view(TOKEN_A, 2), view(TOKEN_B, 1)] });
    expect(filled.headers['cache-control']).toBe(LIST_CACHE);

    vi.setSystemTime(T0 + 1_821_000);
    const left = await get(listHandler);
    expect(left.body).toEqual({ configured: true, tokens: [view(TOKEN_A, 2)], partial: true });
    expect(left.headers['cache-control']).toBe(SHORT_CACHE);
  });

  it('shows a token the refresh had no time to read as last read, however long ago, while toncenter answers', async () => {
    const { listHandler, unavailable, budgetSpent } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 1), [TOKEN_B]: view(TOKEN_B, 1) });
    await get(listHandler);

    // A quiet instance, an hour later: the refresh reads A and has no time left for B. Nothing failed, so B's round
    // simply has not come yet.
    vi.setSystemTime(T0 + 3_600_000);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 2), [TOKEN_B]: budgetSpent() });
    const quiet = await get(listHandler);
    expect(quiet.body).toEqual({ configured: true, tokens: [view(TOKEN_A, 2), view(TOKEN_B, 1)] });
    expect(quiet.headers['cache-control']).toBe(LIST_CACHE);

    // Once a read fails, toncenter is in trouble: B's hour-old view is left out and the list says partial.
    vi.setSystemTime(T0 + 3_621_000);
    readsFrom({ [TOKEN_A]: unavailable(), [TOKEN_B]: budgetSpent() });
    const troubled = await get(listHandler);
    expect(troubled.body).toEqual({ configured: true, tokens: [view(TOKEN_A, 2)], partial: true });
    expect(troubled.headers['cache-control']).toBe(SHORT_CACHE);
  });

  it('applies the 30-minute limit when no read could start, since only the factory history answered', async () => {
    const { listHandler, budgetSpent } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({ [TOKEN_A]: view(TOKEN_A, 1), [TOKEN_B]: view(TOKEN_B, 1) });
    await get(listHandler);

    // An hour later the history read takes the whole budget (retries after 429s or a timeout): no token read starts.
    vi.setSystemTime(T0 + 3_600_000);
    readsFrom({ [TOKEN_A]: budgetSpent(), [TOKEN_B]: budgetSpent() });
    const stale = await get(listHandler);
    expect(stale.body).toEqual({ configured: true, tokens: [], partial: true });
    expect(stale.headers['cache-control']).toBe(SHORT_CACHE);
  });

  it('serves the last list again only while it was read in the last 5 minutes, then answers 503', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A)]);
    readsFrom({});
    const first = await get(listHandler);

    chain.listLaunches.mockRejectedValue(unavailable());
    vi.setSystemTime(T0 + 300_000);
    const again = await get(listHandler);
    expect(again.status).toBe(200);
    expect(again.body).toEqual(first.body);
    expect(again.headers['cache-control']).toBe(SHORT_CACHE);

    vi.setSystemTime(T0 + 306_000);
    const gone = await get(listHandler);
    expect(gone.status).toBe(503);
    expect(gone.headers['retry-after']).toBe('5');
    expect(gone.headers['cache-control']).toBe('no-store');
  });

  it('caches for 5 s while a launch of the last minute still reads as not deployed, and leaves out an old one for good', async () => {
    const { listHandler } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_B, T0 - 10_000), launch(TOKEN_A)]);
    readsFrom({ [TOKEN_B]: null });
    const deploying = await get(listHandler);
    expect(deploying.body).toEqual({ configured: true, tokens: [view(TOKEN_A)] });
    expect(deploying.headers['cache-control']).toBe(SHORT_CACHE);

    vi.setSystemTime(T0 + 6_000);
    readsFrom({});
    expect((await get(listHandler)).body).toEqual({ configured: true, tokens: [view(TOKEN_B), view(TOKEN_A)] });

    const fresh = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_B), launch(TOKEN_A)]);
    readsFrom({ [TOKEN_B]: null });
    const bounced = await get(fresh.listHandler);
    expect(bounced.body).toEqual({ configured: true, tokens: [view(TOKEN_A)] });
    expect(bounced.headers['cache-control']).toBe(LIST_CACHE);
  });

  it('reads a launch first again while it has only read as not deployed during its first minute, and misses it until then', async () => {
    const { listHandler, budgetSpent } = await load();
    // A and B were read at T0. Each refresh's budget fits `budget` reads; the rest have no time left.
    let budget = 2;
    let launches = [launch(TOKEN_B), launch(TOKEN_A)];
    chain.listLaunches.mockImplementation(async () => launches);
    let deployed = false;
    const order: string[] = [];
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
      const key = a.toRawString();
      order.push(key);
      if (budget-- <= 0) throw budgetSpent();
      return key === TOKEN_C && !deployed ? null : view(key);
    });
    await get(listHandler);

    // C is set up at T0 + 28 s and read 2 s later, before its jetton is deployed.
    vi.setSystemTime(T0 + 30_000);
    launches = [launch(TOKEN_C, T0 + 28_000), launch(TOKEN_B), launch(TOKEN_A)];
    budget = 1;
    order.length = 0;
    const early = await get(listHandler);
    expect(order[0]).toBe(TOKEN_C);
    expect(early.body).toEqual({ configured: true, tokens: [view(TOKEN_B), view(TOKEN_A)] });
    expect(early.headers['cache-control']).toBe(SHORT_CACHE); // C may still be deploying

    // Its first minute is over. That empty read came while it may have been deploying: C may be a token by now, so a
    // refresh with no time for it counts it as missing, and the next one reads it first.
    deployed = true;
    vi.setSystemTime(T0 + 120_000);
    budget = 0;
    const unknown = await get(listHandler);
    expect(unknown.body).toEqual({ configured: true, tokens: [view(TOKEN_B), view(TOKEN_A)], partial: true });
    expect(unknown.headers['cache-control']).toBe(SHORT_CACHE);

    vi.setSystemTime(T0 + 126_000);
    budget = 1;
    order.length = 0;
    const listed = await get(listHandler);
    expect(order[0]).toBe(TOKEN_C);
    expect(listed.body).toEqual({ configured: true, tokens: [view(TOKEN_C), view(TOKEN_B), view(TOKEN_A)] });
    expect(listed.headers['cache-control']).toBe(LIST_CACHE);
  });

  it('reads every token of one request in one session', async () => {
    const { listHandler } = await load();
    chain.listLaunches.mockResolvedValue([launch(TOKEN_A), launch(TOKEN_B)]);
    readsFrom({});
    await get(listHandler);
    const session = chain.listLaunches.mock.calls[0][2];
    expect(session).toBeDefined();
    expect(chain.readLaunchpadToken).toHaveBeenCalledTimes(2);
    for (const call of chain.readLaunchpadToken.mock.calls) expect(call[2]).toBe(session);
  });
});
