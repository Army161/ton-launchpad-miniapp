import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateInitData } from '../_lib/telegram';
import { signJwt } from '../_lib/jwt';

// Sessions are stateless: the JWT carries the Telegram id, nothing is stored.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;
  if (!botToken || !jwtSecret) return res.status(503).json({ error: 'Server not configured' });

  const initData = (req.body as { initData?: unknown } | undefined)?.initData;
  if (typeof initData !== 'string' || !initData) return res.status(400).json({ error: 'initData required' });

  const tgUser = validateInitData(initData, botToken);
  if (!tgUser) return res.status(401).json({ error: 'Invalid initData' });

  return res.status(200).json({
    token: signJwt(tgUser.id, jwtSecret),
    user: {
      id: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      photoUrl: tgUser.photo_url,
    },
  });
}
