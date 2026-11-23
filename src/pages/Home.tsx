import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandHero } from '../components/Brand';
import { ConnectButton } from '../components/ConnectButton';
import { IconRocket } from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { liveTokenFromCard, registerLiveTokens, launchpadToToken } from '../data/tokens';
import { fetchChange24hMap } from '../lib/dexscreener';
import { fetchTonPrice } from '../lib/coingecko';
import { fetchLaunchpadTokens } from '../lib/launchpadApi';
import { CONFIG } from '../lib/config';
import { spotPriceTon } from '../lib/contracts';
import { formatChange, formatTonPrice, formatUsdPrice } from '../lib/format';
import styles from './Home.module.css';

const STON_ASSETS = 'https://api.ston.fi/v1/assets';

type StonAsset = {
  contract_address: string;
  display_name?: string;
  symbol?: string;
  dex_usd_price?: string;
  image_url?: string;
  third_party_usd_price?: string;
};

type Card = {
  id: string;
  name: string;
  ticker: string;
  priceUsd: number;
  /** Spot price on the bonding curve, launchpad tokens only. */
  priceTon?: number;
  change24h: number | null;
  imageUrl: string;
  color: string;
  source: 'launchpad' | 'stonfi';
  curveProgress?: number;
  graduated?: boolean;
};

const COLORS = ['#30A1F5', '#F5A623', '#3DDC84', '#FF8C42', '#8B95A5', '#E05CFF', '#FF5C72', '#50E3C2'];

function pickColor(i: number) {
  return COLORS[i % COLORS.length];
}

type Tab = 'launchpad' | 'graduated';

/** After a failed load the launchpad list is fetched once more on its own, this much later; then Try again. */
const LIST_RETRY_MS = 5000;

