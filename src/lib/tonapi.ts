import { CONFIG } from './config';

const headers = (): HeadersInit => {
  const h: HeadersInit = { Accept: 'application/json' };
  const key = import.meta.env.VITE_TONAPI_KEY;
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
};

export type LaunchpadToken = {
  jettonAddress: string;
  curveAddress: string;
  creator: string;
  name: string;
  symbol: string;
  raisedTon: number;
  graduated: boolean;
  progressBps: number;
};

export type JettonBalance = {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  image?: string;
};

/** Fetch account jetton balances for My Tokens page */
export async function fetchWalletJettons(walletAddress: string): Promise<JettonBalance[]> {
  const url = `${CONFIG.tonApiBase}/v2/accounts/${encodeURIComponent(walletAddress)}/jettons`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    balances?: Array<{
      jetton: { address: string; symbol?: string; name?: string; image?: string };
      balance: string;
    }>;
  };
  return (data.balances ?? []).map((b) => ({
    address: b.jetton.address,
    symbol: b.jetton.symbol ?? '???',
    name: b.jetton.name ?? b.jetton.symbol ?? 'Unknown',
    balance: b.balance,
    image: b.jetton.image,
  }));
}

/** Poll transaction until confirmed or timeout */
export async function waitForTx(hash: string, timeoutMs = 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${CONFIG.tonApiBase}/v2/blockchain/transactions/${hash}`, {
        headers: headers(),
      });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

/** Launchpad tokens from local index API (backed by file/KV store) */
export async function fetchLaunchpadTokens(): Promise<LaunchpadToken[]> {
  try {
    const res = await fetch('/api/tokens');
    if (!res.ok) return [];
    return (await res.json()) as LaunchpadToken[];
  } catch {
    return [];
  }
}

/** Register a newly created token in the index */
export async function registerToken(token: LaunchpadToken, authToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(token),
    });
    return res.ok;
  } catch {
    return false;
  }
}
