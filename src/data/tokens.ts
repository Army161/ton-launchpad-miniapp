import type { LaunchpadToken } from '../lib/tonapi';
import { CONFIG } from '../lib/config';

export type Token = {
  id: string;
  name: string;
  ticker: string;
  priceUsd: number;
  priceTon: number;
  change24h: number | null;
  priceDeltaUsd?: number;
  marketCapTon: number;
  marketCapUsd: number;
  holders: number;
  holdersDelta1h: number;
  curveProgress: number;
  curveRaisedTon: number;
  curveTargetTon: number;
  emoji: string;
  color: string;
  imageUrl?: string;
  demo?: boolean;
  graduated?: boolean;
  curveAddress?: string;
  source?: 'launchpad' | 'stonfi';
};

export const DEMO_TOKENS: Token[] = [];

const liveById = new Map<string, Token>();

export function registerLiveTokens(tokens: Token[]): void {
  for (const t of tokens) liveById.set(t.id, t);
}

export function launchpadToToken(lp: LaunchpadToken): Token {
  const progress = Math.min(100, lp.progressBps / 100);
  return {
    id: lp.jettonAddress,
    name: lp.name,
    ticker: lp.symbol,
    priceUsd: 0,
    priceTon: lp.raisedTon > 0 ? lp.raisedTon / 1_000_000 : 0,
    change24h: null,
    marketCapTon: lp.raisedTon,
    marketCapUsd: 0,
    holders: 0,
    holdersDelta1h: 0,
    curveProgress: progress,
    curveRaisedTon: lp.raisedTon,
    curveTargetTon: CONFIG.graduationTarget,
    emoji: '🚀',
    color: '#30A1F5',
    imageUrl: undefined,
    graduated: lp.graduated,
    curveAddress: lp.curveAddress,
    source: 'launchpad',
  };
}

export function liveTokenFromCard(card: {
  id: string;
  name: string;
  ticker: string;
  priceUsd: number;
  change24h: number | null;
  imageUrl: string;
  color: string;
}): Token {
  return {
    id: card.id,
    name: card.name,
    ticker: card.ticker,
    priceUsd: card.priceUsd,
    priceTon: 0,
    change24h: card.change24h,
    marketCapTon: 0,
    marketCapUsd: 0,
    holders: 0,
    holdersDelta1h: 0,
    curveProgress: 100,
    curveRaisedTon: CONFIG.graduationTarget,
    curveTargetTon: CONFIG.graduationTarget,
    emoji: '🪙',
    color: card.color,
    imageUrl: card.imageUrl,
    graduated: true,
    source: 'stonfi',
  };
}

export function getToken(id: string): Token | undefined {
  return liveById.get(id) ?? DEMO_TOKENS.find((t) => t.id === id);
}

/** @deprecated Use quoteBuy from lib/contracts */
export function estimateTokens(tonAmount: number, ticker: string): string {
  const raw = tonAmount * 123.456;
  return `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${ticker}`;
}

/** @deprecated Use quoteSell from lib/contracts */
export function estimateTonOut(tokenAmount: number, priceTon: number): string {
  const raw = tokenAmount * priceTon * 0.98;
  return raw.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
