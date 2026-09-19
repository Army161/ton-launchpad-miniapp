import styles from './Sparkline.module.css';

/** Decorative upward sparkline matching featured cards. */
export function Sparkline({ color = '#30A1F5' }: { color?: string }) {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 32 C20 30, 28 26, 40 22 S60 18, 72 14 S96 10, 120 4 L120 40 L0 40 Z"
        fill="url(#sparkFill)"
      />
      <path
        d="M0 32 C20 30, 28 26, 40 22 S60 18, 72 14 S96 10, 120 4"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
