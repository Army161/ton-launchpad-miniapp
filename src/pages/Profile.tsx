import { BrandHero } from '../components/Brand';
import { ConnectButton } from '../components/ConnectButton';
import { IconTon, IconWallet, IconChart } from '../components/Icons';
import { TokenAvatar } from '../components/TokenAvatar';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { CONFIG, walletDisplayAddress } from '../lib/config';
import styles from './Profile.module.css';

export function Profile() {
  const { user, isTelegram, loading } = useAuth();
  const { connected, address, friendlyAddress, connect, disconnect } = useWallet();

  if (loading) {
    return (
      <div className="page">
        <p className="muted loading-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={`page ${styles.page}`}>
      <BrandHero
        title="My"
        accent="Profile"
        aside={<ConnectButton compact />}
        subtitle="Your Telegram account and TON wallet."
      />

      <div className={styles.userRow}>
        <span className={styles.avatarRing}>
          <TokenAvatar emoji={user?.firstName?.[0] ?? '👤'} color="#30A1F5" size={60} imageUrl={user?.photoUrl} />
        </span>
        <div className={styles.userNames}>
          <strong>{user?.firstName ?? 'Guest'}</strong>
          {user?.username && <span className={styles.handle}>@{user.username}</span>}
          {isTelegram && <span className={styles.tag}>Telegram Mini App</span>}
        </div>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.infoIcon}>
          <IconWallet size={24} />
        </span>
        <div className={styles.infoText}>
          <span className={styles.infoLabel}>Wallet</span>
          <span className={styles.mono}>{connected && address ? walletDisplayAddress(address) : 'Not connected'}</span>
        </div>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.infoIcon}>
          <IconTon size={24} />
        </span>
        <div className={styles.infoText}>
          <span className={styles.infoLabel}>Network</span>
          <span>{CONFIG.network === 'mainnet' ? 'TON Mainnet' : 'TON Testnet'}</span>
        </div>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.infoIcon}>
          <IconChart size={24} />
        </span>
        <div className={styles.infoText}>
          <span className={styles.infoLabel}>Trading fee</span>
          <span>{CONFIG.tradeFeePercent}% ({CONFIG.creatorFeeShare}% creator / {CONFIG.platformFeeShare}% platform)</span>
        </div>
      </div>

      <button
        type="button"
        className={`${connected ? 'btn-secondary' : 'btn-primary'} ${styles.walletBtn}`}
        onClick={connected ? disconnect : connect}
      >
        {connected ? `Disconnect ${friendlyAddress}` : 'Connect Wallet'}
      </button>
    </div>
  );
}
