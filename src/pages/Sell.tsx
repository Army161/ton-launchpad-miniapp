import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Address } from '@ton/core';
import { IconBack, IconCheck, IconInfo, IconShield } from '../components/Icons';
import { Cloth, Drips } from '../components/Brand';
import { TokenAvatar } from '../components/TokenAvatar';
import { TokenUnavailable } from '../components/TokenUnavailable';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import { useToken } from '../data/tokens';
import {
  buildSellBody,
  canSendSell,
  computeWalletAddress,
  formatTokens,
  formatTon,
  formatUnits,
  parseAmount,
  quoteSell,
  SELL_VALUE,
  withSlippage,
} from '../lib/contracts';
import { CONFIG, friendlyAddress } from '../lib/config';
import { waitForToken } from '../lib/launchpadApi';
import styles from './Buy.module.css';

type Phase = 'idle' | 'signing' | 'confirming';

export function Sell() {
  const { id = '' } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { connected, connect, sendTransaction, address } = useWallet();
  const { token, balance, status, live, checking, refresh, retry, apply } = useToken(id, address);
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  // A sell whose confirmation timed out may still land: warn on the page, not only in a passing toast.
  const [unconfirmed, setUnconfirmed] = useState(false);

  const tokensIn = parseAmount(amount);
  const held = balance ?? 0n;
  const inputError =
    tokensIn === null || tokensIn === 0n
      ? 'Enter an amount'
      : connected && balance !== null && tokensIn > held
        ? 'More than you hold'
        : null;
  const quote = token?.reserves && tokensIn && !inputError ? quoteSell(tokensIn, token.reserves) : null;
  const sendable = canSendSell(connected, live, balance);

  async function confirm() {
    if (!token || !quote || !tokensIn) return;
    if (!connected || !address) {
      connect();
      return;
    }
    // The quote, the balance and the confirmation baseline must come from a live read, never from an older copy.
    if (!sendable) return;
    if (quote.tonOut <= 0n) {
      showToast('Amount too small to sell');
      return;
    }
    if (!token.dexRouter) {
      showToast('Token data is still loading, try again');
      return;
    }
    const owner = Address.parse(address);
    const wallet = await computeWalletAddress(owner, Address.parse(token.id), Address.parse(token.dexRouter));
    const before = token.tradeCount ?? 0;
    setPhase('signing');
    try {
      // The wallet app shows this as a burn: selling returns tokens to the curve for TON.
      await sendTransaction({
        to: friendlyAddress(wallet),
        amount: SELL_VALUE.toString(),
        payload: buildSellBody(tokensIn, withSlippage(quote.tonOut), owner).toBoc().toString('base64'),
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
      setUnconfirmed(false);
      showToast(`Sold for ~${formatTon(quote.tonOut)} TON`);
      setAmount('');
      apply(done);
    } else {
      setUnconfirmed(true);
      showToast('Sell not confirmed yet. Check your wallet history before trying again.');
      void refresh();
    }
  }

  if (status === 'loading') {
    return <div className="page page--no-nav"><p className="muted" style={{ marginTop: 48, textAlign: 'center' }}>Loading…</p></div>;
  }
  if (!token) return <TokenUnavailable status={status} onRetry={retry} />;
  if (token.source !== 'launchpad' || token.graduated) {
    return (
      <div className="page page--no-nav">
        <Link to={`/token/${token.id}`} className="btn-ghost"><IconBack /> Back</Link>
        <p style={{ marginTop: 24 }} className="muted">This token trades on STON.fi now.</p>
        <a className="btn-primary" href={`https://app.ston.fi/swap?ft=${token.id}&tt=TON`} target="_blank" rel="noopener noreferrer">Open STON.fi</a>
      </div>
    );
  }

  const busy = phase !== 'idle';
  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <Cloth corner="right" />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to={`/token/${token.id}`} className={styles.back} aria-label="Back"><IconBack size={22} /></Link>
          <h1>
            <span className={styles.titleWhite}>Sell</span>{' '}
            <span className={styles.titleBlue}>
              ${token.ticker}
              <Drips className={styles.titleDrips} />
            </span>
          </h1>
        </div>
      </header>

      <div className={`card ${styles.card}`}>
        <label className={styles.label} htmlFor="sell-amount">
          Amount ({token.ticker}){connected && balance !== null ? ` · you hold ${formatTokens(held)}` : ''}
        </label>
        <div className={styles.amountRow}>
          <input id="sell-amount" className={styles.amountInput} value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} inputMode="decimal" />
          <span className={styles.tonSide}>{token.ticker}<TokenAvatar emoji={token.emoji} color={token.color} size={24} imageUrl={token.imageUrl} /></span>
        </div>
        {connected && held > 0n && (
          <button type="button" className="btn-ghost" style={{ fontSize: 12, alignSelf: 'flex-end' }} onClick={() => setAmount(formatUnits(held, 9, 9).replace(/,/g, ''))}>
            Max
          </button>
        )}
        {amount && inputError && <p className="negative" style={{ fontSize: 12 }}>{inputError}</p>}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Estimated TON received <IconInfo size={13} /></span>
          <span className={styles.est}><strong>{quote ? formatTon(quote.tonOut) : '0'}</strong><span className={styles.estTicker}>TON</span></span>
        </div>
        {quote && (
          <>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Minimum received (1% slippage)</span>
              <span className={styles.fee}>{formatTon(withSlippage(quote.tonOut))} TON</span>
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
          <span className={styles.fee}>{formatTon(SELL_VALUE)} TON <IconCheck size={14} /></span>
        </div>
      </div>

      <p className={styles.secure}><IconShield size={15} /> Your wallet will show this as a token burn; the curve pays you TON for it.</p>
      {unconfirmed && (
        <div className={styles.notice} role="status">
          <span>Your last sell is not confirmed yet. Check your wallet history before selling again.</span>
          <button type="button" className="btn-ghost" onClick={() => setUnconfirmed(false)}>Dismiss</button>
        </div>
      )}
      {!live && !busy && (
        <div className={styles.notice} role="status">
          <span>{checking ? 'Loading the live price…' : 'Could not load the live price. Selling resumes once it loads.'}</span>
          {!checking && <button type="button" className="btn-ghost" onClick={retry}>Try again</button>}
        </div>
      )}
      {live && !sendable && !busy && (
        <div className={styles.notice} role="status">
          <span>Could not read your balance, so selling is paused.</span>
          <button type="button" className="btn-ghost" onClick={retry}>Try again</button>
        </div>
      )}
      <button type="button" className={`btn-primary ${styles.confirm}`} onClick={confirm} disabled={busy || !quote || !sendable}>
        {phase === 'signing' ? 'Confirm in your wallet…' : phase === 'confirming' ? 'Waiting for confirmation…' : connected ? `Confirm sell · ${amount || '0'} ${token.ticker}` : 'Connect wallet'}
      </button>
    </div>
  );
}
