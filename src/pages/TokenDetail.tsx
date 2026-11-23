import { Link, useLocation, useParams } from 'react-router-dom';
import { BondingCurve } from '../components/BondingCurve';
import { TokenAvatar } from '../components/TokenAvatar';
import { TokenUnavailable } from '../components/TokenUnavailable';
import { Cloth, Crown, Splatter } from '../components/Brand';
import {
  IconArrowDown,
  IconBack,
  IconChart,
  IconExternal,
  IconPeople,
  IconTrend,
  IconWallet,
} from '../components/Icons';
import { useToken } from '../data/tokens';
import { CONFIG, explorerUrl } from '../lib/config';
import { formatTonPrice, formatUsdPrice } from '../lib/format';
import { LINK_LABELS } from '../lib/metadata';
import styles from './TokenDetail.module.css';

export function TokenDetail() {
  const { id = '' } = useParams<{ id: string }>();
  // Create sends a launch here before it is confirmed: keep looking for the token for a while.
  const location = useLocation();
  const launched = (location.state as { launched?: boolean } | null)?.launched === true;
  const { token, status, live, checking, retry } = useToken(id, undefined, { retryNotFound: launched });

  if (status === 'loading') {
    return (
      <div className="page page--no-nav">
        <p className="muted" style={{ marginTop: 48, textAlign: 'center' }}>Loading…</p>
      </div>
    );
  }

  if (!token) return <TokenUnavailable status={status} launched={launched} onRetry={retry} />;

  const change24h = token.change24h;
  const priceDelta = change24h == null ? 0 : Number(((token.priceUsd * change24h) / 100).toFixed(2));
  const onCurve = token.source === 'launchpad' && !token.graduated;

  const tonviewerUrl = explorerUrl(token.id);
  const dexscreenerUrl = `https://dexscreener.com/ton/${token.id}`;
  const stonfiUrl = `https://app.ston.fi/swap?ft=${token.id}&tt=TON`;

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <Cloth corner="right" />
      <Link to="/" className={styles.backBtn} aria-label="Back">
        <IconBack size={22} />
      </Link>

      <div className={styles.tokenHead}>
        <span className={styles.avatarRing}>
          <TokenAvatar emoji={token.emoji} color={token.color} imageUrl={token.imageUrl} size={60} />
        </span>
        <div className={styles.tokenNames}>
          <h1>
            <span className={styles.nameText}>{token.name}</span>
            <Crown size={30} className={styles.nameCrown} />
          </h1>
          <div className={styles.pills}>
            <span className={styles.tickerPill}>${token.ticker}</span>
            {token.graduated && <span className={`${styles.tickerPill} ${styles.gradPill}`}>STON.fi</span>}
          </div>
        </div>
        <Splatter className={styles.headSplatter} />
      </div>

      {!live && !checking && (
        <p className="muted" style={{ fontSize: 12 }} role="status">
          Could not refresh this token, so these numbers may be out of date.{' '}
          <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={retry}>
            Try again
          </button>
        </p>
      )}

      {onCurve && (
        <BondingCurve
          progress={token.curveProgress}
          raised={token.curveRaisedTon}
          target={token.curveTargetTon}
        />
      )}

      <div className={styles.stats}>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statIcon}>
            <IconTrend size={13} />
          </div>
          <span className={styles.statLabel}>Price</span>
          <strong>
            {token.priceUsd > 0 ? formatUsdPrice(token.priceUsd) : formatTonPrice(token.priceTon)}
          </strong>
          <span className={styles.statDelta}>
            {change24h == null ? '—' : `${priceDelta >= 0 ? '+' : '-'}$${Math.abs(priceDelta).toFixed(2)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statIcon}>
            <IconChart size={13} />
          </div>
          <span className={styles.statLabel}>Market Cap</span>
          <strong>{token.marketCapTon > 0 ? `${Math.round(token.marketCapTon).toLocaleString()} TON` : '—'}</strong>
          <span className={styles.statSub}>
            {`Graduation: ${CONFIG.graduationTarget.toLocaleString('en-US')} TON`}
          </span>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statIcon}>
            <IconPeople size={13} />
          </div>
          <span className={styles.statLabel}>Trades</span>
          <strong>{token.tradeCount != null ? token.tradeCount.toLocaleString() : '—'}</strong>
          <span className={styles.statSub}>{`Fee: ${CONFIG.tradeFeePercent}%`}</span>
        </div>
      </div>

      <section className={styles.about}>
        <h2 className="section-title">About</h2>
        {token.description && <p>{token.description}</p>}
        <div className={styles.links}>
          <a href={tonviewerUrl} target="_blank" rel="noopener noreferrer" className={styles.linkPill}>
            Tonviewer <IconExternal size={14} />
          </a>
          <a href={dexscreenerUrl} target="_blank" rel="noopener noreferrer" className={styles.linkPill}>
            DexScreener <IconExternal size={14} />
          </a>
          {token.graduated && (
            <a href={stonfiUrl} target="_blank" rel="noopener noreferrer" className={styles.linkPill}>
              STON.fi Swap <IconExternal size={14} />
            </a>
          )}
        </div>
      </section>

      {token.links && token.links.length > 0 && (
        <section aria-label="Project links" className={styles.about}>
          <h2 className="section-title">Links</h2>
          <div className={styles.links}>
            {token.links.map(({ key, url }) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className={styles.linkPill}>
                {LINK_LABELS[key].label} <IconExternal size={14} />
              </a>
            ))}
          </div>
          <span className={styles.linksNote}>Links are added by the creator and are not checked by TON Launchpad.</span>
        </section>
      )}

      <div className={styles.actions}>
        {onCurve ? (
          <>
            <Link to={`/buy/${token.id}`} className={`btn-primary ${styles.actionBtn}`}>
              <IconWallet size={18} />
              Buy ${token.ticker}
            </Link>
            <Link to={`/sell/${token.id}`} className={`btn-secondary ${styles.actionBtn}`}>
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
