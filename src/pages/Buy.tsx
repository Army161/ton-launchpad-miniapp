import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Address } from '@ton/core';
import { IconBack, IconCheck, IconInfo, IconShield } from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import { useToken } from '../data/tokens';
import {
  buildBuyBody,
  BUY_GAS,
  formatTokens,
  formatTon,
  MIN_TRADE,
  parseAmount,
  quoteBuy,
  withSlippage,
} from '../lib/contracts';
import { CONFIG, friendlyAddress } from '../lib/config';
import { waitForToken } from '../lib/launchpadApi';
import styles from './Buy.module.css';

type Phase = 'idle' | 'signing' | 'confirming';

export function Buy() {
  const { id = '' } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { connected, connect, sendTransaction, address } = useWallet();
  const { token, status, refresh } = useToken(id, address);
  const [amount, setAmount] = useState('1');
  const [phase, setPhase] = useState<Phase>('idle');

  const tonIn = parseAmount(amount);
  const inputError =
    tonIn === null ? 'Enter a number like 1.5' : tonIn < MIN_TRADE ? `Minimum buy is ${formatTon(MIN_TRADE)} TON` : null;
  const quote = token?.reserves && tonIn && !inputError ? quoteBuy(tonIn, token.reserves) : null;

  async function confirm() {
    if (!token || !quote || tonIn === null) return;
    if (!connected) {
      connect();
      return;
    }
    const before = token.tradeCount ?? 0;
    const minOut = withSlippage(quote.tokensOut);
    setPhase('signing');
    try {
      await sendTransaction({
        to: friendlyAddress(Address.parse(token.id)),
        amount: (tonIn + BUY_GAS).toString(),
        payload: buildBuyBody(tonIn, minOut).toBoc().toString('base64'),
      });
    } catch (err) {
      setPhase('idle');
      showToast(err instanceof Error && /reject|cancel/i.test(err.message) ? 'Transaction cancelled' : 'Wallet did not send the transaction');
      return;
    }
    setPhase('confirming');
    const done = await waitForToken(token.id, (l) => l.token.tradeCount > before, address);
    setPhase('idle');
    if (done) {
      showToast(done.balance != null ? `Buy confirmed. You now hold ${formatTokens(done.balance)} ${token.ticker}` : 'Buy confirmed');
      void refresh();
    } else {
      showToast('Not confirmed yet. If the price moved more than 1%, the buy was refunded.');
    }
  }

  if (status === 'loading') {
    return <div className="page page--no-nav"><p className="muted" style={{ marginTop: 48, textAlign: 'center' }}>Loading…</p></div>;
  }
  if (!token) {
    return (
      <div className="page page--no-nav">
        <Link to="/" className="btn-ghost"><IconBack /> Back</Link>
        <p style={{ marginTop: 24 }} className="muted">{status === 'error' ? 'Could not load this token. Try again shortly.' : 'Token not found.'}</p>
      </div>
    );
  }
  if (token.source !== 'launchpad' || token.graduated) {
    return (
      <div className="page page--no-nav">
        <Link to={`/token/${token.id}`} className="btn-ghost"><IconBack /> Back</Link>
        <p style={{ marginTop: 24 }} className="muted">This token trades on STON.fi now.</p>
        <a className="btn-primary" href={`https://app.ston.fi/swap?ft=TON&tt=${token.id}`} target="_blank" rel="noopener noreferrer">Open STON.fi</a>
      </div>
    );
  }

  const busy = phase !== 'idle';
  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to={`/token/${token.id}`} className={styles.back} aria-label="Back"><IconBack size={22} /></Link>
          <h1>Buy</h1>
        </div>
      </header>

      <div className={`card ${styles.card}`}>
        <label className={styles.label} htmlFor="buy-amount">Amount (TON)</label>
        <div className={styles.amountRow}>
          <input id="buy-amount" className={styles.amountInput} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} inputMode="decimal" />
          <span className={styles.tonSide}>TON <TokenAvatar emoji={token.emoji} color={token.color} size={24} imageUrl={token.imageUrl} /></span>
        </div>
        {inputError && <p className="negative" style={{ fontSize: 12 }}>{inputError}</p>}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Estimated {token.ticker} received <IconInfo size={13} /></span>
          <span className={styles.est}><strong>{quote ? formatTokens(quote.tokensOut) : '0'}</strong><span className={styles.estTicker}>{token.ticker}</span></span>
        </div>
        {quote && (
          <>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Minimum received (1% slippage)</span>
              <span className={styles.fee}>{formatTokens(withSlippage(quote.tokensOut))}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Trading fee ({CONFIG.tradeFeePercent}%)</span>
              <span className={styles.fee}>{formatTon(quote.fee)} TON</span>
            </div>
          </>
        )}
        <hr className={styles.sep} />
        <div className={styles.row}>
          <span className={styles.rowLabel}>Network fee (unused part refunded)</span>
          <span className={styles.fee}>{formatTon(BUY_GAS)} TON <IconCheck size={14} /></span>
        </div>
      </div>

      <p className={styles.secure}><IconShield size={15} /> Secure transaction on TON Blockchain</p>
      <button type="button" className={`btn-primary ${styles.confirm}`} onClick={confirm} disabled={busy || !quote}>
        {phase === 'signing' ? 'Confirm in your wallet…' : phase === 'confirming' ? 'Waiting for confirmation…' : connected ? `Confirm buy · ${amount || '0'} TON` : 'Connect wallet'}
      </button>
    </div>
  );
}
