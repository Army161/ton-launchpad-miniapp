import { IconInfo } from './Icons';
import styles from './BondingCurve.module.css';

type Props = {
  progress: number;
  raised: number;
  target: number;
};

/** The curve's real progress: filled and bright up to `progress`, dim after it. */
export function BondingCurve({ progress, raised, target }: Props) {
  const clamped = Math.min(100, Math.max(0, progress));
  const fraction = clamped / 100;

  const x = fraction * 200;
  const points = Array.from({ length: 51 }, (_, i) => {
    const px = (i / 50) * 200;
    const t = px / 200;
    const py = 96 - 88 * t * t;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L200,100 L0,100 Z`;

  return (
    <div className={`card ${styles.wrap}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>
            Bonding curve <IconInfo size={15} className={styles.info} />
          </span>
          <span className={styles.progress}>{clamped.toFixed(0)}% completed</span>
        </div>
        <span className={styles.raised}>
          {raised.toLocaleString()} / {target.toLocaleString()} TON
        </span>
      </div>
      <div className={styles.chartWrap}>
        <svg className={styles.svg} viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="bcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f9bff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#1f9bff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="bcClip">
              <rect x="0" y="0" width={x} height="100" />
            </clipPath>
          </defs>
          <g className={styles.grid}>
            {[20, 40, 60, 80].map((g) => (
              <line key={`h${g}`} x1="0" y1={g} x2="200" y2={g} />
            ))}
            {[40, 80, 120, 160].map((g) => (
              <line key={`v${g}`} x1={g} y1="0" x2={g} y2="100" />
            ))}
          </g>
          <path d={areaPath} fill="url(#bcFill)" clipPath="url(#bcClip)" />
          <path d={linePath} fill="none" stroke="rgba(31,155,255,0.35)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path d={linePath} fill="none" stroke="#3fb2ff" strokeWidth="2.5" clipPath="url(#bcClip)" vectorEffect="non-scaling-stroke" className={styles.line} />
        </svg>
        {fraction > 0 && (
          <span
            className={styles.dot}
            style={{ left: `${clamped}%`, top: `${96 - 88 * fraction * fraction}%` }}
            aria-hidden
          />
        )}
      </div>
      <div className={styles.axis}>
        <span className={styles.axisEdge}>0%</span>
        <span className={styles.axisMid}>Supply</span>
        <span className={styles.axisEdgeRight}>100%</span>
      </div>
    </div>
  );
}
