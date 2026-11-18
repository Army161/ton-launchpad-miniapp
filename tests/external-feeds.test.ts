import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChange24hMap } from '../src/lib/dexscreener';
import { fetchWalletJettons } from '../src/lib/tonapi';
import { fetchLaunchpadToken, fetchLaunchpadTokens } from '../src/lib/launchpadApi';

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
