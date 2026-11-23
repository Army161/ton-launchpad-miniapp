import type { ReactNode } from 'react';
import styles from './Brand.module.css';

/**
 * Brand-only decoration (the bandanna/graffiti look): hero titles, crowns, paint drips and bandanna corners.
 * Trading screens keep the clean look; none of this carries data or handles input.
 */

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
 * A brand hero: bandanna corners behind a graffiti title with a crown and drips.
 * `title` is graffiti; `accent` is the part painted in TON blue.
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
      <span className={`${styles.bandanna} ${styles.bandannaLeft}`} aria-hidden />
      <span className={`${styles.bandanna} ${styles.bandannaRight}`} aria-hidden />
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
