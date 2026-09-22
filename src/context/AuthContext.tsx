import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthUser = {
  id: number;
  username?: string;
  firstName?: string;
  photoUrl?: string;
  walletAddress?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isTelegram: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('lp_auth_token'),
  );
  const [loading, setLoading] = useState(true);

  const isTelegram = Boolean(window.Telegram?.WebApp?.initData);

  const authenticate = useCallback(async () => {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      // Outside Telegram there is no verified identity; show a placeholder only in dev.
      if (import.meta.env.DEV) setUser({ id: 0, firstName: 'Dev User' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string; user: AuthUser };
        setToken(data.token);
        setUser({
          ...data.user,
          photoUrl: (data.user as { photoUrl?: string; photo_url?: string }).photoUrl
            ?? (data.user as { photo_url?: string }).photo_url,
        });
        localStorage.setItem('lp_auth_token', data.token);
      } else {
        localStorage.removeItem('lp_auth_token');
        setToken(null);
        // Fallback to unsafe data for UI (no API in dev)
        const unsafe = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (unsafe) setUser({ ...unsafe, photoUrl: unsafe.photo_url });
      }
    } catch {
      const unsafe = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (unsafe) setUser({ ...unsafe, photoUrl: unsafe.photo_url });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const value = useMemo(
    () => ({ user, token, loading, isTelegram }),
    [user, token, loading, isTelegram],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
