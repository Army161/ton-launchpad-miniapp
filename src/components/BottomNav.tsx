import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { IconUser } from './Icons';
import { IconNavDiscover, IconNavHoldings, IconNavHome } from './NavIcons';
import styles from './BottomNav.module.css';

type IconFn = (p: {
  size?: number;
  className?: string;
  filled?: boolean;
}) => ReactElement;

const items: { to: string; label: string; icon: IconFn; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: IconNavHome, end: true },
  { to: '/explore', label: 'Explore', icon: IconNavDiscover },
  { to: '/my-tokens', label: 'My Tokens', icon: IconNavHoldings },
  /* No official Tabbar Profile in ton-org/kit-ios — keep interim IconUser */
  { to: '/profile', label: 'Profile', icon: IconUser },
];

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={!!end}
          className={({ isActive }) =>
            `${styles.item}${isActive ? ` ${styles.active}` : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} filled={isActive && to !== '/profile'} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
