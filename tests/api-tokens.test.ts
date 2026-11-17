import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Address } from '@ton/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenView } from '../api/_lib/chain';

// The chain module is mocked: these tests cover how the endpoints map read results to HTTP answers.
const chain = vi.hoisted(() => ({
  serverFactory: vi.fn(),
  listLaunchAddresses: vi.fn(),
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

const view = (address: string): TokenView => ({
  address,
  creator: WALLET,
  name: 'Super Doge',
  symbol: 'SDOGE',
  description: '',
  image: '',
  telegram: '',
  virtualTon: '30000000000',
  virtualTokens: '1000000000000000000',
  realTonRaised: '0',
  totalSupply: '0',
  graduationTarget: '1500000000000',
  progressBps: 0,
  graduated: false,
  migrated: false,
  tradeCount: 0,
  dexRouter: FACTORY,
});

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

/** Fresh endpoint modules per test (index.ts caches in module state), plus the error class they check against. */
async function load() {
  vi.resetModules();
  const { default: tokenHandler } = await import('../api/tokens/[address]');
  const { default: listHandler } = await import('../api/tokens/index');
  const { ChainUnavailableError } = await import('../api/_lib/toncenter');
  return { tokenHandler, listHandler, unavailable: () => new ChainUnavailableError('toncenter: HTTP 429 after 4 attempts') };
}

beforeEach(() => {
  for (const fn of Object.values(chain)) fn.mockReset();
  chain.serverFactory.mockReturnValue(Address.parse(FACTORY));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
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

  it('answers 503 when the holder balance read cannot reach toncenter', async () => {
    const { tokenHandler, unavailable } = await load();
    chain.readLaunchpadToken.mockResolvedValue(view(TOKEN_A));
    chain.readHolderBalance.mockRejectedValue(unavailable());
    const answer = await get(tokenHandler, { address: TOKEN_A, holder: WALLET });
    expect(answer.status).toBe(503);
    expect(answer.headers['retry-after']).toBe('5');
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
  it('caches a complete list', async () => {
    const { listHandler } = await load();
    chain.listLaunchAddresses.mockResolvedValue([Address.parse(TOKEN_A), Address.parse(TOKEN_B)]);
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => view(a.toRawString()));
    const first = await get(listHandler);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ configured: true, tokens: [view(TOKEN_A), view(TOKEN_B)] });
    expect(first.headers['cache-control']).toBe('s-maxage=15, stale-while-revalidate=30');
    const second = await get(listHandler);
    expect(second.body).toEqual(first.body);
    expect(chain.listLaunchAddresses).toHaveBeenCalledTimes(1);
  });

  it('returns a partial list uncached when some token reads fail, and reads the chain again next time', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunchAddresses.mockResolvedValue([Address.parse(TOKEN_A), Address.parse(TOKEN_B)]);
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => {
      if (a.toRawString() === TOKEN_B) throw unavailable();
      return view(a.toRawString());
    });
    const partial = await get(listHandler);
    expect(partial.status).toBe(200);
    expect(partial.body).toEqual({ configured: true, tokens: [view(TOKEN_A)], partial: true });
    expect(partial.headers['cache-control']).toBe('no-store');

    chain.readLaunchpadToken.mockImplementation(async (a: Address) => view(a.toRawString()));
    const complete = await get(listHandler);
    expect(complete.body).toEqual({ configured: true, tokens: [view(TOKEN_A), view(TOKEN_B)] });
    expect(chain.listLaunchAddresses).toHaveBeenCalledTimes(2);
  });

  it('answers 503 with Retry-After when the factory history cannot be read', async () => {
    const { listHandler, unavailable } = await load();
    chain.listLaunchAddresses.mockRejectedValue(unavailable());
    const answer = await get(listHandler);
    expect(answer.status).toBe(503);
    expect(answer.headers['retry-after']).toBe('5');
    expect(answer.headers['cache-control']).toBe('no-store');
    expect(chain.readLaunchpadToken).not.toHaveBeenCalled();
  });

  it('reads every token of one request in one session', async () => {
    const { listHandler } = await load();
    chain.listLaunchAddresses.mockResolvedValue([Address.parse(TOKEN_A), Address.parse(TOKEN_B)]);
    chain.readLaunchpadToken.mockImplementation(async (a: Address) => view(a.toRawString()));
    await get(listHandler);
    const session = chain.listLaunchAddresses.mock.calls[0][2];
    expect(session).toBeDefined();
    expect(chain.readLaunchpadToken).toHaveBeenCalledTimes(2);
    for (const call of chain.readLaunchpadToken.mock.calls) expect(call[2]).toBe(session);
  });
});
