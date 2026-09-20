import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { Buy } from './pages/Buy';
import { Create } from './pages/Create';
import { Home } from './pages/Home';
import { Placeholder } from './pages/Placeholder';
import { Sell } from './pages/Sell';
import { TokenDetail } from './pages/TokenDetail';

const HIDE_NAV = ['/create', '/token/', '/buy/', '/sell/'];

function Shell() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV.some(
    (p) => pathname === p || pathname.startsWith(p),
  );

  return (
    <div className="app-shell">
      <div className="demo-banner">
        Sandbox UI · demo data · TON Connect stub · no mainnet txs
      </div>
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
              blurb="Browse launches and search — shell placeholder for V1."
            />
          }
        />
        <Route
          path="/my-tokens"
          element={
            <Placeholder
              title="My Tokens"
              blurb="Your created and held tokens will appear here."
            />
          }
        />
        <Route
          path="/profile"
          element={
            <Placeholder
              title="Profile"
              blurb="Wallet stub profile. Connect toggles mock state only."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </WalletProvider>
  );
}
