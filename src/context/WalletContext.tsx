import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useAuth } from './AuthContext';

type WalletContextValue = {
  connected: boolean;
  address: string | null;
  friendlyAddress: string | null;
  connect: () => void;
  disconnect: () => void;
  sendTransaction: (params: {
    to: string;
    amount: string;
    payload?: string;
  }) => Promise<{ boc: string }>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { token } = useAuth();

  const rawAddress = wallet?.account.address ?? null;
  const friendlyAddress = rawAddress ? truncateAddress(rawAddress) : null;

  const connect = useCallback(() => {
    tonConnectUI.openModal();
  }, [tonConnectUI]);

  const disconnect = useCallback(async () => {
    await tonConnectUI.disconnect();
  }, [tonConnectUI]);

  const sendTransaction = useCallback(
    async (params: { to: string; amount: string; payload?: string }) => {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: params.to,
            amount: params.amount,
            payload: params.payload,
          },
        ],
      });
      return result;
    },
    [tonConnectUI],
  );

  // Auto-link wallet to Telegram user
  useEffect(() => {
    if (!rawAddress || !token) return;
    fetch('/api/auth/link-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ walletAddress: rawAddress }),
    }).catch(() => {});
  }, [rawAddress, token]);

  const value = useMemo(
    () => ({
      connected: Boolean(wallet),
      address: rawAddress,
      friendlyAddress,
      connect,
      disconnect,
      sendTransaction,
    }),
    [wallet, rawAddress, friendlyAddress, connect, disconnect, sendTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
