import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '../components/ConnectButton';
import { Sparkline } from '../components/Sparkline';
import { TokenAvatar } from '../components/TokenAvatar';
import { DEMO_TOKENS, registerLiveTokens, liveTokenFromCard } from '../data/tokens';
import { fetchChange24hMap } from '../lib/dexscreener';

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
};

const COLORS = ['#30A1F5', '#F5A623', '#3DDC84', '#FF8C42', '#8B95A5', '#E05CFF', '#FF5C72', '#50E3C2'];

function pickColor(i: number) {
  return COLORS[i % COLORS.length];
}

export function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
        }));

        if (!cancelled) {
          registerLiveTokens(mapped.map((c) => liveTokenFromCard(c)));
          setCards(mapped);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCards(
            DEMO_TOKENS.map((t) => ({
              id: t.id,
              name: t.name,
              ticker: t.ticker,
              priceUsd: t.priceUsd,
              change24h: t.change24h,
              imageUrl: t.imageUrl ?? '',
              color: t.color,
            })),
          );
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <header className="home-header">
        <h1 className="home-title">TON Launchpad</h1>
        <ConnectButton compact />
      </header>

      {loading ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>Loading tokens...</p>
      ) : (
        <div className="token-grid">
          {cards.map((card) => (
            <Link key={card.id} to={`/token/${card.id}`} className="token-card card">
              <div className="token-card-top">
                <TokenAvatar emoji="\ud83e\ude99" color={card.color} size={36} imageUrl={card.imageUrl || undefined} />
                <div className="token-card-names">
                  <strong>{card.name}</strong>
                  <span className="muted">${card.ticker}</span>
                </div>
              </div>
              <Sparkline color={card.color} />
              <div className="token-card-bottom">
                <span className="token-card-price">
                  ${card.priceUsd < 0.01 ? card.priceUsd.toExponential(2) : card.priceUsd.toFixed(4)}
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
