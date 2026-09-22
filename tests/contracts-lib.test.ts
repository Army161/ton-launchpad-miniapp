import { Address, beginCell, toNano } from '@ton/core';
import { describe, expect, it } from 'vitest';
import { storeBuy, storeCreateToken } from '../src/contracts/LaunchpadFactory';
import { storeJettonBurn } from '../src/contracts/JettonWallet';
import { LaunchpadJetton } from '../src/contracts/LaunchpadJetton';
import { LaunchpadFactory } from '../src/contracts/LaunchpadFactory';
import {
  buildBuyBody,
  buildCreateTokenBody,
  buildSellBody,
  computeJettonAddress,
  feeSplit,
  formatUnits,
  parseAmount,
  quoteBuy,
  quoteSell,
  SELL_PAYLOAD_OP,
  withSlippage,
} from '../src/lib/contracts';
import { buildOnchainContent, parseOnchainContent, validateMetadata } from '../src/lib/metadata';

const A = Address.parse('EQD__________________________________________0vo');
const B = Address.parse('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI');

describe('message encoding matches the compiled contract ABI', () => {
  it('CreateToken', () => {
    const content = buildOnchainContent({ name: 'X', symbol: 'XX', description: '', image: 'https://x.io/a.png' });
    const ours = buildCreateTokenBody({ salt: 99n, content, initialBuyTon: toNano('1'), queryId: 5n });
    const abi = beginCell().store(storeCreateToken({ $$type: 'CreateToken', queryId: 5n, salt: 99n, content, initialBuyTon: toNano('1') })).endCell();
    expect(ours.equals(abi)).toBe(true);
  });

  it('Buy', () => {
    const ours = buildBuyBody(toNano('2'), 123n, 7n);
    const abi = beginCell().store(storeBuy({ $$type: 'Buy', queryId: 7n, tonAmount: toNano('2'), minTokensOut: 123n })).endCell();
    expect(ours.equals(abi)).toBe(true);
  });

  it('Sell (burn with SELL payload)', () => {
    const ours = buildSellBody(1000n, 55n, B, 3n);
    const abi = beginCell()
      .store(storeJettonBurn({
        $$type: 'JettonBurn', queryId: 3n, amount: 1000n, responseDestination: B,
        customPayload: beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(55n).endCell(),
      }))
      .endCell();
    expect(ours.equals(abi)).toBe(true);
  });

  it('computes the same jetton address as the factory would', async () => {
    const expected = await LaunchpadJetton.fromInit(A, B, 1234n);
    expect((await computeJettonAddress(A, B, 1234n)).equals(expected.address)).toBe(true);
    const factory = await LaunchpadFactory.fromInit(A, A, A);
    expect(factory.address.workChain).toBe(0);
  });
});

describe('curve maths', () => {
  it('2% fee rounds up and splits 60/40', () => {
    expect(feeSplit(toNano('1'))).toEqual({ fee: toNano('0.02'), creatorFee: toNano('0.012'), platformFee: toNano('0.008') });
    const f = feeSplit(49n);
    expect(f.fee).toBe(1n);
    expect(f.creatorFee + f.platformFee).toBe(f.fee);
  });

  it('first 1 TON buy matches the contract test vector', () => {
    const q = quoteBuy(toNano('1'));
    // 30e9 * 1e18 / (30e9 + 0.98e9), rounded up, subtracted from 1e18.
    const expectedTokens = 10n ** 18n - (30_000_000_000n * 10n ** 18n + 30_980_000_000n - 1n) / 30_980_000_000n;
    expect(q.tokensOut).toBe(expectedTokens);
  });

  it('a sell right after a buy returns less than was paid', () => {
    const b = quoteBuy(toNano('10'));
    const reserves = { virtualTon: toNano('30') + toNano('10') - b.fee, virtualTokens: 10n ** 18n - b.tokensOut };
    const s = quoteSell(b.tokensOut, reserves);
    expect(s.tonOut).toBeLessThan(toNano('10'));
    expect(s.tonOut).toBeGreaterThan(toNano('9.5'));
  });

  it('slippage floor', () => {
    expect(withSlippage(10_000n)).toBe(9_900n);
  });
});

describe('amount parsing', () => {
  it.each([
    ['1', 1_000_000_000n],
    ['1.5', 1_500_000_000n],
    ['.25', 250_000_000n],
    ['0.000000001', 1n],
    ['100.', 100_000_000_000n],
  ])('%s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', 'abc', '1e9', '-1', '1.2.3', '0.0000000001', ' ', '1,5'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it('formats without losing precision', () => {
    expect(formatUnits(123_456_789_000_000_000n, 9, 9)).toBe('123,456,789');
    expect(formatUnits(1n, 9, 9)).toBe('0.000000001');
  });
});

describe('metadata', () => {
  const good = { name: 'Super Doge', symbol: 'SDOGE', description: 'much wow', image: 'https://img.example/d.png', telegram: 'https://t.me/sdoge' };

  it('round-trips through the on-chain content cell', () => {
    const parsed = parseOnchainContent(buildOnchainContent(good));
    expect(parsed).toMatchObject({ name: 'Super Doge', symbol: 'SDOGE', description: 'much wow', image: good.image, decimals: '9', telegram: good.telegram });
  });

  it('keeps long values intact (snake cells)', () => {
    const long = { ...good, description: 'x'.repeat(200), image: 'https://img.example/' + 'a'.repeat(200) };
    expect(parseOnchainContent(buildOnchainContent(long))?.description).toBe(long.description);
  });

  it('validates input', () => {
    expect(validateMetadata(good)).toEqual([]);
    expect(validateMetadata({ ...good, name: '' })).toContain('Name is required');
    expect(validateMetadata({ ...good, symbol: 'x' })).toContain('Ticker must be 2–10 letters or digits');
    expect(validateMetadata({ ...good, image: 'http://insecure/a.png' })).toContain('Image must be an https URL');
    expect(validateMetadata({ ...good, image: 'data:image/png;base64,AAAA' })).toContain('Image must be an https URL');
    expect(validateMetadata({ ...good, telegram: 'https://evil.example/t.me' })).toContain('Telegram link must start with https://t.me/');
  });

  it('parseOnchainContent tolerates junk', () => {
    expect(parseOnchainContent(beginCell().storeUint(1, 8).endCell())).toBeNull();
  });
});
