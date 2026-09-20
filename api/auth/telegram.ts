import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateInitData } from '../_lib/telegram';
import { signJwt } from '../_lib/jwt';
import { upsertUser } from '../_lib/store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;

  if (!botToken || !jwtSecret) {
    return res.status(503).json({ error: 'Server not configured' });
  }

  const { initData } = req.body as { initData?: string };
  if (!initData) {
    return res.status(400).json({ error: 'initData required' });
  }

  const tgUser = validateInitData(initData, botToken);
  if (!tgUser) {
    return res.status(401).json({ error: 'Invalid initData' });
  }

  const user = upsertUser({
    telegramId: tgUser.id,
    username: tgUser.username,
    firstName: tgUser.first_name,
  });

  const token = signJwt(tgUser.id, jwtSecret);

  return res.status(200).json({
    token,
    user: {
      id: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      photoUrl: tgUser.photo_url,
      walletAddress: user.walletAddress ?? null,
    },
  });
}
