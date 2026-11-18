import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChange24hMap } from '../src/lib/dexscreener';
import { fetchWalletJettons } from '../src/lib/tonapi';
import { fetchLaunchpadToken, fetchLaunchpadTokens, waitForToken } from '../src/lib/launchpadApi';

// Each outage mode an external feed can show. Every client must resolve to an
// empty/null/error result instead of throwing or inventing data.
const outages: Record<string, () => Promise<Response>> = {
  'network error': () => Promise.reject(new TypeError('fetch failed')),
  'HTTP 500': () => Promise.resolve(new Response('oops', { status: 500 })),
  'HTTP 429': () => Promise.resolve(new Response('slow down', { status: 429 })),
  'invalid JSON': () => Promise.resolve(new Response('<html>', { status: 200 })),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe.each(Object.entries(outages))('external feeds fail safe on %s', (_name, respond) => {
  it('DexScreener 24h change resolves to null', async () => {
    vi.stubGlobal('fetch', vi.fn(respond));
    const map = await fetchChange24hMap(['EQA1', 'EQA2']);
    expect([...map.values()]).toEqual([null, null]);
  });

  it('CoinGecko TON price resolves to null', async () => {
    vi.stubGlobal('fetch', vi.fn(respond));
    // Fresh module so the 60 s cache is empty.
    const { fetchTonPrice } = await import('../src/lib/coingecko');
    expect(await fetchTonPrice()).toBeNull();
  });

  it('TonAPI wallet jettons resolve to an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(respond));
    expect(await fetchWalletJettons('EQA1')).toEqual([]);
  });

  it('launchpad API resolves to an error list and an error lookup, never to "no tokens"', async () => {
    vi.stubGlobal('fetch', vi.fn(respond));
    expect(await fetchLaunchpadTokens()).toEqual({ status: 'error' });
    expect(await fetchLaunchpadToken('EQA1')).toEqual({ status: 'error' });
  });
});

describe('launchpad API lookups', () => {
  const json = (body: unknown, status = 200) => () => Promise.resolve(new Response(JSON.stringify(body), { status }));

  it('distinguishes a missing token from an outage', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 404 }))));
    expect(await fetchLaunchpadToken('EQA1')).toEqual({ status: 'not-found' });
    vi.stubGlobal('fetch', vi.fn(json({ error: 'Chain temporarily unavailable' }, 503)));
    expect(await fetchLaunchpadToken('EQA1')).toEqual({ status: 'error' });
  });

  it('reads a mangled address (HTTP 400) as not found, since no retry can fix it', async () => {
    vi.stubGlobal('fetch', vi.fn(json({ error: 'Invalid token address' }, 400)));
    expect(await fetchLaunchpadToken('not-an-address')).toEqual({ status: 'not-found' });
  });

  it('reads a token without a balance as balance unknown', async () => {
    vi.stubGlobal('fetch', vi.fn(json({ token: { address: 'EQA1' } })));
    expect(await fetchLaunchpadToken('EQA1', 'UQB1')).toEqual({ status: 'ok', token: { address: 'EQA1' }, balance: null });
  });

  it('keeps the partial flag of the token list, and reads an unconfigured factory as no tokens', async () => {
    vi.stubGlobal('fetch', vi.fn(json({ configured: true, tokens: [{ address: 'EQA1' }], partial: true })));
    expect(await fetchLaunchpadTokens()).toEqual({ status: 'ok', tokens: [{ address: 'EQA1' }], partial: true });
    vi.stubGlobal('fetch', vi.fn(json({ configured: false, tokens: [] })));
    expect(await fetchLaunchpadTokens()).toEqual({ status: 'ok', tokens: [], partial: false });
  });

  it('reads a 503 from the list as an error, not as an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(json({ error: 'Chain temporarily unavailable' }, 503)));
    expect(await fetchLaunchpadTokens()).toEqual({ status: 'error' });
  });
});

describe('waiting for a trade or launch to show up', () => {
  const token = (tradeCount: number) => ({ address: 'EQA1', tradeCount });
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps polling every 3 s through errors and not-found, and returns the first lookup that shows the change', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    const replies = [
      reply(503, { error: 'Chain temporarily unavailable' }),
      reply(404, { error: 'Not a launchpad token' }),
      reply(200, { token: token(1) }),
      reply(200, { token: token(2), balance: '7' }),
    ];
    const fetch = vi.fn(() => Promise.resolve(replies.shift() ?? reply(500, {})));
    vi.stubGlobal('fetch', fetch);
    let found: unknown = 'waiting';
    void waitForToken('EQA1', (l) => (l.token as unknown as { tradeCount: number }).tradeCount > 1, 'UQB1').then((l) => (found = l));
    await vi.advanceTimersByTimeAsync(9_000);
    expect(found).toBe('waiting');
    await vi.advanceTimersByTimeAsync(3_000);
    expect(found).toEqual({ status: 'ok', token: token(2), balance: 7n });
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('gives up after 90 s, not sooner', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    const fetch = vi.fn(() => Promise.resolve(reply(503, { error: 'Chain temporarily unavailable' })));
    vi.stubGlobal('fetch', fetch);
    let found: unknown = 'waiting';
    void waitForToken('EQA1', () => true).then((l) => (found = l));
    await vi.advanceTimersByTimeAsync(87_000);
    expect(found).toBe('waiting');
    await vi.advanceTimersByTimeAsync(3_000);
    expect(found).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(30);
  });
});
