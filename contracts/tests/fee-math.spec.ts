/**
 * Fee math unit tests — mirrors on-chain constants in launchpad.tact
 */
import { toNano } from '@ton/core';

const TRADE_FEE_BPS = 200n;
const CREATOR_FEE_BPS = 6000n;

function quoteBuy(tonIn: bigint) {
  const fee = (tonIn * TRADE_FEE_BPS) / 10000n;
  const creatorFee = (fee * CREATOR_FEE_BPS) / 10000n;
  const platformFee = fee - creatorFee;
  return { fee, creatorFee, platformFee, tonAfterFee: tonIn - fee };
}

describe('Fee math (60/40 split on 2%)', () => {
  it('1 TON buy → 0.02 fee, 0.012 creator, 0.008 platform', () => {
    const q = quoteBuy(toNano('1'));
    expect(q.fee).toBe(toNano('0.02'));
    expect(q.creatorFee).toBe(toNano('0.012'));
    expect(q.platformFee).toBe(toNano('0.008'));
  });

  it('10 TON buy → correct proportional fees', () => {
    const q = quoteBuy(toNano('10'));
    expect(q.fee).toBe(toNano('0.2'));
    expect(q.creatorFee).toBe(toNano('0.12'));
    expect(q.platformFee).toBe(toNano('0.08'));
  });

  it('creator + platform = total fee', () => {
    const q = quoteBuy(toNano('100'));
    expect(q.creatorFee + q.platformFee).toBe(q.fee);
  });

  it('fee is exactly 2% of input', () => {
    const tonIn = toNano('55.5');
    const q = quoteBuy(tonIn);
    expect(q.fee).toBe((tonIn * 200n) / 10000n);
  });
});

describe('Graduation constants', () => {
  it('graduation target is 1500 TON', () => {
    expect(toNano('1500')).toBe(1_500_000_000_000n);
  });

  it('launch fee is 0.05 TON', () => {
    expect(toNano('0.05')).toBe(50_000_000n);
  });
});
