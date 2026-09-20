import { ConnectButton } from '../components/ConnectButton';
import { TokenAvatar } from '../components/TokenAvatar';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { CONFIG } from '../lib/config';

export function Profile() {
  const { user, isTelegram, loading } = useAuth();
  const { connected, address, friendlyAddress, connect, disconnect } = useWallet();

  if (loading) {
    return (
      <div className="page">
        <p className="muted" style={{ textAlign: 'center', marginTop: 48 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="home-header">
        <h1 className="home-title">Profile</h1>
        <ConnectButton compact />
      </header>

      <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <TokenAvatar
          emoji={user?.firstName?.[0] ?? '👤'}
          color="#30A1F5"
          size={64}
          imageUrl={user?.photoUrl}
        />
        <div style={{ textAlign: 'center' }}>
          <strong style={{ fontSize: 18 }}>
            {user?.firstName ?? 'Guest'}
            {user?.username ? ` @${user.username}` : ''}
          </strong>
          {isTelegram && (
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Telegram Mini App</p>
          )}
        </div>

        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border)' }} />

        <div style={{ width: '100%' }}>
          <p className="muted" style={{ fontSize: 12 }}>Wallet</p>
          <p style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
            {connected ? address : 'Not connected'}
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <p className="muted" style={{ fontSize: 12 }}>Network</p>
          <p>{CONFIG.network === 'mainnet' ? 'TON Mainnet' : 'TON Testnet'}</p>
        </div>

        <div style={{ width: '100%' }}>
          <p className="muted" style={{ fontSize: 12 }}>Trading fee</p>
          <p>{CONFIG.tradeFeePercent}% ({CONFIG.creatorFeeShare}% creator / {CONFIG.platformFeeShare}% platform)</p>
        </div>

        <button
          type="button"
          className={connected ? 'btn-secondary' : 'btn-primary'}
          style={{ width: '100%' }}
          onClick={connected ? disconnect : connect}
        >
          {connected ? `Disconnect ${friendlyAddress}` : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
}
