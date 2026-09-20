import { Link } from 'react-router-dom';
import { IconBack } from '../components/Icons';
import styles from './Placeholder.module.css';

type Props = {
  title: string;
  blurb: string;
};

export function Placeholder({ title, blurb }: Props) {
  return (
    <div className={`page ${styles.wrap}`}>
      <Link to="/" className="btn-ghost" style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
        <IconBack size={14} />
        Home
      </Link>
      <h1>{title}</h1>
      <p className="muted">{blurb}</p>
      <p className={styles.demo}>Coming in a later build — V1 shell only.</p>
    </div>
  );
}
