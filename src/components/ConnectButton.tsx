import { useWallet } from '../context/WalletContext';
import { IconTon } from './Icons';
import styles from './ConnectButton.module.css';

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { connected, address, toggle } = useWallet();

  return (
    <button
      type="button"
      className={`${styles.btn}${connected ? ` ${styles.connected}` : ''}`}
      onClick={toggle}
      title="TON Connect stub — toggles mock connected state only"
    >
      <IconTon size={compact ? 16 : 18} />
      <span>
        {connected
          ? compact
            ? 'Connected'
            : address
          : compact
            ? 'TON'
            : 'Connect'}
      </span>
    </button>
  );
}
