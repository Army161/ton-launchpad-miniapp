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

  it('launchpad API resolves to an empty list and an error lookup', async () => {
    vi.stubGlobal('fetch', vi.fn(respond));
    expect(await fetchLaunchpadTokens()).toEqual([]);
    expect(await fetchLaunchpadToken('EQA1')).toEqual({ status: 'error' });
  });
});

describe('launchpad API lookups', () => {
  it('distinguishes a missing token from an outage', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 404 }))));
    expect(await fetchLaunchpadToken('EQA1')).toEqual({ status: 'not-found' });
  });
});
