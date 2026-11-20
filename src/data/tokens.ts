import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurveReserves } from '../lib/contracts';
import { spotPriceTon } from '../lib/contracts';
import { CONFIG } from '../lib/config';
import { fetchLaunchpadToken, type TokenView } from '../lib/launchpadApi';
import { isValidLink, LINK_KEYS, type LinkKey } from '../lib/metadata';

export type Token = {
  id: string;
  name: string;
  ticker: string;
  description?: string;
  /** Project links (ADR-013), only those that pass isValidLink, in LINK_KEYS order. */
  links?: { key: LinkKey; url: string }[];
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
    links: LINK_KEYS.flatMap((key) => {
      const url = v[key];
      return typeof url === 'string' && url && isValidLink(key, url) ? [{ key, url }] : [];
    }),
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

/** A lookup the API could not answer (it could not read the chain) is retried this long after it ended. */
const RETRY_MS = 5000;
/** Automatic retries in a row; a lookup that succeeds starts the count again. */
const RETRY_LIMIT = 12;

/** What a page shows for one token and holder. */
type View = {
  lookup: string;
  token?: Token;
  balance: bigint | null;
  status: 'loading' | 'ready' | 'not-found' | 'error';
  /** How the latest lookup ended, or 'running'. Unlike `status` it shows a failure while a copy of the token is shown. */
  outcome: 'running' | 'ok' | 'not-found' | 'error';
  /** Automatic retries in a row. */
  retries: number;
};

function freshView(id: string, lookup: string): View {
  const cached = getToken(id);
  return { lookup, token: cached, balance: null, status: cached ? 'ready' : 'loading', outcome: 'running', retries: 0 };
}

/**
 * Loads a token by address. Launchpad tokens are always refetched so quotes use
 * live reserves; deep links work without visiting the home page first.
 * A lookup that fails ('error') is retried 5 s after it ended, up to 12 times in a row, also while an earlier copy
 * of the token (from the list) is shown; with `retryNotFound` (a token that was just launched) 'not-found' is
 * retried too. `live` is true only while the latest lookup of this page succeeded: trade only then, so quotes, the
 * balance and the confirmation baseline come from the chain and not from an older copy. Only the latest lookup
 * updates the page, and another token or holder starts from what is known about it, never from the previous one.
 * `retry` looks again at once, for a Try again button; `apply` takes a fresh lookup the page already has, e.g. the
 * one that confirmed a trade. A call made while the page showed another token or holder, or an earlier visit to this
 * one (a trade confirmed before the wallet changed, arriving after the page came back to that wallet), does nothing.
 */
export function useToken(id: string, holder?: string | null, { retryNotFound = false } = {}) {
  const lookup = `${id} ${holder ?? ''}`;
  const [stored, setStored] = useState(() => freshView(id, lookup));
  // A view kept for another token or holder (a reused page, a wallet that connects) is never shown.
  const view = stored.lookup === lookup ? stored : freshView(id, lookup);
  const latest = useRef(0);
  // Each token and holder the page starts showing is a new visit, also one it showed before: the callbacks of an
  // earlier visit stay stale when the page comes back to the same lookup.
  const [visit, setVisit] = useState({ lookup, n: 0 });
  if (visit.lookup !== lookup) setVisit({ lookup, n: visit.n + 1 });
  const n = visit.lookup === lookup ? visit.n : visit.n + 1;
  // The visit the page shows now. Declared before the effect that starts a lookup, so that effect sees it.
  const shown = useRef(n);
  useEffect(() => {
    shown.current = n;
  }, [n]);
  const current = useCallback(() => shown.current === n, [n]);

  // Changes the view of this token and holder only: one kept for another lookup is replaced, never mixed in.
  const update = useCallback(
    (change: (v: View) => Partial<View>) =>
      setStored((s) => {
        const v = s.lookup === lookup ? s : freshView(id, lookup);
        return { ...v, ...change(v) };
      }),
    [id, lookup],
  );

  const show = useCallback(
    (v: TokenView, balance: bigint | null) => {
      const token = launchpadToToken(v);
      registerLiveTokens([token]);
      update(() => ({ token, balance, status: 'ready', outcome: 'ok', retries: 0 }));
    },
    [update],
  );

  const refresh = useCallback(async () => {
    if (!current()) return;
    const seq = ++latest.current;
    const cached = getToken(id);
    if (cached?.source === 'stonfi') {
      update(() => ({ token: cached, status: 'ready', outcome: 'ok' }));
      return;
    }
    update(() => ({ outcome: 'running' }));
    const l = await fetchLaunchpadToken(id, holder);
    // A lookup started after this one (a retry, another token) has the newer answer: drop this one.
    if (seq !== latest.current) return;
    if (l.status === 'ok') show(l.token, l.balance);
    else update((v) => ({ outcome: l.status, status: v.token ? v.status : l.status }));
  }, [id, holder, current, update, show]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { outcome, retries } = view;
  useEffect(() => {
    const failed = outcome === 'error' || (retryNotFound && outcome === 'not-found');
    if (!failed || retries >= RETRY_LIMIT) return;
    const timer = setTimeout(() => {
      update((v) => ({ retries: v.retries + 1 }));
      void refresh();
    }, RETRY_MS);
    return () => clearTimeout(timer);
  }, [outcome, retries, retryNotFound, refresh, update]);

  const retry = useCallback(() => {
    if (!current()) return;
    update((v) => ({ retries: 0, status: v.token ? v.status : 'loading' }));
    void refresh();
  }, [current, update, refresh]);

  const apply = useCallback(
    (l: { token: TokenView; balance: bigint | null }) => {
      if (!current()) return;
      latest.current++; // a lookup still running is older than this answer
      show(l.token, l.balance);
    },
    [current, show],
  );

  return {
    token: view.token,
    balance: view.balance,
    status: view.status,
    live: outcome === 'ok',
    checking: outcome === 'running',
    refresh,
    retry,
    apply,
  };
}
