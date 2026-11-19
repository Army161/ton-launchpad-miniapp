import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { CONFIG } from './lib/config';
import { Buy } from './pages/Buy';
import { Create } from './pages/Create';
import { Home } from './pages/Home';
import { MyTokens } from './pages/MyTokens';
import { Placeholder } from './pages/Placeholder';
import { Profile } from './pages/Profile';
import { Sell } from './pages/Sell';
import { TokenDetail } from './pages/TokenDetail';

// The one-time factory deploy (docs/EXECUTION.md, "Factory deploy from a wallet app"): its own chunk, and a route only where it is switched on.
const DeployFactory = lazy(() => import('./pages/DeployFactory').then((m) => ({ default: m.DeployFactory })));

const HIDE_NAV = ['/create', '/token/', '/buy/', '/sell/', '/deploy-factory'];

function Shell() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV.some(
    (p) => pathname === p || pathname.startsWith(p),
  );

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/token/:id" element={<TokenDetail />} />
        <Route path="/buy/:id" element={<Buy />} />
        <Route path="/sell/:id" element={<Sell />} />
        <Route
          path="/explore"
          element={
            <Placeholder
              title="Explore"
              blurb="Search and filter launchpad tokens — coming in V1.1."
            />
          }
        />
        <Route path="/my-tokens" element={<MyTokens />} />
        <Route path="/profile" element={<Profile />} />
        {CONFIG.factoryDeployPage && (
          <Route
            path="/deploy-factory"
            element={
              <Suspense fallback={<div className="page loading-pulse">Loading…</div>}>
                <DeployFactory />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <TonConnectUIProvider
      manifestUrl={CONFIG.manifestUrl}
      uiPreferences={{ theme: THEME.DARK }}
      actionsConfiguration={
        CONFIG.twaReturnUrl ? { twaReturnUrl: CONFIG.twaReturnUrl as `${string}://${string}` } : undefined
      }
    >
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </WalletProvider>
      </AuthProvider>
    </TonConnectUIProvider>
  );
}
