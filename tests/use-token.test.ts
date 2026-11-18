import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { launchpadToToken, registerLiveTokens, useToken } from '../src/data/tokens';
import type { TokenView } from '../src/lib/launchpadApi';

// useToken runs in a real React root (react-dom/client) on a stand-in container: these tests need no DOM, only the
// few window and document fields React reads. Time and /api/tokens/:address are scripted.
const win = vi.hoisted(() => {
  const g = globalThis as Record<string, unknown>;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const noop = () => undefined;
  const document = { addEventListener: noop, removeEventListener: noop, activeElement: null, body: null, defaultView: null as unknown };
  const window = { event: undefined, location: { origin: 'http://localhost' }, document, HTMLIFrameElement: class {} };
  document.defaultView = window;
  g.window = window;
  return window;
});

const view = (address: string, tradeCount = 0): TokenView => ({
  address,
  creator: 'creator',
  name: `Token ${address}`,
  symbol: 'TKN',
  description: '',
  image: '',
  telegram: '',
  virtualTon: String(30_000_000_000 + tradeCount * 1_000_000_000),
  virtualTokens: '1000000000000000000',
  realTonRaised: String(tradeCount * 1_000_000_000),
  totalSupply: '0',
  graduationTarget: '1500000000000',
  progressBps: 0,
  graduated: false,
  migrated: false,
  tradeCount,
  dexRouter: 'router',
});

type Step = { delay?: number; status: number; body?: unknown };
type Lookup = { address: string; holder: string | null; start: number; end: number | null };

/** /api/tokens/:address answers with `reply(address, holder, n)`, n counting that address's lookups from 0. */
function api(reply: (address: string, holder: string | null, n: number) => Step) {
  const lookups: Lookup[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(input, 'http://localhost');
      const address = decodeURIComponent(url.pathname.replace('/api/tokens/', ''));
      const holder = url.searchParams.get('holder');
      const step = reply(address, holder, lookups.filter((l) => l.address === address).length);
      const lookup: Lookup = { address, holder, start: Date.now(), end: null };
      lookups.push(lookup);
      await new Promise((resolve) => setTimeout(resolve, step.delay ?? 0));
      lookup.end = Date.now();
      return new Response(JSON.stringify(step.body ?? { error: 'scripted' }), { status: step.status });
    }),
  );
  return lookups;
}

const ok = (v: TokenView, balance?: bigint): Step => ({ status: 200, body: balance === undefined ? { token: v } : { token: v, balance: String(balance) } });
const unavailable: Step = { status: 503, body: { error: 'Chain temporarily unavailable' } };

type Props = { id: string; holder?: string | null; retryNotFound?: boolean };
type Result = ReturnType<typeof useToken>;

/** Renders useToken with `props` and keeps every result it returned. */
async function mount(props: Props) {
  const results: Result[] = [];
  let current = props;
  function Probe(p: Props) {
    results.push(useToken(p.id, p.holder, { retryNotFound: p.retryNotFound }));
    return null;
  }
  const noop = () => undefined;
  const container = { nodeType: 1, nodeName: 'DIV', tagName: 'DIV', ownerDocument: win.document, addEventListener: noop, removeEventListener: noop };
  const root = createRoot(container as unknown as Element);
  const render = (next: Partial<Props>) =>
    act(async () => {
      current = { ...current, ...next };
      root.render(createElement(Probe, current));
    });
  await render({});
  return { results, latest: () => results[results.length - 1], render, unmount: () => act(async () => root.unmount()) };
}

/** Lets `ms` of virtual time pass in small steps, so renders, effects and the timers they set all run in order. */
async function pass(ms: number) {
  for (let t = 0; t < ms; t += 100) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
  }
}

