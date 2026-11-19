import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireAuth, serverError } from '../_lib/http.js';
import { cleanPrompt, gatewayToken, imageGenConfig, ImageGenError, PROMPT_LIMITS, requestImage } from '../_lib/imageGen.js';
import { toTokenImage } from '../_lib/tokenImage.js';
import { createCooldown, quotaFolder, readQuota } from '../_lib/quota.js';

/** One attempt per user every 8 s (per function instance), so a failing prompt cannot be retried in a tight loop. */
const cooldown = createCooldown(8000);

/**
 * AI token image (ADR-012).
 *
 * GET: what the Create page needs to draw the form (models, limits). No session needed, reads nothing.
 * POST {prompt, model?}: Telegram session required. Checks today's limits, asks AI Gateway for one image, stores a
 * 512 px JPEG in Blob and returns its https URL for the token metadata.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = imageGenConfig();
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({
      enabled: config.enabled,
      models: config.enabled ? config.models.map(({ id, label }) => ({ id, label })) : [],
      userDailyLimit: config.userDailyLimit,
      promptMax: PROMPT_LIMITS.max,
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;
  if (!config.enabled) return res.status(503).json({ error: 'Image generation not configured' });
  const token = gatewayToken(req.headers);
  if (!token) return res.status(503).json({ error: 'Image generation not configured' });

  const body = (req.body ?? {}) as { prompt?: unknown; model?: unknown };
  const prompt = cleanPrompt(body.prompt);
  if (!prompt) return res.status(400).json({ error: `Describe the image in ${PROMPT_LIMITS.min} to ${PROMPT_LIMITS.max} characters` });
  const model = body.model === undefined ? config.models[0] : config.models.find((m) => m.id === body.model);
  if (!model) return res.status(400).json({ error: 'Unknown image model' });

  const wait = cooldown.hit(user.tgId);
  if (wait > 0) {
    res.setHeader('Retry-After', String(wait));
    return res.status(429).json({ error: `Wait ${wait} s before generating again`, scope: 'cooldown' });
  }

  // One accounting time for the count and the file: a request that crosses UTC midnight stays in the day it was counted in.
  const now = Date.now();
  try {
    const quota = await readQuota('generated', user.tgId, config, now);
    if (!quota.allowed) {
      const error =
        quota.scope === 'user'
          ? `You have used today's ${config.userDailyLimit} free images. Upload one or paste a URL instead.`
          : 'Free images are used up for today. Upload one or paste a URL instead.';
      return res.status(429).json({ error, scope: quota.scope, remaining: 0 });
    }

    const raw = await requestImage(model, prompt, token);
    const image = await toTokenImage(raw);
    const folder = quotaFolder('generated', user.tgId, now);
    const blob = await put(`${folder}${randomUUID()}.jpg`, image, {
      access: 'public',
      contentType: 'image/jpeg',
    });
    // The only place a stored file is tied to its Telegram user (abuse follow-up); the public address shows neither.
    console.info('[image/generate] stored', folder, 'tg', user.tgId);
    return res.status(200).json({
      uri: blob.url,
      model: model.id,
      remaining: Math.max(0, config.userDailyLimit - quota.userCount - 1),
    });
  } catch (err) {
    if (err instanceof ImageGenError) {
      // Status only: the provider's error text is not logged or returned.
      console.warn('[image/generate]', model.id, err.kind, err.status ?? '-');
      if (err.kind === 'rejected') return res.status(422).json({ error: 'The image service refused this description. Try different words.' });
      return res.status(503).json({ error: 'Image generation is unavailable right now. Upload one or paste a URL instead.' });
    }
    return serverError(res, 'image/generate', err);
  }
}
