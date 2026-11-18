import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJwt, type JwtPayload } from './jwt.js';
import type { ChainUnavailableError } from './toncenter.js';

/** Seconds a client should wait before asking again after a 503 from a chain read. */
export const CHAIN_RETRY_AFTER_SECONDS = 5;

/** Sends a generic 500 without leaking stack traces or upstream error text. */
export function serverError(res: VercelResponse, where: string, err: unknown) {
  console.error(`[${where}]`, err instanceof Error ? err.message : 'unknown error');
  return res.status(500).json({ error: 'Internal error' });
}

/** Sends 503 when toncenter could not be read (rate limit, timeout, 5xx): not cached, safe to retry shortly. */
export function chainUnavailable(res: VercelResponse, where: string, err: ChainUnavailableError) {
  console.warn(`[${where}]`, err.message);
  res.setHeader('Retry-After', String(CHAIN_RETRY_AFTER_SECONDS));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).json({ error: 'Chain temporarily unavailable' });
}

export function requireAuth(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'Server not configured' });
    return null;
  }
  const auth = req.headers.authorization;
  const payload = auth?.startsWith('Bearer ') ? verifyJwt(auth.slice(7), secret) : null;
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return payload;
}
