/** Client for the app's own /api endpoints. Network failures resolve to empty results. */

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
};

export async function fetchLaunchpadTokens(): Promise<TokenView[]> {
  try {
    const res = await fetch('/api/tokens');
    if (!res.ok) return [];
    const data = (await res.json()) as { tokens?: TokenView[] };
    return data.tokens ?? [];
  } catch {
    return [];
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
    if (res.status === 404) return { status: 'not-found' };
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
