import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chainSession, listLaunchAddresses, mapLimit, readLaunchpadToken, serverFactory, type TokenView } from '../_lib/chain.js';
import { chainUnavailable, serverError } from '../_lib/http.js';
import { ChainUnavailableError } from '../_lib/toncenter.js';

// Tokens are discovered from the factory's on-chain history, not from a
// user-writable registry, so nothing unverified can be listed.
const CACHE_MS = 20_000;
let cache: { at: number; tokens: TokenView[] } | null = null;

const errorText = (err: unknown) => (err instanceof Error ? err.message : 'unknown error');

/**
 * GET /api/tokens. Only a complete list is cached (here for 20 s, at the edge for 15 s). If some token reads fail,
 * the tokens that were read are returned with `partial: true` and Cache-Control no-store, so the next request reads
 * the chain again. 503 (Retry-After) when the factory's history cannot be read at all.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const factory = serverFactory();
  if (!factory) return res.status(200).json({ configured: false, tokens: [] });

  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const chain = chainSession();
      const addresses = await listLaunchAddresses(factory, 100, chain);
      let failed = 0;
      let reason = '';
      const views = await mapLimit(addresses, 3, async (a) => {
        try {
          return await readLaunchpadToken(a, factory, chain);
        } catch (err) {
          // Unreadable is not "not ours": keep the list, but do not cache it.
          failed++;
          reason ||= errorText(err);
          return null;
        }
      });
      const tokens = views.filter((v): v is TokenView => v !== null);
      if (failed > 0) {
        console.warn(`[tokens] partial list: ${failed} of ${addresses.length} token reads failed (${reason})`);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ configured: true, tokens, partial: true });
      }
      cache = { at: Date.now(), tokens };
    }
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({ configured: true, tokens: cache.tokens });
  } catch (err) {
    if (err instanceof ChainUnavailableError) return chainUnavailable(res, 'tokens', err);
    return serverError(res, 'tokens', err);
  }
}
