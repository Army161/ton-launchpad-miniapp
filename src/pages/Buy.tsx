import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toNano } from '@ton/core';
import { IconBack, IconCheck, IconInfo, IconMenu, IconShield, IconTelegram } from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import { getToken } from '../data/tokens';
import { buildBuyBody, formatTokens, quoteBuy } from '../lib/contracts';
import { CONFIG } from '../lib/config';
import styles from './Buy.module.css';

const NETWORK_FEE = 0.05;

export function Buy() {
  const { id } = useParams<{ id: string }>();
  const token = getToken(id ?? '');
  const { showToast } = useToast();
  const { connected, connect, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const tonAmount = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const quote = useMemo(() => {
    if (tonAmount <= 0) return null;
    return quoteBuy(toNano(String(tonAmount)));
  }, [tonAmount]);

  const estimated = quote ? formatTokens(quote.tokensOut) : '0';
  const amountDisplay = tonAmount ? tonAmount.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';

  async function confirm() {
    if (!token) return;
    if (tonAmount <= 0) { showToast('Enter a TON amount'); return; }
    if (!connected) { connect(); return; }

    const curveAddress = token.curveAddress ?? token.id;
    setSubmitting(true);
    try {
      const minOut = quote ? (quote.tokensOut * 99n) / 100n : 0n;
      const body = buildBuyBody(minOut);
      await sendTransaction({
        to: curveAddress,
        amount: toNano(String(tonAmount)).toString(),
        payload: body.toBoc().toString('base64'),
      });
      showToast(`Bought ~${estimated} ${token.ticker}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Buy failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="page page--no-nav">
        <Link to="/" className="btn-ghost"><IconBack /> Back</Link>
        <p style={{ marginTop: 24 }} className="muted">Token not found.</p>
      </div>
    );
  }

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to={`/token/${token.id}`} className={styles.back} aria-label="Back"><IconBack size={22} /></Link>
          <h1>Buy</h1>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.iconBtn} aria-label="Share"><IconTelegram size={20} /></button>
          <button type="button" className={styles.iconBtn} aria-label="Menu"><IconMenu size={20} /></button>
        </div>
      </header>

      <div className={`card ${styles.card}`}>
        <label className={styles.label} htmlFor="buy-amount">Amount (TON)</label>
        <div className={styles.amountRow}>
          <input id="buy-amount" className={styles.amountInput} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} inputMode="decimal" />
          <span className={styles.tonSide}>TON <TokenAvatar emoji={token.emoji} color={token.color} size={24} imageUrl={token.imageUrl} /></span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Estimated {token.ticker} received <IconInfo size={13} /></span>
          <span className={styles.est}><strong>{estimated}</strong><span className={styles.estTicker}>{token.ticker}</span></span>
        </div>
        {quote && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Protocol fee ({CONFIG.tradeFeePercent}%)</span>
            <span className={styles.fee}>{(Number(quote.fee) / 1e9).toFixed(4)} TON</span>
          </div>
        )}
        <hr className={styles.sep} />
        <div className={styles.row}>
          <span className={styles.rowLabel}>Network fee <IconInfo size={13} /></span>
          <span className={styles.fee}>{NETWORK_FEE.toFixed(2)} TON <IconCheck size={14} /></span>
        </div>
      </div>

      <p className={styles.secure}><IconShield size={15} /> Secure transaction on TON Blockchain</p>
      <button type="button" className={`btn-primary ${styles.confirm}`} onClick={confirm} disabled={submitting}>
        {submitting ? 'Confirming...' : `Confirm buy · ${amountDisplay} TON`}
      </button>
    </div>
  );
}
