/** Display formatting for prices; never changes the numbers themselves. */

/** A TON price as the mockups show it: small prices in short scientific form (3.00e-8 TON). */
export function formatTonPrice(ton: number): string {
  if (!(ton > 0)) return '—';
  if (ton < 0.001) return `${ton.toExponential(2)} TON`;
  if (ton < 1) return `${ton.toPrecision(3)} TON`;
  return `${ton.toLocaleString('en-US', { maximumFractionDigits: 2 })} TON`;
}

/** A USD price: small ones in short scientific form, others with 4 decimals. */
export function formatUsdPrice(usd: number): string {
  if (!(usd > 0)) return '—';
  return usd < 0.01 ? `$${usd.toExponential(2)}` : `$${usd.toFixed(4)}`;
}

/** A 24 h change, signed, two decimals. */
export function formatChange(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}
