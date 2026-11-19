/**
 * AI token images (ADR-012). The API asks Vercel AI Gateway for one image, shrinks it to a small square JPEG and stores
 * it in Vercel Blob; the creator gets the https URL for the token metadata. Nothing here is a secret: the gateway is
 * reached with the deployment's own OIDC token (or AI_GATEWAY_API_KEY when one is set), never with a client value.
 */

export const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

/** How the gateway serves a model: the Images endpoint, or Chat Completions with image output. */
type GatewayApi = 'images' | 'chat';

export type ImageModel = {
  id: string;
  label: string;
  api: GatewayApi;
  /** Extra request fields for this model on the Images endpoint (e.g. a quality that keeps the price down). */
  extra?: Record<string, unknown>;
};

/** Models the Create page offers, cheapest first. The first enabled one is the default. */
export const IMAGE_MODELS: readonly ImageModel[] = [
  { id: 'meta/muse-image-1.0', label: 'Meta AI', api: 'images' },
  { id: 'spacexai/grok-imagine-image', label: 'Grok', api: 'images' },
  { id: 'openai/gpt-image-1-mini', label: 'ChatGPT', api: 'images', extra: { quality: 'medium', size: '1024x1024' } },
  { id: 'google/gemini-2.5-flash-image', label: 'Gemini Nano Banana', api: 'chat' },
];

export const PROMPT_LIMITS = { min: 3, max: 300 };
/** The gateway is given this long; the function itself may run 60 s (vercel.json). */
export const GATEWAY_TIMEOUT_MS = 50_000;

type Env = Record<string, string | undefined>;

function intFrom(value: string | undefined, fallback: number, max: number): number {
  const text = value?.trim() ?? '';
  // Digits only: an empty or mistyped value keeps the default instead of reading as 0.
  return /^\d{1,6}$/.test(text) ? Math.min(Number(text), max) : fallback;
}

export type ImageGenConfig = {
  /** IMAGE_GENERATION=on and Blob storage present. */
  enabled: boolean;
  userDailyLimit: number;
  /** At most 1000, so one Blob list page always holds the whole day. */
  globalDailyLimit: number;
  models: ImageModel[];
};

/**
 * Reads the generator's settings. It is off unless IMAGE_GENERATION is exactly "on" and Blob storage is configured.
 * IMAGE_GEN_MODELS (comma-separated model ids) narrows the offered models; unknown ids are ignored, and a list with
 * no known id switches the generator off instead of silently offering everything.
 */
export function imageGenConfig(env: Env = process.env): ImageGenConfig {
  const wanted = env.IMAGE_GEN_MODELS?.split(',').map((s) => s.trim()).filter(Boolean);
  const models = wanted && wanted.length > 0 ? IMAGE_MODELS.filter((m) => wanted.includes(m.id)) : [...IMAGE_MODELS];
  return {
    enabled: env.IMAGE_GENERATION?.trim() === 'on' && Boolean(env.BLOB_READ_WRITE_TOKEN) && models.length > 0,
    userDailyLimit: intFrom(env.IMAGE_GEN_USER_DAILY_LIMIT, 5, 100),
    globalDailyLimit: intFrom(env.IMAGE_GEN_GLOBAL_DAILY_LIMIT, 50, 1000),
    models,
  };
}

/**
 * The bearer for AI Gateway: an explicit key wins, else the deployment's OIDC token, which Vercel puts on every
 * function request as a header (and in the environment only during builds and `vercel dev`).
 */
export function gatewayToken(headers: Record<string, string | string[] | undefined>, env: Env = process.env): string | null {
  const header = headers['x-vercel-oidc-token'];
  const oidc = Array.isArray(header) ? header[0] : header;
  return env.AI_GATEWAY_API_KEY?.trim() || oidc?.trim() || env.VERCEL_OIDC_TOKEN?.trim() || null;
}

/** One line of plain text between the limits, or null. Control characters and line breaks become spaces. */
export function cleanPrompt(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const text = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length >= PROMPT_LIMITS.min && text.length <= PROMPT_LIMITS.max ? text : null;
}

/** What the model is asked for: the creator's words plus a fixed framing that suits a round token avatar. */
export function buildPrompt(prompt: string): string {
  return `${prompt}. Square 1:1 image, one centered subject that fills the frame, bold and readable at small size, suitable as a crypto token logo. No borders, no watermark.`;
}

export type ImageGenFailure =
  /** The provider refused this prompt (content rules) or the request itself: trying again with the same words will not help. */
  | 'rejected'
  /** No credits, no access, rate limited, timed out or the provider is down. */
  | 'unavailable'
  /** A 2xx answer without a usable image. */
  | 'bad-response';

export class ImageGenError extends Error {
  readonly kind: ImageGenFailure;
  readonly status: number | null;
  /** Start of the gateway's error body. For the preview self-test only: it can repeat the prompt, so it is not logged. */
  readonly detail: string | null;
  constructor(kind: ImageGenFailure, status: number | null, message: string, detail: string | null = null) {
    super(message);
    this.name = 'ImageGenError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

function requestFor(model: ImageModel, prompt: string): { path: string; body: Record<string, unknown> } {
  if (model.api === 'chat') {
    return {
      path: '/chat/completions',
      body: { model: model.id, messages: [{ role: 'user', content: prompt }], modalities: ['text', 'image'], stream: false },
    };
  }
  return { path: '/images/generations', body: { model: model.id, prompt, n: 1, response_format: 'b64_json', ...model.extra } };
}

const DATA_URL = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/is;

/** Pulls the first image out of either gateway answer shape. */
export function decodeGatewayImage(model: ImageModel, json: unknown): Buffer | null {
  let b64: unknown;
  if (model.api === 'chat') {
    const message = (json as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: unknown } }> } }> })?.choices?.[0]?.message;
    const url = message?.images?.[0]?.image_url?.url;
    b64 = typeof url === 'string' ? DATA_URL.exec(url)?.[1] : undefined;
  } else {
    b64 = (json as { data?: Array<{ b64_json?: unknown }> })?.data?.[0]?.b64_json;
  }
  if (typeof b64 !== 'string' || b64.length === 0) return null;
  const image = Buffer.from(b64, 'base64');
  return image.length > 0 ? image : null;
}

/** Asks AI Gateway for one image and returns its bytes as the provider sent them. Throws ImageGenError. */
export async function requestImage(
  model: ImageModel,
  prompt: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Buffer> {
  const { path, body } = requestFor(model, buildPrompt(prompt));
  let res: Response;
  try {
    res = await fetchImpl(`${GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
  } catch (err) {
    throw new ImageGenError('unavailable', null, err instanceof Error ? err.name : 'request failed');
  }
  if (!res.ok) {
    // 400 and 422 are about this request (most often the provider's content rules); everything else is about the
    // account or the provider (401/403 access, 402 credits, 404 model, 429 rate, 5xx).
    const kind: ImageGenFailure = res.status === 400 || res.status === 422 ? 'rejected' : 'unavailable';
    const detail = await res.text().then((t) => t.slice(0, 300), () => null);
    throw new ImageGenError(kind, res.status, `gateway answered ${res.status}`, detail);
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ImageGenError('bad-response', res.status, 'gateway answer is not JSON');
  }
  const image = decodeGatewayImage(model, json);
  if (!image) throw new ImageGenError('bad-response', res.status, 'gateway answer has no image');
  return image;
}
