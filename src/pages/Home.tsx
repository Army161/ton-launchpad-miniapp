import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '../components/ConnectButton';
import { Sparkline } from '../components/Sparkline';
import { TokenAvatar } from '../components/TokenAvatar';
import { liveTokenFromCard, registerLiveTokens, launchpadToToken } from '../data/tokens';
import { fetchChange24hMap } from '../lib/dexscreener';
import { fetchTonPrice } from '../lib/coingecko';
import { fetchLaunchpadTokens } from '../lib/launchpadApi';
import { CONFIG } from '../lib/config';

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

export function Home() {
  const [tab, setTab] = useState<Tab>('launchpad');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [tonPrice, setTonPrice] = useState<{ usd: number; change24h: number | null } | null>(null);

  useEffect(() => {
    fetchTonPrice().then(setTonPrice);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLaunchpad() {
      setLoading(true);
      const lpTokens = await fetchLaunchpadTokens();
      if (cancelled) return;

      registerLiveTokens(lpTokens.map(launchpadToToken));

      const lpCards: Card[] = lpTokens.map((t, i) => ({
        id: t.address,
        name: t.name || 'Unnamed',
        ticker: t.symbol || '???',
        priceUsd: 0,
        change24h: null,
        imageUrl: t.image,
        color: pickColor(i),
        source: 'launchpad' as const,
        curveProgress: Math.min(100, t.progressBps / 100),
        graduated: t.graduated,
      }));

      setCards(lpCards);
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

    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="page">
      <header className="home-header">
        <div>
          <h1 className="home-title">TON Launchpad</h1>
          {tonPrice && (
            <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              TON ${tonPrice.usd.toFixed(2)}
              {tonPrice.change24h != null && (
                <span className={tonPrice.change24h >= 0 ? ' positive' : ' negative'}>
                  {' '}{tonPrice.change24h >= 0 ? '+' : ''}{tonPrice.change24h.toFixed(2)}%
                </span>
              )}
            </p>
          )}
        </div>
        <ConnectButton compact />
      </header>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={tab === 'launchpad' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
          onClick={() => setTab('launchpad')}
        >
          Launchpad
        </button>
        <button
          type="button"
          className={tab === 'graduated' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
          onClick={() => setTab('graduated')}
        >
          Graduated
        </button>
      </div>

      {tab === 'launchpad' && (
        <Link to="/create" className="btn-primary" style={{ textAlign: 'center', fontSize: 14 }}>
          + Launch Token ({CONFIG.launchFee} TON)
        </Link>
      )}

      {loading ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>Loading tokens...</p>
      ) : cards.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>
          {tab === 'launchpad' ? 'No launchpad tokens yet. Be the first to launch!' : 'No graduated tokens found.'}
        </p>
      ) : (
        <div className="token-grid">
          {cards.map((card) => (
            <Link key={card.id} to={`/token/${card.id}`} className="token-card card">
              <div className="token-card-top">
                <TokenAvatar emoji={card.source === 'launchpad' ? '🚀' : '🪙'} color={card.color} size={36} imageUrl={card.imageUrl || undefined} />
                <div className="token-card-names">
                  <strong>{card.name}</strong>
                  <span className="muted">${card.ticker}</span>
                </div>
              </div>
              {card.source === 'launchpad' && card.curveProgress != null && !card.graduated && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Curve {card.curveProgress.toFixed(0)}% · {CONFIG.graduationTarget} TON
                </div>
              )}
              {card.source === 'stonfi' && <Sparkline color={card.color} />}
              <div className="token-card-bottom">
                <span className="token-card-price">
                  {card.priceUsd > 0
                    ? card.priceUsd < 0.01
                      ? `$${card.priceUsd.toExponential(2)}`
                      : `$${card.priceUsd.toFixed(4)}`
                    : card.graduated
                      ? 'Graduated'
                      : 'Bonding curve'}
                </span>
                <span className={`token-card-change${card.change24h == null ? '' : card.change24h >= 0 ? ' positive' : ' negative'}`}>
                  {card.change24h == null ? '\u2014' : `${card.change24h >= 0 ? '+' : ''}${card.change24h.toFixed(2)}%`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
