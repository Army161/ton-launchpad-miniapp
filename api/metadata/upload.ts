import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireAuth, serverError } from '../_lib/http';

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

function readBody(req: VercelRequest): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(null));
  });
}

/**
 * Stores a token image in Vercel Blob and returns its public https URL, which
 * goes into the on-chain metadata. Needs BLOB_READ_WRITE_TOKEN (enable Blob
 * storage on the Vercel project); without it the Create page asks for a URL.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAuth(req, res)) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Image upload not configured' });

  const mime = (req.headers['content-type'] ?? '').split(';')[0].trim();
  const ext = TYPES[mime];
  if (!ext) return res.status(415).json({ error: 'Use PNG, JPEG, WebP or GIF' });

  const data = await readBody(req);
  if (!data || data.length === 0) return res.status(400).json({ error: 'Invalid or too large image (max 2MB)' });

  try {
    const blob = await put(`tokens/${randomUUID()}.${ext}`, data, { access: 'public', contentType: mime });
    return res.status(200).json({ uri: blob.url });
  } catch (err) {
    return serverError(res, 'upload', err);
  }
}
