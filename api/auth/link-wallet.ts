import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJwt } from '../_lib/jwt';
import { linkWallet } from '../_lib/store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(503).json({ error: 'Server not configured' });

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = verifyJwt(auth.slice(7), jwtSecret);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { walletAddress } = req.body as { walletAddress?: string };
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const user = linkWallet(payload.tgId, walletAddress);
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({ walletAddress: user.walletAddress });
}
