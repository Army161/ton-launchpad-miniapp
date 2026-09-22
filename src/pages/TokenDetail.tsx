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
import { useToken } from '../data/tokens';
import { CONFIG, explorerUrl } from '../lib/config';
import styles from './TokenDetail.module.css';

export function TokenDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { token, status } = useToken(id);

  if (status === 'loading') {
    return (
      <div className="page page--no-nav">
        <p className="muted" style={{ marginTop: 48, textAlign: 'center' }}>Loading…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="page page--no-nav">
        <Link to="/" className="btn-ghost">
          <IconBack /> Back
        </Link>
        <p style={{ marginTop: 24 }} className="muted">
          {status === 'error' ? 'Could not load this token. Try again shortly.' : 'Token not found.'}
        </p>
      </div>
    );
  }

  const change24h = token.change24h;
  const priceDelta = change24h == null ? 0 : Number(((token.priceUsd * change24h) / 100).toFixed(2));
  const onCurve = token.source === 'launchpad' && !token.graduated;

  const tonviewerUrl = explorerUrl(token.id);
  const dexscreenerUrl = `https://dexscreener.com/ton/${token.id}`;
  const stonfiUrl = `https://app.ston.fi/swap?ft=${token.id}&tt=TON`;

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <IconTelegram size={18} />
          <span>TON Launchpad</span>
          <IconVerified size={15} />
        </div>
        <div className={styles.topActions}>
          <a href={tonviewerUrl} target="_blank" rel="noopener noreferrer" className={styles.iconBtn} aria-label="Tonviewer">
            <IconExpand size={18} />
          </a>
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
          {token.graduated && (
            <span className={styles.tickerPill} style={{ background: 'var(--positive)', marginLeft: 4 }}>
              STON.fi
            </span>
          )}
        </div>
        <button type="button" className={styles.watch} aria-label="Watchlist">
          <IconStar size={16} />
          <span>Watchlist</span>
        </button>
      </div>

      {onCurve && (
        <BondingCurve
          progress={token.curveProgress}
          raised={token.curveRaisedTon}
          target={token.curveTargetTon}
        />
      )}

      <div className={styles.stats}>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconFilled}`}>
            <IconTrend size={13} />
          </div>
          <span className={styles.statLabel}>Price</span>
          <strong>
            {token.priceUsd > 0 ? `$${token.priceUsd.toFixed(4)}` : token.priceTon > 0 ? `${token.priceTon.toPrecision(3)} TON` : '—'}
          </strong>
          <span className={styles.statDelta}>
            {change24h == null ? '—' : `${priceDelta >= 0 ? '+' : '-'}$${Math.abs(priceDelta).toFixed(2)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconOutline}`}>
            <IconChart size={13} />
          </div>
          <span className={styles.statLabel}>Market Cap</span>
          <strong>{token.marketCapTon > 0 ? `${Math.round(token.marketCapTon).toLocaleString()} TON` : '—'}</strong>
          <span className={styles.statSub}>
            {`Graduation: ${CONFIG.graduationTarget} TON`}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={`${styles.statIcon} ${styles.statIconOutline}`}>
            <IconPeople size={13} />
          </div>
          <span className={styles.statLabel}>Trades</span>
          <strong>{token.tradeCount != null ? token.tradeCount.toLocaleString() : '—'}</strong>
          <span className={styles.statSub}>{`Fee: ${CONFIG.tradeFeePercent}%`}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={tonviewerUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 12 }}>
          Tonviewer
        </a>
        <a href={dexscreenerUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 12 }}>
          DexScreener
        </a>
        {token.graduated && (
          <a href={stonfiUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 12 }}>
            STON.fi Swap
          </a>
        )}
      </div>

      {token.description && <p className="muted" style={{ fontSize: 13 }}>{token.description}</p>}

      <div className={styles.actions}>
        {onCurve ? (
          <>
            <Link to={`/buy/${token.id}`} className={`btn-primary ${styles.actionBtn}`}>
              <IconWallet size={18} />
              Buy ${token.ticker}
            </Link>
            <Link to={`/sell/${token.id}`} className={`btn-secondary ${styles.actionBtn} ${styles.sellBtn}`}>
              <IconArrowDown size={18} />
              Sell ${token.ticker}
            </Link>
          </>
        ) : (
          <a href={stonfiUrl} target="_blank" rel="noopener noreferrer" className={`btn-primary ${styles.actionBtn}`}>
            <IconWallet size={18} />
            {token.source === 'launchpad' && token.graduated ? 'Graduated · trade on STON.fi' : 'Trade on STON.fi'}
          </a>
        )}
      </div>
    </div>
  );
}
