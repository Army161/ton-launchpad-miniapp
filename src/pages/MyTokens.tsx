import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '../components/ConnectButton';
import { TokenAvatar } from '../components/TokenAvatar';
import { useWallet } from '../context/WalletContext';
import { Address } from '@ton/core';
import { fetchWalletJettons, type JettonBalance } from '../lib/tonapi';
import { fetchLaunchpadTokens } from '../lib/launchpadApi';
import { formatUnits } from '../lib/contracts';
import { registerLiveTokens, launchpadToToken } from '../data/tokens';

export function MyTokens() {
  const { connected, address, connect } = useWallet();
  const [jettons, setJettons] = useState<JettonBalance[]>([]);
  const [created, setCreated] = useState<string[]>([]);
  // The launchpad list could not be loaded, or only in part: tokens this wallet created may be missing.
  const [createdIncomplete, setCreatedIncomplete] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const list = await fetchLaunchpadTokens();
      if (!cancelled) {
        // A failed list shows no created tokens (never another wallet's from an earlier load), with the note below.
        const tokens = list.status === 'ok' ? list.tokens : [];
        registerLiveTokens(tokens.map(launchpadToToken));
        if (address) {
          const me = Address.parse(address);
          setCreated(tokens.filter((t) => Address.parse(t.creator).equals(me)).map((t) => t.address));
        }
        setCreatedIncomplete(list.status === 'error' || list.partial);
      }

      if (address) {
        const balances = await fetchWalletJettons(address);
        if (!cancelled) setJettons(balances);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [address, attempt]);

  if (!connected) {
    return (
      <div className="page">
        <header className="home-header">
          <h1 className="home-title">My Tokens</h1>
          <ConnectButton compact />
        </header>
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>
          Connect your wallet to see held and created tokens.
        </p>
        <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={connect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="home-header">
        <h1 className="home-title">My Tokens</h1>
        <ConnectButton compact />
      </header>

      {loading ? (
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>Loading...</p>
      ) : (
        <>
          {(created.length > 0 || createdIncomplete) && (
            <>
              <h2 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Created</h2>
              {createdIncomplete && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p className="muted" style={{ fontSize: 13 }}>Could not load all launchpad tokens, so some you created may be missing.</p>
                  <button type="button" className="btn-ghost" onClick={() => setAttempt((n) => n + 1)}>
                    Try again
                  </button>
                </div>
              )}
              {created.length > 0 && (
                <div className="token-grid">
                  {created.map((id) => (
                    <Link key={id} to={`/token/${id}`} className="token-card card">
                      <span>{id.slice(0, 8)}…</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>Holdings</h2>
          {jettons.length === 0 ? (
            <p className="muted">No jetton balances found.</p>
          ) : (
            <div className="token-grid">
              {jettons.map((j) => (
                <Link key={j.address} to={`/token/${j.address}`} className="token-card card">
                  <div className="token-card-top">
                    <TokenAvatar emoji="🪙" color="#30A1F5" size={36} imageUrl={j.image} />
                    <div className="token-card-names">
                      <strong>{j.name}</strong>
                      <span className="muted">${j.symbol}</span>
                    </div>
                  </div>
                  <span className="token-card-price">{formatUnits(BigInt(j.balance), j.decimals, 2)}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
