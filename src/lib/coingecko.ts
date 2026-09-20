/** CoinGecko free API — TON/USD reference price. No API key required (demo tier). */

const TON_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true';

export type TonPrice = {
  usd: number;
  change24h: number | null;
};

let cache: { data: TonPrice; ts: number } | null = null;
const TTL_MS = 60_000;

export async function fetchTonPrice(): Promise<TonPrice | null> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  try {
    const res = await fetch(TON_PRICE_URL);
    if (!res.ok) return cache?.data ?? null;
    const json = (await res.json()) as {
      'the-open-network'?: { usd?: number; usd_24h_change?: number };
    };
    const ton = json['the-open-network'];
    if (!ton?.usd) return cache?.data ?? null;
    const data: TonPrice = {
      usd: ton.usd,
      change24h: typeof ton.usd_24h_change === 'number' ? ton.usd_24h_change : null,
    };
    cache = { data, ts: Date.now() };
    return data;
  } catch {
    return cache?.data ?? null;
  }
}
