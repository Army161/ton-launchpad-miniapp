import { BrandHero } from '../components/Brand';
import styles from './Placeholder.module.css';

type Props = {
  title: string;
  blurb: string;
};

export function Placeholder({ title, blurb }: Props) {
  return (
    <div className="page">
      <BrandHero title={title} subtitle={blurb} />
      <p className={styles.demo}>Coming in a later build — V1 shell only.</p>
    </div>
  );
}
