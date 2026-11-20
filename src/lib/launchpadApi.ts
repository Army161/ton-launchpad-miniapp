/** Client for the app's own /api endpoints. Failures resolve to an 'error' result, never throw. */

export type TokenView = {
  address: string;
  creator: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  /** Creator's project links; each is '' or a link the API checked (ADR-013). */
  telegram: string;
  website: string;
  twitter: string;
  youtube: string;
  instagram: string;
  facebook: string;
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

/**
 * The launchpad's tokens. 'error': the list could not be loaded (the API could not read the chain, or no answer),
 * which is not the same as no tokens. `partial`: the API could not read some tokens yet and left them out.
 */
export type TokenList = { status: 'ok'; tokens: TokenView[]; partial: boolean } | { status: 'error' };

/**
 * A request to the app's API still running after this long has stalled (the API answers within about 10 s). It is
 * aborted and reads as an error, so a page retries it or gives up instead of waiting for good.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Runs `request` with a signal that aborts it after REQUEST_TIMEOUT_MS, and fails it then even if it ignores that. */
async function withinTimeout<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('request timed out'));
    }, REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([request(controller.signal), stalled]);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLaunchpadTokens(): Promise<TokenList> {
  try {
    return await withinTimeout<TokenList>(async (signal) => {
      const res = await fetch('/api/tokens', { signal });
      if (!res.ok) return { status: 'error' };
      const data = (await res.json()) as { tokens?: TokenView[]; partial?: boolean };
      return { status: 'ok', tokens: data.tokens ?? [], partial: data.partial === true };
    });
  } catch {
    return { status: 'error' };
  }
}

export type TokenLookup =
  | { status: 'ok'; token: TokenView; balance: bigint | null }
  | { status: 'not-found' }
  | { status: 'error' };

export async function fetchLaunchpadToken(address: string, holder?: string | null): Promise<TokenLookup> {
  try {
    const qs = holder ? `?holder=${encodeURIComponent(holder)}` : '';
    return await withinTimeout<TokenLookup>(async (signal) => {
      const res = await fetch(`/api/tokens/${encodeURIComponent(address)}${qs}`, { signal });
      // 400: not a TON address at all (a mangled link), which no retry can fix.
      if (res.status === 404 || res.status === 400) return { status: 'not-found' };
      if (!res.ok) return { status: 'error' };
      const data = (await res.json()) as { token: TokenView; balance?: string };
      return { status: 'ok', token: data.token, balance: data.balance != null ? BigInt(data.balance) : null };
    });
  } catch {
    return { status: 'error' };
  }
}

/**
 * Polls the token every 3 s until `done` holds, e.g. its trade count moved past the one seen before sending, and
 * returns that lookup; null once `timeoutMs` has passed. A lookup that stalls is cut off after REQUEST_TIMEOUT_MS, so
 * the wait always ends, at most about 18 s after `timeoutMs` (a lookup that started just before it).
 */
export async function waitForToken(
  address: string,
  done: (l: Extract<TokenLookup, { status: 'ok' }>) => boolean,
  holder?: string | null,
  timeoutMs = 90_000,
): Promise<Extract<TokenLookup, { status: 'ok' }> | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const l = await fetchLaunchpadToken(address, holder);
    if (l.status === 'ok' && done(l)) return l;
  }
  return null;
}
