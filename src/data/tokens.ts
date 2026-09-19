export type Token = {
  id: string;
  name: string;
  ticker: string;
  priceUsd: number;
  priceTon: number;
  /** null when unknown (STON.fi /v1/assets has no 24h %). */
  change24h: number | null;
  priceDeltaUsd?: number;
  marketCapTon: number;
  marketCapUsd: number;
  holders: number;
  holdersDelta1h: number;
  curveProgress: number; // 0-100
  curveRaisedTon: number;
  curveTargetTon: number;
  emoji: string;
  color: string;
  imageUrl?: string;
  /** true for sandbox DEMO_TOKENS only — Home featured/trending never use these. */
  demo?: boolean;
};

export const DEMO_TOKENS: Token[] = [
  {
    id: 'doge2',
    name: 'DOGE2',
    ticker: 'DOGE2',
    priceUsd: 0.01245,
    priceTon: 0.0082,
    change24h: 9.32,
    marketCapTon: 82000,
    marketCapUsd: 131200,
    holders: 892,
    holdersDelta1h: 18,
    curveProgress: 54,
    curveRaisedTon: 540,
    curveTargetTon: 1000,
    emoji: '🐶',
    color: '#F5A623',
    demo: true,
  },
  {
    id: 'pepe',
    name: 'PEPE',
    ticker: 'PEPE',
    priceUsd: 0.00087,
    priceTon: 0.00057,
    change24h: 15.2,
    marketCapTon: 45000,
    marketCapUsd: 72000,
    holders: 2104,
    holdersDelta1h: 56,
    curveProgress: 41,
    curveRaisedTon: 410,
    curveTargetTon: 1000,
    emoji: '🐸',
    color: '#3DDC84',
    demo: true,
  },
  {
    id: 'toncat',
    name: 'TON Cat',
    ticker: 'TCAT',
    priceUsd: 1.98,
    priceTon: 1.24,
    change24h: 5.98,
    priceDeltaUsd: 0.07,
    marketCapTon: 124000,
    marketCapUsd: 198400,
    holders: 1337,
    holdersDelta1h: 42,
    curveProgress: 68,
    curveRaisedTon: 680,
    curveTargetTon: 1000,
    emoji: '🐱',
    color: '#30A1F5',
    demo: true,
  },
  {
    id: 'dogs',
    name: 'DOGS',
    ticker: 'DOGS',
    priceUsd: 0.0031,
    priceTon: 0.002,
    change24h: 12.4,
    marketCapTon: 31000,
    marketCapUsd: 49600,
    holders: 654,
    holdersDelta1h: 12,
    curveProgress: 28,
    curveRaisedTon: 280,
    curveTargetTon: 1000,
    emoji: '🐕',
    color: '#FF8C42',
    demo: true,
  },
  {
    id: 'notcoin',
    name: 'NOT',
    ticker: 'NOT',
    priceUsd: 0.021,
    priceTon: 0.013,
    change24h: 4.1,
    marketCapTon: 98000,
    marketCapUsd: 156800,
    holders: 3201,
    holdersDelta1h: 9,
    curveProgress: 72,
    curveRaisedTon: 720,
    curveTargetTon: 1000,
    emoji: '⚫',
    color: '#8B95A5',
    demo: true,
  },
];

/** @deprecated Home no longer uses demo trending — kept empty for any stray imports. */
export const TRENDING: Token[] = [];

/** @deprecated Home no longer uses demo featured — kept empty for any stray imports. */
export const FEATURED: Token[] = [];

/** Live STON.fi tokens registered after Home fetch — address-keyed for detail/buy lookup. */
const liveById = new Map<string, Token>();

export function registerLiveTokens(tokens: Token[]): void {
  for (const t of tokens) liveById.set(t.id, t);
}

export function liveTokenFromCard(card: {
  id: string;
  name: string;
  ticker: string;
  priceUsd: number;
  imageUrl: string;
  color: string;
}): Token {
  return {
    id: card.id,
    name: card.name,
    ticker: card.ticker,
    priceUsd: card.priceUsd,
    priceTon: 0,
    change24h: null,
    marketCapTon: 0,
    marketCapUsd: 0,
    holders: 0,
    holdersDelta1h: 0,
    curveProgress: 0,
    curveRaisedTon: 0,
    curveTargetTon: 1000,
    emoji: '🪙',
    color: card.color,
    imageUrl: card.imageUrl,
    demo: false,
  };
}

export function getToken(id: string): Token | undefined {
  return liveById.get(id) ?? DEMO_TOKENS.find((t) => t.id === id);
}

/** Stub estimate: ~123.456 tokens per 1 TON (demo only). */
export function estimateTokens(tonAmount: number, ticker: string): string {
  const raw = tonAmount * 123.456;
  return `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${ticker}`;
}

/** Stub estimate: sell tokens → TON out (demo only). */
export function estimateTonOut(tokenAmount: number, priceTon: number): string {
  const raw = tokenAmount * priceTon * 0.98; // tiny fee haircut for realism in stub
  return raw.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
