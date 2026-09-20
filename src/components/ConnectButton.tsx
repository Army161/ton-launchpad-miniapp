import { useWallet } from '../context/WalletContext';
import { IconTon } from './Icons';
import styles from './ConnectButton.module.css';

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { connected, friendlyAddress, connect, disconnect } = useWallet();

  return (
    <button
      type="button"
      className={`${styles.btn}${connected ? ` ${styles.connected}` : ''}`}
      onClick={connected ? disconnect : connect}
      title={connected ? 'Disconnect wallet' : 'Connect TON wallet'}
    >
      <IconTon size={compact ? 16 : 18} />
      <span>
        {connected
          ? compact
            ? 'Connected'
            : friendlyAddress
          : compact
            ? 'Connect'
            : 'Connect Wallet'}
      </span>
    </button>
  );
}
