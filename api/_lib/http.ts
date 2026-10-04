import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJwt, type JwtPayload } from './jwt';

/** Sends a generic 500 without leaking stack traces or upstream error text. */
export function serverError(res: VercelResponse, where: string, err: unknown) {
  console.error(`[${where}]`, err instanceof Error ? err.message : 'unknown error');
  return res.status(500).json({ error: 'Internal error' });
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
