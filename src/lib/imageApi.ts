/** Client for the AI token image endpoint (`/api/image/generate`). Failures resolve to a result, never throw. */

export type ImageModelOption = { id: string; label: string };
export type ImageGenInfo = { enabled: boolean; models: ImageModelOption[]; userDailyLimit: number; promptMax: number };

/** An image takes 5 to 40 s; the API gives up after about 50 s. Past this the request is aborted. */
export const GENERATE_TIMEOUT_MS = 70_000;

/** What the Create page needs to offer the generator, or null when it is off or cannot be reached. */
export async function fetchImageGenInfo(fetchImpl: typeof fetch = fetch): Promise<ImageGenInfo | null> {
  try {
    const res = await fetchImpl('/api/image/generate', { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const info = (await res.json()) as Partial<ImageGenInfo>;
    if (info.enabled !== true || !Array.isArray(info.models) || info.models.length === 0) return null;
    return { enabled: true, models: info.models, userDailyLimit: info.userDailyLimit ?? 0, promptMax: info.promptMax ?? 300 };
  } catch {
    return null;
  }
}

export type GenerateResult = { status: 'ok'; uri: string; remaining: number | null } | { status: 'error'; message: string };

const FALLBACK = 'Image generation failed. Upload one or paste a URL instead.';

/** Asks for one image. `message` is always something to show the creator as it is. */
export async function generateTokenImage(
  authToken: string,
  prompt: string,
  model: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<GenerateResult> {
  try {
    const res = await fetchImpl('/api/image/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => ({}))) as { uri?: unknown; remaining?: unknown; error?: unknown };
    if (res.ok && typeof data.uri === 'string' && data.uri.startsWith('https://')) {
      return { status: 'ok', uri: data.uri, remaining: typeof data.remaining === 'number' ? data.remaining : null };
    }
    if (res.status === 401) return { status: 'error', message: 'Open the app in Telegram to generate an image' };
    // The API's own 4xx/503 texts are written for the creator; anything else gets the fallback.
    const own = [400, 422, 429, 503].includes(res.status) && typeof data.error === 'string' && data.error.length <= 200;
    return { status: 'error', message: own ? (data.error as string) : FALLBACK };
  } catch {
    return { status: 'error', message: FALLBACK };
  }
}