export function Home() {
  const [tab, setTab] = useState<Tab>('launchpad');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  // 'error': the list could not be loaded, which must not read as "no tokens yet". 'partial': some were left out.
  const [lpState, setLpState] = useState<'ok' | 'partial' | 'error'>('ok');
  const [lpAttempt, setLpAttempt] = useState(0);
  const [tonPrice, setTonPrice] = useState<{ usd: number; change24h: number | null } | null>(null);

  useEffect(() => {
    fetchTonPrice().then(setTonPrice);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    async function loadLaunchpad() {
      setLoading(true);
      const list = await fetchLaunchpadTokens();
      if (cancelled) return;
      if (list.status === 'error' || (list.partial && list.tokens.length === 0)) {
        setCards([]);
        setLpState('error');
        setLoading(false);
        if (lpAttempt === 0) retry = setTimeout(() => setLpAttempt(1), LIST_RETRY_MS);
        return;
      }
      const lpTokens = list.tokens;

      registerLiveTokens(lpTokens.map(launchpadToToken));

      const lpCards: Card[] = lpTokens.map((t, i) => ({
        id: t.address,
        name: t.name || 'Unnamed',
        ticker: t.symbol || '???',
        priceUsd: 0,
        priceTon: spotPriceTon({ virtualTon: BigInt(t.virtualTon), virtualTokens: BigInt(t.virtualTokens) }),
        change24h: null,
        imageUrl: t.image,
        color: pickColor(i),
        source: 'launchpad' as const,
        curveProgress: Math.min(100, t.progressBps / 100),
        graduated: t.graduated,
      }));

      setCards(lpCards);
      setLpState(list.partial ? 'partial' : 'ok');
      setLoading(false);
    }

    async function loadGraduated() {
      setLoading(true);
      try {
        const res = await fetch(STON_ASSETS);
        if (!res.ok) throw new Error('ston fetch failed');
        const data = (await res.json()) as { asset_list?: StonAsset[] };
        const list = (data.asset_list ?? [])
          .filter((a) => {
            const p = parseFloat(a.dex_usd_price ?? a.third_party_usd_price ?? '0');
            return p > 0 && a.symbol && a.display_name;
          })
          .slice(0, 20);

        const addrs = list.map((a) => a.contract_address);
        const changeMap = await fetchChange24hMap(addrs);

        const mapped: Card[] = list.map((a, i) => ({
          id: a.contract_address,
          name: a.display_name ?? a.symbol ?? '?',
          ticker: (a.symbol ?? '???').toUpperCase(),
          priceUsd: parseFloat(a.dex_usd_price ?? a.third_party_usd_price ?? '0'),
          change24h: changeMap.get(a.contract_address) ?? null,
          imageUrl: a.image_url ?? '',
          color: pickColor(i),
          source: 'stonfi' as const,
          graduated: true,
        }));

        if (!cancelled) {
          registerLiveTokens(mapped.map((c) => liveTokenFromCard(c)));
          setCards(mapped);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCards([]);
          setLoading(false);
        }
      }
    }

    if (tab === 'launchpad') loadLaunchpad();
    else loadGraduated();

    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [tab, lpAttempt]);

  return (
    <div className={`page ${styles.page}`}>
      <BrandHero
        title="TON"
        accent="Launchpad"
        aside={<ConnectButton compact />}
        subtitle={
          <>
            Launch and trade meme coins, from idea to liquidity on TON.
            {tonPrice && (
              <span className={styles.tonPrice}>
                TON ${tonPrice.usd.toFixed(2)}
                {tonPrice.change24h != null && (
                  <span className={tonPrice.change24h >= 0 ? 'positive' : 'negative'}> {formatChange(tonPrice.change24h)}</span>
                )}
              </span>
            )}
          </>
        }
      />

      <div className={styles.segment} role="tablist" aria-label="Token lists">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'launchpad'}
          className={`${styles.segBtn}${tab === 'launchpad' ? ` ${styles.segActive}` : ''}`}
          onClick={() => setTab('launchpad')}
        >
          Launchpad
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'graduated'}
          className={`${styles.segBtn}${tab === 'graduated' ? ` ${styles.segActive}` : ''}`}
          onClick={() => setTab('graduated')}
        >
          Graduated
        </button>
      </div>

      {tab === 'launchpad' && (
        <Link to="/create" className={`btn-primary ${styles.launchBtn}`}>
          <IconRocket size={20} />
          Launch Token ({CONFIG.launchFee} TON)
        </Link>
      )}

      {loading ? (
        <p className="muted loading-pulse">Loading tokens...</p>
      ) : tab === 'launchpad' && lpState === 'error' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 48 }}>
          <p className="muted" style={{ textAlign: 'center' }}>Could not load tokens. Try again shortly.</p>
          <button type="button" className="btn-secondary" onClick={() => setLpAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : cards.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>
          {tab === 'launchpad' ? 'No launchpad tokens yet. Be the first to launch!' : 'No graduated tokens found.'}
        </p>
      ) : (
        <>
          {tab === 'launchpad' && lpState === 'partial' && (
            <p className="muted" style={{ fontSize: 12 }}>Some tokens could not be loaded right now.</p>
          )}
          <div className={styles.list}>
            {cards.map((card) => {
              const onCurve = card.source === 'launchpad' && !card.graduated && card.curveProgress != null;
              const price =
                card.priceUsd > 0
                  ? formatUsdPrice(card.priceUsd)
                  : card.priceTon
                    ? formatTonPrice(card.priceTon)
                    : card.graduated
                      ? 'Graduated'
                      : 'Bonding curve';
              return (
                <Link key={card.id} to={`/token/${card.id}`} className={styles.row}>
                  <div className={styles.rowTop}>
                    <span className={styles.avatarRing}>
                      <TokenAvatar emoji={card.source === 'launchpad' ? '🚀' : '🪙'} color={card.color} size={44} imageUrl={card.imageUrl || undefined} />
                    </span>
                    <div className={styles.rowMain}>
                      <strong className={styles.rowName}>{card.name}</strong>
                      <span className={styles.rowTicker}>${card.ticker}</span>
                    </div>
                  </div>
                  <div className={styles.rowPrice}>
                    <span>{price}</span>
                    {card.change24h != null && (
                      <span className={card.change24h >= 0 ? 'positive' : 'negative'}>{formatChange(card.change24h)}</span>
                    )}
                  </div>
                  {onCurve ? (
                    <MiniCurve progress={card.curveProgress ?? 0} />
                  ) : card.graduated ? (
                    <span className={styles.gradTag}>STON.fi</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** The token's real bonding-curve progress as a painted bar. */
function MiniCurve({ progress }: { progress: number }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className={styles.mini} aria-label={`Bonding curve ${pct.toFixed(0)}% complete`}>
      <span className={styles.miniTrack}>
        <span className={styles.miniFill} style={{ width: `${Math.max(pct, 2)}%` }} />
      </span>
      <span className={styles.miniPct}>{pct.toFixed(0)}%</span>
    </div>
  );
}