const inFlight = (lookups: Lookup[]) =>
  Math.max(0, ...lookups.map((l) => lookups.filter((o) => o.start <= l.start && (o.end === null || o.end > l.start)).length));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useToken', () => {
  it('retries a failed lookup while a copy from the list is shown, and is live only once a lookup succeeds', async () => {
    registerLiveTokens([launchpadToToken(view('listed', 1))]);
    const lookups = api((_a, _h, n) => (n < 2 ? { delay: 200, ...unavailable } : { delay: 200, ...ok(view('listed', 7)) }));
    const page = await mount({ id: 'listed' });
    expect(page.latest()).toMatchObject({ status: 'ready', live: false, checking: true });
    expect(page.latest().token?.tradeCount).toBe(1);

    await pass(300);
    expect(page.latest()).toMatchObject({ status: 'ready', live: false, checking: false });
    expect(page.latest().token?.tradeCount).toBe(1);

    await pass(11_000);
    expect(page.latest()).toMatchObject({ status: 'ready', live: true, checking: false });
    expect(page.latest().token?.tradeCount).toBe(7);
    expect(lookups.map((l) => [l.start, l.end])).toEqual([
      [0, 200],
      [5200, 5400],
      [10400, 10600],
    ]);
    await page.unmount();
  });

  it('starts the next try 5 s after a slow failure ended, so lookups never overlap', async () => {
    const lookups = api((_a, _h, n) => (n < 2 ? { delay: 7000, ...unavailable } : { delay: 200, ...ok(view('slow', 3)) }));
    const page = await mount({ id: 'slow' });
    expect(page.latest()).toMatchObject({ status: 'loading', checking: true });
    await pass(30_000);
    expect(lookups.map((l) => [l.start, l.end])).toEqual([
      [0, 7000],
      [12000, 19000],
      [24000, 24200],
    ]);
    expect(inFlight(lookups)).toBe(1);
    expect(page.latest()).toMatchObject({ status: 'ready', live: true });
    await page.unmount();
  });

  it('stops after 12 automatic retries in a row, and Try again starts over', async () => {
    const lookups = api(() => unavailable);
    const page = await mount({ id: 'down' });
    await pass(5000 * 14);
    expect(lookups).toHaveLength(13);
    expect(page.latest()).toMatchObject({ status: 'error', live: false, checking: false });

    await act(async () => page.latest().retry());
    expect(page.latest()).toMatchObject({ status: 'loading', checking: true });
    await pass(100);
    expect(page.latest()).toMatchObject({ status: 'error', checking: false });
    expect(lookups).toHaveLength(14);
    await pass(5000);
    expect(lookups).toHaveLength(15);
    await page.unmount();
  });

  it('drops the answer of a lookup for a token the page no longer shows', async () => {
    const lookups = api((address) => (address === 'first' ? { delay: 3000, ...ok(view('first', 1)) } : { delay: 200, ...ok(view('second', 2)) }));
    const page = await mount({ id: 'first' });
    await pass(500);
    const before = page.results.length;
    await page.render({ id: 'second' });
    await pass(4000);
    expect(lookups.map((l) => l.address)).toEqual(['first', 'second']);
    expect(page.results.slice(before).map((r) => r.token?.id ?? null)).not.toContain('first');
    expect(page.latest()).toMatchObject({ status: 'ready', live: true });
    expect(page.latest().token?.id).toBe('second');
    await page.unmount();
  });

  it('never shows the previous token on a page reused for another one', async () => {
    api((address) => (address === 'shown' ? ok(view('shown', 1)) : { status: 404, body: { error: 'Not a launchpad token' } }));
    const page = await mount({ id: 'shown', retryNotFound: true });
    await pass(100);
    expect(page.latest().token?.id).toBe('shown');

    await page.render({ id: 'launched' });
    expect(page.latest().token).toBeUndefined();
    expect(page.latest().status).toBe('loading');
    await pass(100);
    expect(page.latest()).toMatchObject({ token: undefined, status: 'not-found' });
    await page.unmount();
  });

  it('takes a confirmed lookup with apply, and drops an older lookup still running', async () => {
    api((_a, _h, n) => (n === 0 ? ok(view('traded', 5), 1000n) : { delay: 3000, ...ok(view('traded', 5), 1000n) }));
    const page = await mount({ id: 'traded', holder: 'me' });
    await pass(100);
    expect(page.latest()).toMatchObject({ live: true, balance: 1000n });

    await act(async () => void page.latest().refresh());
    expect(page.latest().checking).toBe(true);
    await act(async () => page.latest().apply({ token: view('traded', 6), balance: 500n }));
    expect(page.latest()).toMatchObject({ live: true, checking: false, balance: 500n });
    expect(page.latest().token?.tradeCount).toBe(6);

    await pass(4000);
    expect(page.latest()).toMatchObject({ live: true, balance: 500n });
    expect(page.latest().token?.tradeCount).toBe(6);
    await page.unmount();
  });

  it('ignores apply and refresh from before a wallet change, and keeps the new lookup', async () => {
    const lookups = api((_a, holder) =>
      holder === 'first-wallet' ? ok(view('held', 5), 1n) : { delay: 3000, ...ok(view('held', 5), 2n) },
    );
    const page = await mount({ id: 'held', holder: 'first-wallet' });
    await pass(100);
    const earlier = page.latest();
    expect(earlier).toMatchObject({ live: true, balance: 1n });

    await page.render({ holder: 'second-wallet' });
    expect(page.latest()).toMatchObject({ balance: null, live: false, checking: true });
    await act(async () => {
      earlier.apply({ token: view('held', 9), balance: 99n });
      void earlier.refresh();
    });
    expect(page.latest()).toMatchObject({ balance: null, checking: true });
    expect(page.latest().token?.tradeCount).toBe(5);

    await pass(3100);
    expect(page.latest()).toMatchObject({ balance: 2n, live: true, checking: false });
    expect(lookups.map((l) => l.holder)).toEqual(['first-wallet', 'second-wallet']);
    await page.unmount();
  });

  it('ignores apply and refresh from an earlier visit to the same wallet, after the page comes back to it', async () => {
    // n counts the lookups of this address: the first wallet, the second, then the first again (a trade landed).
    const lookups = api((_a, holder, n) =>
      holder === 'second-wallet' ? ok(view('held', 5), 2n) : n === 0 ? ok(view('held', 5), 1n) : ok(view('held', 7), 3n),
    );
    const page = await mount({ id: 'held', holder: 'first-wallet' });
    await pass(100);
    const earlier = page.latest();
    expect(earlier).toMatchObject({ live: true, balance: 1n });

    await page.render({ holder: 'second-wallet' });
    await pass(100);
    await page.render({ holder: 'first-wallet' });
    await pass(100);
    expect(page.latest()).toMatchObject({ live: true, checking: false, balance: 3n });
    expect(page.latest().token?.tradeCount).toBe(7);

    // A trade confirmed during the first visit arrives late: its snapshot is older than what the page shows now.
    await act(async () => {
      earlier.apply({ token: view('held', 6), balance: 2n });
      void earlier.refresh();
    });
    expect(page.latest()).toMatchObject({ live: true, checking: false, balance: 3n });
    expect(page.latest().token?.tradeCount).toBe(7);
    expect(lookups.map((l) => l.holder)).toEqual(['first-wallet', 'second-wallet', 'first-wallet']);
    await page.unmount();
  });

  it('reads a mangled address (HTTP 400) as not found, without retrying', async () => {
    const lookups = api(() => ({ status: 400, body: { error: 'Invalid token address' } }));
    const page = await mount({ id: 'not-an-address' });
    await pass(20_000);
    expect(page.latest()).toMatchObject({ status: 'not-found', token: undefined });
    expect(lookups).toHaveLength(1);
    await page.unmount();
  });
});
