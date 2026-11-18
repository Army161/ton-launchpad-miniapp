import { useCallback, useEffect, useState } from 'react';
import type { CurveReserves } from '../lib/contracts';
import { spotPriceTon } from '../lib/contracts';
import { CONFIG } from '../lib/config';
import { fetchLaunchpadToken, type TokenView } from '../lib/launchpadApi';

export type Token = {
  id: string;
  name: string;
  ticker: string;
  description?: string;
  telegram?: string;
  creator?: string;
  priceUsd: number;
  priceTon: number;
  change24h: number | null;
  marketCapTon: number;
  curveProgress: number;
  curveRaisedTon: number;
  curveTargetTon: number;
  tradeCount?: number;
  reserves?: CurveReserves;
  emoji: string;
  color: string;
  imageUrl?: string;
  graduated?: boolean;
  /** Launchpad tokens only: the STON.fi router, needed to derive holder wallets. */
  dexRouter?: string;
  source: 'launchpad' | 'stonfi';
};

const liveById = new Map<string, Token>();

export function registerLiveTokens(tokens: Token[]): void {
  for (const t of tokens) liveById.set(t.id, t);
}

export function getToken(id: string): Token | undefined {
  return liveById.get(id);
}

export function launchpadToToken(v: TokenView): Token {
  const reserves = { virtualTon: BigInt(v.virtualTon), virtualTokens: BigInt(v.virtualTokens) };
  const priceTon = spotPriceTon(reserves);
  return {
    id: v.address,
    name: v.name || 'Unnamed',
    ticker: v.symbol || '???',
    description: v.description,
    telegram: v.telegram,
    creator: v.creator,
    priceUsd: 0,
    priceTon,
    change24h: null,
    marketCapTon: priceTon * 1e9,
    curveProgress: Math.min(100, v.progressBps / 100),
    curveRaisedTon: Number(BigInt(v.realTonRaised)) / 1e9,
    curveTargetTon: Number(BigInt(v.graduationTarget)) / 1e9,
    tradeCount: v.tradeCount,
    reserves,
    emoji: '🚀',
    color: '#30A1F5',
    imageUrl: v.image || undefined,
    graduated: v.graduated,
    dexRouter: v.dexRouter,
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

/** A lookup the API could not answer (it could not read the chain) is retried this often, at most RETRY_LIMIT times. */
const RETRY_MS = 5000;
const RETRY_LIMIT = 12;

/**
 * Loads a token by address. Launchpad tokens are always refetched so quotes use
 * live reserves; deep links work without visiting the home page first.
 * While the lookup fails ('error') it is retried every 5 s for a minute; with
 * `retryNotFound` (a token that was just launched) 'not-found' is retried too.
 * `retry` looks again at once, for a Try again button.
 */
export function useToken(id: string, holder?: string | null, { retryNotFound = false } = {}) {
  const [token, setToken] = useState<Token | undefined>(() => getToken(id));
  const [balance, setBalance] = useState<bigint | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>(() =>
    getToken(id) ? 'ready' : 'loading',
  );
  // Automatic retries so far, counted per token and holder: another token starts again from 0.
  const lookup = `${id} ${holder ?? ''}`;
  const [retried, setRetried] = useState({ lookup, count: 0 });
  const retries = retried.lookup === lookup ? retried.count : 0;

  const refresh = useCallback(async () => {
    const cached = getToken(id);
    if (cached?.source === 'stonfi') {
      setToken(cached);
      setStatus('ready');
      return;
    }
    const l = await fetchLaunchpadToken(id, holder);
    if (l.status === 'ok') {
      const t = launchpadToToken(l.token);
      registerLiveTokens([t]);
      setToken(t);
      setBalance(l.balance);
      setStatus('ready');
    } else if (!cached) {
      setStatus(l.status);
    }
  }, [id, holder]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const retrying = status === 'error' || (retryNotFound && status === 'not-found');
    if (!retrying || retries >= RETRY_LIMIT) return;
    const timer = setTimeout(() => {
      setRetried({ lookup, count: retries + 1 });
      void refresh();
    }, RETRY_MS);
    return () => clearTimeout(timer);
  }, [status, retries, retryNotFound, refresh, lookup]);

  const retry = useCallback(() => {
    if (!getToken(id)) setStatus('loading');
    setRetried({ lookup, count: 0 });
    void refresh();
  }, [id, lookup, refresh]);

  return { token, balance, status, refresh, retry };
}
