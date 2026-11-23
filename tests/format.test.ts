import { describe, expect, it } from 'vitest';
import { formatChange, formatTonPrice, formatUsdPrice } from '../src/lib/format';

describe('price formatting', () => {
  it('shows small TON prices in short scientific form', () => {
    expect(formatTonPrice(3e-8)).toBe('3.00e-8 TON');
    expect(formatTonPrice(0.0123)).toBe('0.0123 TON');
    expect(formatTonPrice(0)).toBe('—');
  });
  it('formats USD prices and changes', () => {
    expect(formatUsdPrice(0.0845)).toBe('$0.0845');
    expect(formatUsdPrice(0.00274)).toBe('$2.74e-3');
    expect(formatChange(-0.4249)).toBe('-0.42%');
    expect(formatChange(0.62)).toBe('+0.62%');
  });
});
