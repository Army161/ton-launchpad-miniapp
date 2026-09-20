import styles from './BondingCurve.module.css';

type Props = {
  progress: number;
  raised: number;
  target: number;
};

export function BondingCurve({ progress, raised, target }: Props) {
  const clamped = Math.min(100, Math.max(0, progress));
  const fraction = clamped / 100;

  const x = fraction * 200;
  const points = Array.from({ length: 51 }, (_, i) => {
    const px = (i / 50) * 200;
    const t = px / 200;
    const py = 80 - 76 * t * t;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L200,80 L0,80 Z`;

  return (
    <div className={`card ${styles.wrap}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>Bonding curve</span>
          <span className={styles.progress}>{clamped.toFixed(0)}% completed</span>
        </div>
        <span className={styles.raised}>
          {raised.toLocaleString()} / {target.toLocaleString()} TON
        </span>
      </div>
      <div className={styles.chartWrap}>
        <svg className={styles.svg} viewBox="0 0 200 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ton-blue)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--ton-blue)" stopOpacity="0" />
            </linearGradient>
            <clipPath id="bcClip">
              <rect x="0" y="0" width={x} height="80" />
            </clipPath>
          </defs>
          <path d={areaPath} fill="url(#bcFill)" clipPath="url(#bcClip)" />
          <path d={linePath} fill="none" stroke="var(--border)" strokeWidth="1.5" />
          <path d={linePath} fill="none" stroke="var(--ton-blue)" strokeWidth="2" clipPath="url(#bcClip)" />
          {fraction > 0 && (
            <circle cx={x} cy={80 - 76 * fraction * fraction} r="3.5" fill="var(--ton-blue)" />
          )}
        </svg>
      </div>
      <div className={styles.axis}>
        <span className={styles.axisEdge}>0</span>
        <span className={styles.axisMid}>Supply</span>
        <span className={styles.axisEdgeRight}>100%</span>
        <span className={styles.axisActive} style={{ left: `${clamped}%` }}>
          {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
