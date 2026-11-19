import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireAuth, serverError } from '../_lib/http.js';
import { quotaFolder, readQuota } from '../_lib/quota.js';

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
/** Uploads per Telegram user and for everyone per UTC day (SECURITY #13). The store is small; a token needs one image. */
export const UPLOAD_LIMITS = { userDailyLimit: 10, globalDailyLimit: 300 };

/** The image type the first bytes say this is, or null. The declared Content-Type must agree with it. */
export function sniffImageType(data: Buffer): string | null {
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString('latin1'))) return 'image/gif';
  if (data.length >= 12 && data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

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
 * The bytes must really be the image type they claim, and each Telegram user
 * has a daily number of uploads (UPLOAD_LIMITS).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Image upload not configured' });

  const mime = (req.headers['content-type'] ?? '').split(';')[0].trim();
  const ext = TYPES[mime];
  if (!ext) return res.status(415).json({ error: 'Use PNG, JPEG, WebP or GIF' });

  const data = await readBody(req);
  if (!data || data.length === 0) return res.status(400).json({ error: 'Invalid or too large image (max 2MB)' });
  if (sniffImageType(data) !== mime) return res.status(415).json({ error: 'The file is not a valid PNG, JPEG, WebP or GIF image' });

  try {
    const quota = await readQuota('uploads', user.tgId, UPLOAD_LIMITS);
    if (!quota.allowed) return res.status(429).json({ error: 'Upload limit for today reached, paste an image URL instead', scope: quota.scope });
    const blob = await put(`${quotaFolder('uploads', user.tgId)}${randomUUID()}.${ext}`, data, { access: 'public', contentType: mime });
    return res.status(200).json({ uri: blob.url });
  } catch (err) {
    return serverError(res, 'upload', err);
  }
}
