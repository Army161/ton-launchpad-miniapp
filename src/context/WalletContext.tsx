import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type WalletContextValue = {
  connected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
  toggle: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const MOCK_ADDRESS = 'UQDemo…Sandbox';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => setConnected(true), []);
  const disconnect = useCallback(() => setConnected(false), []);
  const toggle = useCallback(() => setConnected((c) => !c), []);

  const value = useMemo(
    () => ({
      connected,
      address: connected ? MOCK_ADDRESS : null,
      connect,
      disconnect,
      toggle,
    }),
    [connected, connect, disconnect, toggle],
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
