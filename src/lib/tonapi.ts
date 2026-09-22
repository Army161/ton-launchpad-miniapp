import { CONFIG } from './config';

export type JettonBalance = {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  image?: string;
};

/** Jetton balances for the My Tokens page (public TonAPI, no key in the browser). */
export async function fetchWalletJettons(walletAddress: string): Promise<JettonBalance[]> {
  try {
    const url = `${CONFIG.tonApiBase}/v2/accounts/${encodeURIComponent(walletAddress)}/jettons`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      balances?: Array<{
        jetton: { address: string; symbol?: string; name?: string; image?: string; decimals?: number };
        balance: string;
      }>;
    };
    return (data.balances ?? []).map((b) => ({
      address: b.jetton.address,
      symbol: b.jetton.symbol ?? '???',
      name: b.jetton.name ?? b.jetton.symbol ?? 'Unknown',
      balance: b.balance,
      decimals: b.jetton.decimals ?? 9,
      image: b.jetton.image,
    }));
  } catch {
    return [];
  }
}
