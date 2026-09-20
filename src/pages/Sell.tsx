import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  IconBack,
  IconCheck,
  IconInfo,
  IconMenu,
  IconShield,
  IconTelegram,
} from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { useToast } from '../context/ToastContext';
import { estimateTonOut, getToken } from '../data/tokens';
import styles from './Buy.module.css';

const NETWORK_FEE = 0.05;

export function Sell() {
  const { id } = useParams<{ id: string }>();
  const token = getToken(id ?? '');
  const { showToast } = useToast();
  const [amount, setAmount] = useState('1000');

  const tokenAmount = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const estimated = estimateTonOut(tokenAmount, token?.priceTon ?? 0.01);
  const amountDisplay = tokenAmount
    ? tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  function confirm() {
    if (!token) return;
    if (tokenAmount <= 0) {
      showToast('Enter a token amount');
      return;
    }
    // Toast stub only — no TON Connect SDK, keys, or mainnet tx
    showToast(
      `Success (demo): sold ~${amountDisplay} $${token.ticker} for ~${estimated} TON — no transaction sent`,
    );
  }

  if (!token) {
    return (
      <div className="page page--no-nav">
        <Link to="/" className="btn-ghost">
          <IconBack /> Back
        </Link>
        <p style={{ marginTop: 24 }} className="muted">
          Token not found.
        </p>
      </div>
    );
  }

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            to={`/token/${token.id}`}
            className={styles.back}
            aria-label="Back"
          >
            <IconBack size={22} />
          </Link>
          <h1>Sell</h1>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.iconBtn} aria-label="Share">
            <IconTelegram size={20} />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Menu">
            <IconMenu size={20} />
          </button>
        </div>
      </header>

      <div className={`card ${styles.card}`}>
        <label className={styles.label} htmlFor="sell-amount">
          Amount ({token.ticker})
        </label>
        <div className={styles.amountRow}>
          <input
            id="sell-amount"
            className={styles.amountInput}
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
                  .replace(/[^\d.]/g, '')
                  .replace(/(\..*)\./g, '$1'),
              )
            }
            inputMode="decimal"
          />
          <span className={styles.tonSide}>
            {token.ticker}
            <TokenAvatar emoji={token.emoji} color={token.color} size={24} />
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            Estimated TON received
            <IconInfo size={13} />
          </span>
          <span className={styles.est}>
            <strong>{estimated}</strong>
            <span className={styles.estTicker}>TON</span>
          </span>
        </div>

        <hr className={styles.sep} />

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            Network fee
            <IconInfo size={13} />
          </span>
          <span className={styles.fee}>
            {NETWORK_FEE.toFixed(2)} TON
            <IconCheck size={14} />
          </span>
        </div>
      </div>

      <p className={styles.secure}>
        <IconShield size={15} />
        Secure transaction on TON Blockchain
      </p>

      <button type="button" className={`btn-primary ${styles.confirm}`} onClick={confirm}>
        Confirm sell · {amountDisplay} {token.ticker}
      </button>
    </div>
  );
}
