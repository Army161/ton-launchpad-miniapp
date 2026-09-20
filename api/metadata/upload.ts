import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJwt } from '../_lib/jwt';

export const config = {
  api: { bodyParser: false },
};

function parseMultipart(req: VercelRequest): Promise<{ data: Buffer; mime: string } | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (buf.length === 0) return resolve(null);
      const ct = req.headers['content-type'] ?? 'image/png';
      resolve({ data: buf, mime: ct.split(';')[0] });
    });
    req.on('error', () => resolve(null));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(503).json({ error: 'Server not configured' });

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  if (!verifyJwt(auth.slice(7), jwtSecret)) return res.status(401).json({ error: 'Invalid token' });

  const file = await parseMultipart(req);
  if (!file || file.data.length > 2 * 1024 * 1024) {
    return res.status(400).json({ error: 'Invalid or too large image (max 2MB)' });
  }

  // V1: return data URI — production should use Vercel Blob or IPFS
  const b64 = file.data.toString('base64');
  const uri = `data:${file.mime};base64,${b64}`;

  return res.status(200).json({ uri });
}
