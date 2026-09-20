import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJwt } from '../_lib/jwt';
import { addToken, listTokens, type TokenRecord } from '../_lib/store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const tokens = listTokens();
    return res.status(200).json(tokens);
  }

  if (req.method === 'POST') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(503).json({ error: 'Server not configured' });

    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = verifyJwt(auth.slice(7), jwtSecret);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const body = req.body as Partial<TokenRecord>;
    if (!body.jettonAddress || !body.curveAddress || !body.name || !body.symbol || !body.creator) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token: TokenRecord = {
      jettonAddress: body.jettonAddress,
      curveAddress: body.curveAddress,
      creator: body.creator,
      creatorTelegramId: payload.tgId,
      name: body.name,
      symbol: body.symbol,
      imageUri: body.imageUri,
      description: body.description,
      telegramLink: body.telegramLink,
      raisedTon: body.raisedTon ?? 0,
      graduated: body.graduated ?? false,
      progressBps: body.progressBps ?? 0,
      createdAt: new Date().toISOString(),
    };

    addToken(token);
    return res.status(201).json(token);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
