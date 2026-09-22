import { Address, beginCell, type Cell, toNano } from '@ton/core';
import { JettonWallet } from '../contracts/JettonWallet';
import { LaunchpadJetton } from '../contracts/LaunchpadJetton';
import { CONFIG } from './config';

// Mirrors contracts/contracts/messages.tact. The unit tests encode against the
// generated wrappers, so drift in opcodes or layouts fails CI.
export const OP_CREATE_TOKEN = 0x4c500001;
export const OP_BUY = 0x4c500003;
export const OP_JETTON_BURN = 0x595f07bc;
export const SELL_PAYLOAD_OP = 0x53454c4c;

export const LAUNCH_FEE = toNano('0.05');
export const GRADUATION_TARGET = toNano('1500');
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;
export const BPS = 10000n;
export const VIRTUAL_TON = toNano('30');
export const VIRTUAL_TOKENS = 10n ** 18n;
export const TOKEN_DECIMALS = 9;
export const MIN_TRADE = toNano('0.01');
export const MAX_INITIAL_BUY = toNano('100');

/** TON attached on top of the trade; the contracts return what is unused. */
export const CREATE_GAS = toNano('0.15');
export const BUY_GAS = toNano('0.1');
export const SELL_VALUE = toNano('0.1');

/** Default slippage tolerance for quotes: 1%. */
export const DEFAULT_SLIPPAGE_BPS = 100n;

export function getFactoryAddress(): Address | null {
  if (!CONFIG.factoryAddress || CONFIG.factoryAddress === 'PENDING_DEPLOY') return null;
  try {
    return Address.parse(CONFIG.factoryAddress);
  } catch {
    return null;
  }
}

/** Random 64-bit salt so each launch gets a fresh, predictable address. */
export function randomSalt(): bigint {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return bytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);
}

export async function computeJettonAddress(factory: Address, creator: Address, salt: bigint): Promise<Address> {
  return (await LaunchpadJetton.fromInit(factory, creator, salt)).address;
}

export async function computeWalletAddress(owner: Address, jetton: Address): Promise<Address> {
  return (await JettonWallet.fromInit(owner, jetton)).address;
}

export function buildCreateTokenBody(params: {
  salt: bigint;
  content: Cell;
  initialBuyTon: bigint;
  queryId?: bigint;
}): Cell {
  return beginCell()
    .storeUint(OP_CREATE_TOKEN, 32)
    .storeUint(params.queryId ?? 0n, 64)
    .storeUint(params.salt, 64)
    .storeRef(params.content)
    .storeCoins(params.initialBuyTon)
    .endCell();
}

export function buildBuyBody(tonAmount: bigint, minTokensOut: bigint, queryId = 0n): Cell {
  return beginCell()
    .storeUint(OP_BUY, 32)
    .storeUint(queryId, 64)
    .storeCoins(tonAmount)
    .storeCoins(minTokensOut)
    .endCell();
}

/** Sell = burn from the holder's own jetton wallet with a SELL payload. */
export function buildSellBody(amount: bigint, minTonOut: bigint, responseDestination: Address, queryId = 0n): Cell {
  return beginCell()
    .storeUint(OP_JETTON_BURN, 32)
    .storeUint(queryId, 64)
    .storeCoins(amount)
    .storeAddress(responseDestination)
    .storeBit(true)
    .storeRef(beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(minTonOut).endCell())
    .endCell();
}

// ── Curve maths (mirrors the contract, rounding in the pool's favour) ──────

export type CurveReserves = { virtualTon: bigint; virtualTokens: bigint };

export const INITIAL_RESERVES: CurveReserves = { virtualTon: VIRTUAL_TON, virtualTokens: VIRTUAL_TOKENS };

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export function feeSplit(amount: bigint) {
  const fee = ceilDiv(amount * TRADE_FEE_BPS, BPS);
  const creatorFee = (fee * CREATOR_FEE_BPS) / BPS;
  return { fee, creatorFee, platformFee: fee - creatorFee };
}

export function quoteBuy(tonAmount: bigint, reserves: CurveReserves = INITIAL_RESERVES) {
  const f = feeSplit(tonAmount);
  const newVirtualTon = reserves.virtualTon + tonAmount - f.fee;
  const newVirtualTokens = ceilDiv(reserves.virtualTon * reserves.virtualTokens, newVirtualTon);
  return { ...f, tokensOut: reserves.virtualTokens - newVirtualTokens };
}

export function quoteSell(tokenAmount: bigint, reserves: CurveReserves = INITIAL_RESERVES) {
  const newVirtualTokens = reserves.virtualTokens + tokenAmount;
  const newVirtualTon = ceilDiv(reserves.virtualTon * reserves.virtualTokens, newVirtualTokens);
  const gross = reserves.virtualTon - newVirtualTon;
  const f = feeSplit(gross);
  return { ...f, tonOut: gross - f.fee };
}

export function withSlippage(amount: bigint, slippageBps = DEFAULT_SLIPPAGE_BPS): bigint {
  return (amount * (BPS - slippageBps)) / BPS;
}

/** Spot price in TON per whole token. */
export function spotPriceTon(reserves: CurveReserves): number {
  if (reserves.virtualTokens === 0n) return 0;
  return Number(reserves.virtualTon) / Number(reserves.virtualTokens);
}

// ── Amount parsing / formatting ────────────────────────────────────────────

/**
 * Parse a user-typed decimal amount into base units. Returns null for anything
 * that is not a plain positive decimal with at most `decimals` fraction digits.
 */
export function parseAmount(input: string, decimals = TOKEN_DECIMALS): bigint | null {
  const s = input.trim();
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(s)) return null;
  const [whole = '', frac = ''] = s.split('.');
  if (frac.length > decimals) return null;
  const value = BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt((frac + '0'.repeat(decimals)).slice(0, decimals) || '0');
  return value;
}

export function formatUnits(value: bigint, decimals = TOKEN_DECIMALS, maxFraction = 4): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = (abs % divisor).toString().padStart(decimals, '0').slice(0, maxFraction).replace(/0+$/, '');
  const wholeStr = whole.toLocaleString('en-US');
  return `${negative ? '-' : ''}${wholeStr}${frac ? `.${frac}` : ''}`;
}

export const formatTokens = (v: bigint) => formatUnits(v, TOKEN_DECIMALS, 2);
export const formatTon = (v: bigint) => formatUnits(v, 9, 4);
