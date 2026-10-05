import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { CHAIN, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CONFIG } from '../lib/config';

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
        validUntil: Math.floor(Date.now() / 1000) + 300,
        // Wallets refuse to sign if the user is on the other network.
        network: CONFIG.network === 'testnet' ? CHAIN.TESTNET : CHAIN.MAINNET,
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
