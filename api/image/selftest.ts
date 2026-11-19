import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { timingSafeEqual } from 'crypto';
import { gatewayToken, IMAGE_MODELS, ImageGenError, requestImage } from '../_lib/imageGen.js';
import { toTokenImage } from '../_lib/tokenImage.js';
import { dayKey } from '../_lib/quota.js';

/** A key shorter than this (unset, "off") leaves the endpoint closed. */
const MIN_KEY_LENGTH = 32;

function keyMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * End-to-end check of the generator on a preview deployment, because nothing else can call the POST endpoint without
 * a Telegram session: one real image through AI Gateway, sharp and Blob for `?model=<id>`.
 *
 * Answers 404 unless this is a Vercel preview, IMAGE_SELFTEST holds a key of 32+ characters and `?key=` equals it.
 * Never served in production. Each call costs one image, so the key is set only while a check runs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expected = process.env.IMAGE_SELFTEST?.trim() ?? '';
  if (process.env.VERCEL_ENV !== 'preview' || expected.length < MIN_KEY_LENGTH || req.method !== 'GET' || !keyMatches(req.query.key, expected)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const model = IMAGE_MODELS.find((m) => m.id === req.query.model) ?? IMAGE_MODELS[0];
  const token = gatewayToken(req.headers);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!token || !blobConfigured) return res.status(200).json({ ok: false, stage: 'config', gatewayToken: Boolean(token), blobConfigured });

  const started = Date.now();
  let stage = 'gateway';
  try {
    const raw = await requestImage(model, 'A cheerful yellow canary wearing aviator goggles', token);
    stage = 'sharp';
    const image = await toTokenImage(raw);
    stage = 'blob';
    const blob = await put(`selftest/${dayKey()}/${model.id.replace('/', '-')}.jpg`, image, {
      access: 'public',
      contentType: 'image/jpeg',
      allowOverwrite: true,
    });
    return res.status(200).json({ ok: true, model: model.id, bytesIn: raw.length, bytesOut: image.length, ms: Date.now() - started, uri: blob.url });
  } catch (err) {
    const failure = err instanceof ImageGenError ? { kind: err.kind, status: err.status, detail: err.detail } : { kind: err instanceof Error ? err.name : 'error' };
    return res.status(200).json({ ok: false, model: model.id, stage, ms: Date.now() - started, ...failure });
  }
}
