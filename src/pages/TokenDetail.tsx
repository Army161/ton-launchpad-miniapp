import { Link, useParams } from 'react-router-dom';
import { BondingCurve } from '../components/BondingCurve';
import { TokenAvatar } from '../components/TokenAvatar';
import {
  IconArrowDown,
  IconBack,
  IconChart,
  IconExpand,
  IconMore,
  IconPeople,
  IconStar,
  IconTelegram,
  IconTrend,
  IconVerified,
  IconWallet,
} from '../components/Icons';
import { getToken } from '../data/tokens';
import styles from './TokenDetail.module.css';

export function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const token = getToken(id ?? '');

  if (!token) {
    return (
      <div className="page page--no-nav">
        <Link to="/" className="btn-ghost">
          <IconBack /> Back
        </Link>
        <p style={{ marginTop: 24 }} className="muted">
          Token not found (demo data only).
        </p>
      </div>
    );
  }

  const change24h = token.change24h;
  const priceDelta =
    token.priceDeltaUsd ??
    (change24h == null
      ? 0
      : Number(((token.priceUsd * change24h) / 100).toFixed(2)));

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <IconTelegram size={18} />
          <span>TON Launchpad</span>
          <IconVerified size={15} />
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.iconBtn} aria-label="Expand">
            <IconExpand size={18} />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Menu">
            <IconMore size={18} />
          </button>
        </div>
      </header>

      <div className={styles.tokenHead}>
        <Link to="/" className={styles.backBtn} aria-label="Back">
          <IconBack size={22} />
        </Link>
        <TokenAvatar emoji={token.emoji} color={token.color} imageUrl={token.imageUrl} size={42} />
        <div className={styles.tokenNames}>
          <h1>{token.name}</h1>
          <span className={styles.tickerPill}>${token.ticker}</span>
        </div>
        <button type="button" className={styles.watch} aria-label="Watchlist">
          <IconStar size={16} />
          <span>Watchlist</span>
        </button>
      </div>

      <BondingCurve
        progress={token.curveProgress}
        raised={token.curveRaisedTon}
        target={token.curveTargetTon}
      />

      <div className={styles.stats}>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconFilled}`}>
            <IconTrend size={13} />
          </div>
          <span className={styles.statLabel}>Price</span>
          <strong>{token.priceTon.toFixed(2)} TON</strong>
          <span className={styles.statDelta}>
            {change24h == null ? '—' : `+$${priceDelta.toFixed(2)} (+${change24h.toFixed(2)}%)`}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconOutline}`}>
            <IconChart size={13} />
          </div>
          <span className={styles.statLabel}>Market Cap</span>
          <strong>{token.marketCapTon.toLocaleString()} TON</strong>
          <span className={styles.statSub}>
            ~${token.marketCapUsd.toLocaleString()}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconOutline}`}>
            <IconPeople size={13} />
          </div>
          <span className={styles.statLabel}>Holders</span>
          <strong>{token.holders.toLocaleString()}</strong>
          <span className={styles.statSub}>+{token.holdersDelta1h} in 1h</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link to={`/buy/${token.id}`} className={`btn-primary ${styles.actionBtn}`}>
          <IconWallet size={18} />
          Buy ${token.ticker}
        </Link>
        <Link to={`/sell/${token.id}`} className={`btn-secondary ${styles.actionBtn} ${styles.sellBtn}`}>
          <IconArrowDown size={18} />
          Sell ${token.ticker}
        </Link>
      </div>
    </div>
  );
}
