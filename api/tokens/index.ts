import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listLaunchAddresses, mapLimit, readLaunchpadToken, serverFactory, type TokenView } from '../_lib/chain';
import { serverError } from '../_lib/http';

// Tokens are discovered from the factory's on-chain history, not from a
// user-writable registry, so nothing unverified can be listed.
const CACHE_MS = 20_000;
let cache: { at: number; tokens: TokenView[] } | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const factory = serverFactory();
  if (!factory) return res.status(200).json({ configured: false, tokens: [] });

  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const addresses = await listLaunchAddresses(factory, 100);
      const views = await mapLimit(addresses, 3, (a) => readLaunchpadToken(a, factory).catch(() => null));
      cache = { at: Date.now(), tokens: views.filter((v): v is TokenView => v !== null) };
    }
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({ configured: true, tokens: cache.tokens });
  } catch (err) {
    return serverError(res, 'tokens', err);
  }
}
