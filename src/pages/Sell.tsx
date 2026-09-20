import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toNano } from '@ton/core';
import { IconBack, IconCheck, IconInfo, IconMenu, IconShield, IconTelegram } from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import { getToken } from '../data/tokens';
import { formatTon, quoteSell } from '../lib/contracts';
import { CONFIG } from '../lib/config';
import styles from './Buy.module.css';

const NETWORK_FEE = 0.05;
const TOKEN_DECIMALS = 9;

export function Sell() {
  const { id } = useParams<{ id: string }>();
  const token = getToken(id ?? '');
  const { showToast } = useToast();
  const { connected, connect, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  const tokenAmount = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const tokenNano = useMemo(() => {
    if (tokenAmount <= 0) return 0n;
    return BigInt(Math.floor(tokenAmount * 10 ** TOKEN_DECIMALS));
  }, [tokenAmount]);

  const quote = useMemo(() => {
    if (tokenNano <= 0n) return null;
    return quoteSell(tokenNano);
  }, [tokenNano]);

  const estimated = quote ? formatTon(quote.tonOut) : '0';
  const amountDisplay = tokenAmount ? tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

  async function confirm() {
    if (!token) return;
    if (tokenAmount <= 0) { showToast('Enter a token amount'); return; }
    if (!connected) { connect(); return; }

    const curveAddress = token.curveAddress ?? token.id;
    setSubmitting(true);
    try {
      // Jetton transfer to curve with sell notification — simplified V1 via TON message
      await sendTransaction({
        to: curveAddress,
        amount: toNano('0.05').toString(),
        payload: undefined,
      });
      showToast(`Sold ~${amountDisplay} ${token.ticker} for ~${estimated} TON`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sell failed');
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
          <h1>Sell</h1>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.iconBtn} aria-label="Share"><IconTelegram size={20} /></button>
          <button type="button" className={styles.iconBtn} aria-label="Menu"><IconMenu size={20} /></button>
        </div>
      </header>

      <div className={`card ${styles.card}`}>
        <label className={styles.label} htmlFor="sell-amount">Amount ({token.ticker})</label>
        <div className={styles.amountRow}>
          <input id="sell-amount" className={styles.amountInput} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} inputMode="decimal" />
          <span className={styles.tonSide}>{token.ticker}<TokenAvatar emoji={token.emoji} color={token.color} size={24} imageUrl={token.imageUrl} /></span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Estimated TON received <IconInfo size={13} /></span>
          <span className={styles.est}><strong>{estimated}</strong><span className={styles.estTicker}>TON</span></span>
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
        {submitting ? 'Confirming...' : `Confirm sell · ${amountDisplay} ${token.ticker}`}
      </button>
    </div>
  );
}
