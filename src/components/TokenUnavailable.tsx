import { Link } from 'react-router-dom';
import { IconBack } from './Icons';

/**
 * A token page whose token could not be loaded: why, and a way to look again. `launched`: the user was sent here
 * right after a launch that was not confirmed yet, so it must not read as a failed launch.
 */
export function TokenUnavailable({ status, launched = false, onRetry }: { status: string; launched?: boolean; onRetry: () => void }) {
  const message = launched
    ? 'Your launch is not confirmed yet. Check your wallet history before launching again.'
    : status === 'error'
      ? 'Could not load this token. Try again shortly.'
      : 'Token not found.';
  return (
    <div className="page page--no-nav">
      <Link to="/" className="btn-ghost">
        <IconBack /> Back
      </Link>
      <p style={{ marginTop: 24 }} className="muted">
        {message}
      </p>
      <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
