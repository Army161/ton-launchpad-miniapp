import { Address, beginCell, toNano } from '@ton/core';
import { CONFIG } from './config';

/** Opcodes matching contracts/launchpad.tact */
export const OP_CREATE_TOKEN = 0x1;
export const OP_BUY = 0x2;
export const OP_SELL = 0x3;

export const LAUNCH_FEE = toNano('0.05');
export const GRADUATION_TARGET = toNano('1500');
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;

export function getFactoryAddress(): Address | null {
  if (!CONFIG.factoryAddress || CONFIG.factoryAddress === 'PENDING_DEPLOY') return null;
  try {
    return Address.parse(CONFIG.factoryAddress);
  } catch {
    return null;
  }
}

/** Build CreateToken message body for factory contract */
export function buildCreateTokenBody(params: {
  queryId?: bigint;
  name: string;
  symbol: string;
  imageUri: string;
  description: string;
  telegramLink: string;
  initialBuyTon: bigint;
}) {
  return beginCell()
    .storeUint(OP_CREATE_TOKEN, 32)
    .storeUint(params.queryId ?? 0n, 64)
    .storeStringTail(params.name.slice(0, 32))
    .storeStringTail(params.symbol.slice(0, 10))
    .storeStringTail(params.imageUri)
    .storeStringTail(params.description)
    .storeStringTail(params.telegramLink)
    .storeCoins(params.initialBuyTon)
    .endCell();
}

/** Build Buy message body for bonding curve */
export function buildBuyBody(minTokensOut: bigint, queryId = 0n) {
  return beginCell()
    .storeUint(OP_BUY, 32)
    .storeUint(queryId, 64)
    .storeCoins(minTokensOut)
    .endCell();
}

/** Off-chain quote mirroring on-chain constant-product curve with 2% fee */
export function quoteBuy(
  tonIn: bigint,
  virtualTon = toNano('30'),
  virtualTokens = 1_000_000_000_000_000_000n,
): {
  tokensOut: bigint;
  fee: bigint;
  creatorFee: bigint;
  platformFee: bigint;
} {
  const fee = (tonIn * TRADE_FEE_BPS) / 10000n;
  const creatorFee = (fee * CREATOR_FEE_BPS) / 10000n;
  const platformFee = fee - creatorFee;
  const tonAfterFee = tonIn - fee;
  const k = virtualTon * virtualTokens;
  const newVirtualTon = virtualTon + tonAfterFee;
  const newVirtualTokens = k / newVirtualTon;
  const tokensOut = virtualTokens - newVirtualTokens;
  return { tokensOut, fee, creatorFee, platformFee };
}

export function quoteSell(
  tokenIn: bigint,
  virtualTon = toNano('30'),
  virtualTokens = 1_000_000_000_000_000_000n,
): {
  tonOut: bigint;
  fee: bigint;
  creatorFee: bigint;
  platformFee: bigint;
} {
  const k = virtualTon * virtualTokens;
  const newVirtualTokens = virtualTokens + tokenIn;
  const newVirtualTon = k / newVirtualTokens;
  const tonOutGross = virtualTon - newVirtualTon;
  const fee = (tonOutGross * TRADE_FEE_BPS) / 10000n;
  const creatorFee = (fee * CREATOR_FEE_BPS) / 10000n;
  const platformFee = fee - creatorFee;
  return { tonOut: tonOutGross - fee, fee, creatorFee, platformFee };
}

export function formatTokens(nanoTokens: bigint, decimals = 9): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = nanoTokens / divisor;
  const frac = nanoTokens % divisor;
  const fracStr = frac.toString().padStart(Number(decimals), '0').slice(0, 4);
  return `${whole}.${fracStr}`.replace(/\.?0+$/, '') || '0';
}

export function formatTon(nanoTon: bigint): string {
  return formatTokens(nanoTon, 9);
}
