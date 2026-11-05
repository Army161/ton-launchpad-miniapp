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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const lpTokens = await fetchLaunchpadTokens();
      if (!cancelled) {
        registerLiveTokens(lpTokens.map(launchpadToToken));
        if (address) {
          const me = Address.parse(address);
          setCreated(lpTokens.filter((t) => Address.parse(t.creator).equals(me)).map((t) => t.address));
        }
      }

      if (address) {
        const balances = await fetchWalletJettons(address);
        if (!cancelled) setJettons(balances);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [address]);

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
          {created.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Created</h2>
              <div className="token-grid">
                {created.map((id) => (
                  <Link key={id} to={`/token/${id}`} className="token-card card">
                    <span>{id.slice(0, 8)}…</span>
                  </Link>
                ))}
              </div>
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
