/** Client for the app's own /api endpoints. Failures resolve to an 'error' result, never throw. */

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
  /** STON.fi router the token graduates to; part of every holder's wallet address. */
  dexRouter: string;
};

/**
 * The launchpad's tokens. 'error': the list could not be loaded (the API could not read the chain, or no answer),
 * which is not the same as no tokens. `partial`: the API could not read some tokens yet and left them out.
 */
export type TokenList = { status: 'ok'; tokens: TokenView[]; partial: boolean } | { status: 'error' };

export async function fetchLaunchpadTokens(): Promise<TokenList> {
  try {
    const res = await fetch('/api/tokens');
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as { tokens?: TokenView[]; partial?: boolean };
    return { status: 'ok', tokens: data.tokens ?? [], partial: data.partial === true };
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
    const res = await fetch(`/api/tokens/${encodeURIComponent(address)}${qs}`);
    // 400: not a TON address at all (a mangled link), which no retry can fix.
    if (res.status === 404 || res.status === 400) return { status: 'not-found' };
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as { token: TokenView; balance?: string };
    return { status: 'ok', token: data.token, balance: data.balance != null ? BigInt(data.balance) : null };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Polls the token until `done` holds, e.g. its trade count moved past the one
 * seen before sending. Returns the last lookup, or null on timeout.
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
