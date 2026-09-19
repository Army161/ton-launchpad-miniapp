/** DexScreener public API — 24h % for TON jettons. CORS: * · no API key.
 *  https://api.dexscreener.com/token-pairs/v1/ton/{address}
 */

export type DexPair = {
  chainId?: string;
  liquidity?: { usd?: number };
  priceUsd?: string;
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { address?: string };
};

/** Best-effort 24h % from highest-liquidity TON pair. null if unknown. */
export async function fetchChange24h(jettonAddress: string): Promise<number | null> {
  const url = `https://api.dexscreener.com/token-pairs/v1/ton/${encodeURIComponent(jettonAddress)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as DexPair[] | { pairs?: DexPair[] };
  const pairs = Array.isArray(data) ? data : Array.isArray(data.pairs) ? data.pairs : [];
  if (!pairs.length) return null;

  const scored = pairs
    .map((p) => ({
      liq: p.liquidity?.usd ?? 0,
      h24: p.priceChange?.h24,
    }))
    .filter((p) => typeof p.h24 === 'number' && Number.isFinite(p.h24));

  if (!scored.length) return null;
  scored.sort((a, b) => b.liq - a.liq);
  return scored[0].h24 as number;
}

/** Enrich many addresses; settles null on failure (never invent). */
export async function fetchChange24hMap(
  addresses: string[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  await Promise.all(
    addresses.map(async (addr) => {
      try {
        out.set(addr, await fetchChange24h(addr));
      } catch {
        out.set(addr, null);
      }
    }),
  );
  return out;
}
