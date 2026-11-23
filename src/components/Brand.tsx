import type { ReactNode } from 'react';
import styles from './Brand.module.css';

/**
 * Decoration for the full bandanna look: torn bandanna cloth, graffiti titles, crowns, paint drips and a spray can.
 * Every screen uses it; none of it carries data or handles input.
 */

/** A torn piece of blue bandanna cloth pinned to a top corner of the screen. */
export function Cloth({ corner = 'right', className = '' }: { corner?: 'left' | 'right'; className?: string }) {
  return (
    <span className={`${styles.cloth} ${corner === 'left' ? styles.clothLeft : styles.clothRight} ${className}`} aria-hidden>
      <span className={styles.clothWeave} />
    </span>
  );
}

/** Spray mist and paint flecks around a heading. */
export function Splatter({ className = '' }: { className?: string }) {
  return (
    <svg className={`${styles.splatter} ${className}`} viewBox="0 0 120 60" aria-hidden>
      <g fill="currentColor">
        <circle cx="12" cy="14" r="2.2" /><circle cx="22" cy="8" r="1.1" /><circle cx="6" cy="26" r="1.2" />
        <circle cx="30" cy="20" r="0.9" /><circle cx="96" cy="12" r="2.6" /><circle cx="108" cy="22" r="1.3" />
        <circle cx="88" cy="24" r="0.9" /><circle cx="112" cy="8" r="0.9" /><circle cx="70" cy="50" r="1.5" />
        <circle cx="80" cy="56" r="0.8" /><circle cx="46" cy="54" r="1" /><circle cx="18" cy="46" r="1.6" />
        <circle cx="102" cy="44" r="1.1" /><circle cx="58" cy="6" r="1" />
      </g>
    </svg>
  );
}

/** A spray can in a gloved hand's place: the Creator Studio tag. Drawn here, not taken from any artwork. */
export function SprayCan({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`${styles.can} ${className}`} width={size} height={size * 1.25} viewBox="0 0 64 80" fill="none" aria-hidden>
      <g fill="#6cc4ff" opacity="0.9">
        <circle cx="8" cy="10" r="1.6" /><circle cx="3" cy="17" r="1.1" /><circle cx="12" cy="4" r="1" />
        <circle cx="15" cy="13" r="1.3" /><circle cx="5" cy="5" r="0.8" /><circle cx="10" cy="20" r="0.8" />
      </g>
      <path d="M18 12 L4 6 M18 14 L3 14 M18 16 L5 23" stroke="#6cc4ff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <rect x="18" y="9" width="12" height="9" rx="2" fill="#e8f1ff" stroke="#0a1f4d" strokeWidth="2" />
      <path d="M22 18 h18 l5 8 H19 z" fill="#b9c8dd" stroke="#0a1f4d" strokeWidth="2" strokeLinejoin="round" />
      <rect x="17" y="26" width="32" height="50" rx="6" fill="url(#canBody)" stroke="#0a1f4d" strokeWidth="2.5" />
      <rect x="17" y="34" width="32" height="5" fill="#0a1f4d" opacity="0.55" />
      <rect x="17" y="64" width="32" height="5" fill="#0a1f4d" opacity="0.55" />
      <path d="M33 44 l7 4 -7 11 -7 -11 z" fill="#fff" />
      <path d="M33 48 v8" stroke="#1677ff" strokeWidth="1.6" />
      <path d="M22 30 v42" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <defs>
        <linearGradient id="canBody" x1="17" y1="26" x2="49" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#52c8ff" /><stop offset="0.55" stopColor="#1f8cff" /><stop offset="1" stopColor="#0d4fc8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Hand-drawn crown, the launchpad's tag. */
export function Crown({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`${styles.crown} ${className}`}
      width={size}
      height={size * 0.72}
      viewBox="0 0 50 36"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 31 L3 9 L15 20 L24 3 L33 19 L46 7 L44 31 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 26 C18 24 32 24 42 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="3" cy="8" r="2.4" fill="currentColor" />
      <circle cx="24" cy="2.6" r="2.4" fill="currentColor" />
      <circle cx="46" cy="6" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** Paint drips hanging under a graffiti title. */
export function Drips({ className = '' }: { className?: string }) {
  return (
    <svg className={`${styles.drips} ${className}`} viewBox="0 0 120 22" preserveAspectRatio="none" aria-hidden>
      <path
        d="M0 0 H120 V3 H104 C103 3 102.6 4 102.6 5 V15 C102.6 17.5 99 17.5 99 15 V5 C99 4 98.5 3 97.5 3 H70 C69 3 68.6 4 68.6 5 V9 C68.6 11 66 11 66 9 V5 C66 4 65.5 3 64.5 3 H36 C35 3 34.6 4 34.6 5 V19 C34.6 22 30.6 22 30.6 19 V5 C30.6 4 30 3 29 3 H12 C11 3 10.6 4 10.6 5 V8 C10.6 10 8 10 8 8 V5 C8 4 7.5 3 6.5 3 H0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * The header of a main screen: torn bandanna cloth in the top corners behind a graffiti title with a crown and drips.
 * `title` is painted white; `accent` is the part painted in TON blue.
 */
export function BrandHero({
  title,
  accent,
  subtitle,
  aside,
  children,
}: {
  title: string;
  accent?: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={styles.hero}>
      <Cloth corner="left" />
      <Cloth corner="right" />
      <Splatter className={styles.heroSplatter} />
      <div className={styles.heroTop}>
        <h1 className={styles.title}>
          <Crown className={styles.titleCrown} />
          <span className={styles.titleWhite}>{title}</span>
          {accent && (
            <>
              {' '}
              <span className={styles.titleBlue}>
                {accent}
                <Drips className={styles.titleDrips} />
              </span>
            </>
          )}
        </h1>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </section>
  );
}
