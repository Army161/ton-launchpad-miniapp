import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serverFactory, serverNetwork } from './_lib/chain';

/** Configuration sanity for monitoring. Reports presence only, never values. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const factory = serverFactory();
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    network: serverNetwork(),
    factoryConfigured: factory !== null,
    telegramAuthConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.JWT_SECRET),
    imageUploadConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
