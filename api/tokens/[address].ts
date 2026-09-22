import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Address } from '@ton/core';
import { readHolderBalance, readLaunchpadToken, serverFactory } from '../_lib/chain';
import { serverError } from '../_lib/http';

function parseAddress(value: unknown): Address | null {
  if (typeof value !== 'string' || value.length > 100) return null;
  try {
    return Address.parse(value);
  } catch {
    return null;
  }
}

/** GET /api/tokens/:address[?holder=<wallet>] — live curve state, optional holder balance. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const factory = serverFactory();
  if (!factory) return res.status(503).json({ error: 'Factory not configured' });

  const address = parseAddress(req.query.address);
  if (!address) return res.status(400).json({ error: 'Invalid token address' });
  const holder = req.query.holder === undefined ? null : parseAddress(req.query.holder);
  if (req.query.holder !== undefined && !holder) return res.status(400).json({ error: 'Invalid holder address' });

  try {
    const token = await readLaunchpadToken(address, factory).catch(() => null);
    if (!token) return res.status(404).json({ error: 'Not a launchpad token' });
    const balance = holder ? (await readHolderBalance(address, holder)).toString() : undefined;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ token, balance });
  } catch (err) {
    return serverError(res, 'token', err);
  }
}
