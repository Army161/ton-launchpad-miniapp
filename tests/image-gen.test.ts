import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPrompt,
  cleanPrompt,
  decodeGatewayImage,
  gatewayToken,
  GATEWAY_URL,
  IMAGE_MODELS,
  imageGenConfig,
  ImageGenError,
  requestImage,
} from '../api/_lib/imageGen';
import { signJwt } from '../api/_lib/jwt';
import { createCooldown, dayKey, quotaFolder, readQuota } from '../api/_lib/quota';
import { toTokenImage, TOKEN_IMAGE_SIZE } from '../api/_lib/tokenImage';
import { generateTokenImage, fetchImageGenInfo } from '../src/lib/imageApi';

// Blob storage is mocked: these tests cover limits, request shapes and how failures map to HTTP answers.
const blob = vi.hoisted(() => ({ put: vi.fn(), list: vi.fn() }));
vi.mock('@vercel/blob', () => blob);

const SECRET = 'f3a9c2e81b7d4056a1e2c3d4b5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b';
const T0 = Date.UTC(2026, 10, 19, 14, 0, 0);
const DAY = '2026-11-19';
const [META, GROK, GPT, GEMINI] = IMAGE_MODELS;

async function png(width = 640, height = 480): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 4, background: { r: 250, g: 200, b: 0, alpha: 0.5 } } }).png().toBuffer();
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;
type Answer = { status: number; headers: Record<string, string>; body: any };
type Call = { method?: string; token?: string | null; body?: unknown; query?: Record<string, string>; headers?: Record<string, string>; stream?: Buffer };

async function call(handler: Handler, { method = 'POST', token, body, query = {}, headers = {}, stream }: Call = {}): Promise<Answer> {
  const answer: Answer = { status: 200, headers: {}, body: undefined };
  const res = {
    setHeader(name: string, value: string) {
      answer.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      answer.status = code;
      return res;
    },
    json(payload: unknown) {
      answer.body = payload;
      return res;
    },
  };
  const all = { 'x-vercel-oidc-token': 'oidc-token', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers };
  const req = Object.assign(stream ? Readable.from([stream]) : {}, { method, headers: all, body, query });
  await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  return answer;
}

const session = (tgId: number) => signJwt(tgId, SECRET, 3600, T0);
const files = (...paths: string[]) => ({ blobs: paths.map((pathname) => ({ pathname })), hasMore: false });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.stubEnv('JWT_SECRET', SECRET);
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'blob-token');
  vi.stubEnv('IMAGE_GENERATION', 'on');
  vi.stubEnv('AI_GATEWAY_API_KEY', '');
  vi.stubEnv('IMAGE_GEN_MODELS', '');
  vi.stubEnv('IMAGE_GEN_USER_DAILY_LIMIT', '');
  vi.stubEnv('IMAGE_GEN_GLOBAL_DAILY_LIMIT', '');
  blob.put.mockReset().mockImplementation(async (pathname: string) => ({ url: `https://store.public.blob.vercel-storage.com/${pathname}` }));
  blob.list.mockReset().mockResolvedValue(files());
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('generator settings', () => {
  it('is off unless switched on and Blob storage exists', () => {
    expect(imageGenConfig({}).enabled).toBe(false);
    expect(imageGenConfig({ IMAGE_GENERATION: 'on' }).enabled).toBe(false);
    expect(imageGenConfig({ BLOB_READ_WRITE_TOKEN: 't' }).enabled).toBe(false);
    expect(imageGenConfig({ IMAGE_GENERATION: 'true', BLOB_READ_WRITE_TOKEN: 't' }).enabled).toBe(false);
    expect(imageGenConfig({ IMAGE_GENERATION: ' on ', BLOB_READ_WRITE_TOKEN: 't' })).toMatchObject({ enabled: true, userDailyLimit: 5, globalDailyLimit: 50 });
  });

  it('reads limits, keeps the global one within a single list page, and ignores bad numbers', () => {
    const base = { IMAGE_GENERATION: 'on', BLOB_READ_WRITE_TOKEN: 't' };
    expect(imageGenConfig({ ...base, IMAGE_GEN_USER_DAILY_LIMIT: '3', IMAGE_GEN_GLOBAL_DAILY_LIMIT: '200' })).toMatchObject({ userDailyLimit: 3, globalDailyLimit: 200 });
    expect(imageGenConfig({ ...base, IMAGE_GEN_GLOBAL_DAILY_LIMIT: '50000' }).globalDailyLimit).toBe(1000);
    expect(imageGenConfig({ ...base, IMAGE_GEN_USER_DAILY_LIMIT: '-1', IMAGE_GEN_GLOBAL_DAILY_LIMIT: 'lots' })).toMatchObject({ userDailyLimit: 5, globalDailyLimit: 50 });
    expect(imageGenConfig({ ...base, IMAGE_GEN_USER_DAILY_LIMIT: '0' }).userDailyLimit).toBe(0);
    // An empty value (a variable left blank in Vercel) is not zero.
    expect(imageGenConfig({ ...base, IMAGE_GEN_USER_DAILY_LIMIT: '', IMAGE_GEN_GLOBAL_DAILY_LIMIT: ' ' })).toMatchObject({ userDailyLimit: 5, globalDailyLimit: 50 });
  });

  it('narrows the models, and a list without a known model switches the generator off', () => {
    const base = { IMAGE_GENERATION: 'on', BLOB_READ_WRITE_TOKEN: 't' };
    expect(imageGenConfig(base).models.map((m) => m.id)).toEqual(IMAGE_MODELS.map((m) => m.id));
    expect(imageGenConfig({ ...base, IMAGE_GEN_MODELS: ` ${GROK.id}, nope/model ,${META.id}` }).models.map((m) => m.id)).toEqual([META.id, GROK.id]);
    expect(imageGenConfig({ ...base, IMAGE_GEN_MODELS: 'nope/model' })).toMatchObject({ enabled: false, models: [] });
  });

  it('prefers an explicit gateway key, then the request OIDC header, then the build-time token', () => {
    expect(gatewayToken({}, {})).toBeNull();
    expect(gatewayToken({ 'x-vercel-oidc-token': 'hdr' }, { VERCEL_OIDC_TOKEN: 'env' })).toBe('hdr');
    expect(gatewayToken({ 'x-vercel-oidc-token': ['a', 'b'] }, {})).toBe('a');
    expect(gatewayToken({}, { VERCEL_OIDC_TOKEN: 'env' })).toBe('env');
    expect(gatewayToken({ 'x-vercel-oidc-token': 'hdr' }, { AI_GATEWAY_API_KEY: ' key ' })).toBe('key');
  });
});

describe('prompt', () => {
  it('accepts one line of 3 to 300 characters and flattens whitespace and control characters', () => {
    expect(cleanPrompt('  a golden\n\trocket\u0000 dog  ')).toBe('a golden rocket dog');
    expect(cleanPrompt('ab')).toBeNull();
    expect(cleanPrompt('x'.repeat(300))).toHaveLength(300);
    expect(cleanPrompt('x'.repeat(301))).toBeNull();
    expect(cleanPrompt(undefined)).toBeNull();
    expect(cleanPrompt({ toString: () => 'object prompt' })).toBeNull();
    expect(buildPrompt('a frog')).toMatch(/^a frog\. Square 1:1 image/);
  });
});

describe('gateway request', () => {
  it('uses the Images endpoint with base64 output, plus the model extras', async () => {
    const image = await png();
    const fetchImpl = vi.fn(async () => jsonResponse(200, { data: [{ b64_json: image.toString('base64') }] }));
    await expect(requestImage(GPT, 'a frog', 'tok', fetchImpl as unknown as typeof fetch)).resolves.toEqual(image);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/images/generations`);
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'openai/gpt-image-1-mini',
      prompt: buildPrompt('a frog'),
      n: 1,
      response_format: 'b64_json',
      quality: 'medium',
      size: '1024x1024',
    });
  });

  it('uses Chat Completions with image output for Gemini and reads the data URL', async () => {
    const image = await png();
    const answer = { choices: [{ message: { content: 'here', images: [{ image_url: { url: `data:image/png;base64,${image.toString('base64')}` } }] } }] };
    const fetchImpl = vi.fn(async () => jsonResponse(200, answer));
    await expect(requestImage(GEMINI, 'a frog', 'tok', fetchImpl as unknown as typeof fetch)).resolves.toEqual(image);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/chat/completions`);
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: buildPrompt('a frog') }],
      modalities: ['text', 'image'],
      stream: false,
    });
  });

  it('finds no image in answers of the wrong shape', () => {
    expect(decodeGatewayImage(META, {})).toBeNull();
    expect(decodeGatewayImage(META, { data: [{ url: 'https://example.com/x.png' }] })).toBeNull();
    expect(decodeGatewayImage(META, { data: [{ b64_json: '' }] })).toBeNull();
    expect(decodeGatewayImage(GEMINI, { choices: [{ message: { content: 'text only' } }] })).toBeNull();
    expect(decodeGatewayImage(GEMINI, { choices: [{ message: { images: [{ image_url: { url: 'https://example.com/x.png' } }] } }] })).toBeNull();
    expect(decodeGatewayImage(GEMINI, null)).toBeNull();
  });

  it.each([
    [400, 'rejected'],
    [422, 'rejected'],
    [401, 'unavailable'],
    [402, 'unavailable'],
    [404, 'unavailable'],
    [429, 'unavailable'],
    [500, 'unavailable'],
  ])('maps gateway status %i to %s', async (status, kind) => {
    const fetchImpl = vi.fn(async () => jsonResponse(status, { error: { message: 'x'.repeat(500) } }));
    const err = await requestImage(META, 'a frog', 'tok', fetchImpl as unknown as typeof fetch).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ImageGenError);
    expect(err).toMatchObject({ kind, status });
    expect((err as ImageGenError).detail).toHaveLength(300);
  });

  it('reports a network failure as unavailable and an answer without an image as a bad response', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(requestImage(META, 'a frog', 'tok', down as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'unavailable', status: null });
    const html = vi.fn(async () => new Response('<html>', { status: 200 }));
    await expect(requestImage(META, 'a frog', 'tok', html as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'bad-response' });
    const empty = vi.fn(async () => jsonResponse(200, { data: [] }));
    await expect(requestImage(GROK, 'a frog', 'tok', empty as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'bad-response' });
  });
});

describe('stored image', () => {
  it('is a 512 px square JPEG without transparency, whatever came in', async () => {
    const out = await toTokenImage(await png(1024, 768));
    const meta = await sharp(out).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: TOKEN_IMAGE_SIZE, height: TOKEN_IMAGE_SIZE, hasAlpha: false });
    expect(out.length).toBeLessThan(200_000);
  });

  it('refuses bytes that are not an image', async () => {
    await expect(toTokenImage(Buffer.from('<svg onload=alert(1)>not really'))).rejects.toThrow();
    await expect(toTokenImage(Buffer.alloc(0))).rejects.toThrow();
  });
});

describe('daily limits', () => {
  const limits = { userDailyLimit: 2, globalDailyLimit: 4 };

  it('counts one UTC day per kind and user from the stored file names', async () => {
    expect(dayKey(T0)).toBe(DAY);
    expect(dayKey(Date.UTC(2026, 10, 19, 23, 59, 59))).toBe(DAY);
    expect(dayKey(Date.UTC(2026, 10, 20, 0, 0, 0))).toBe('2026-11-20');
    expect(quotaFolder('generated', 42, T0)).toBe(`generated/${DAY}/42/`);

    const list = vi.fn(async () => files(`generated/${DAY}/42/a.jpg`, `generated/${DAY}/421/b.jpg`, `generated/${DAY}/7/c.jpg`));
    await expect(readQuota('generated', 42, limits, T0, list)).resolves.toEqual({ allowed: true, scope: null, userCount: 1, globalCount: 3 });
    expect(list).toHaveBeenCalledWith({ prefix: `generated/${DAY}/`, limit: 1000 });
  });

  it('stops the user at their limit and everyone at the global one', async () => {
    const mine = vi.fn(async () => files(`uploads/${DAY}/42/a.png`, `uploads/${DAY}/42/b.png`));
    await expect(readQuota('uploads', 42, limits, T0, mine)).resolves.toMatchObject({ allowed: false, scope: 'user', userCount: 2 });
    const others = vi.fn(async () => files(...[1, 2, 3, 4].map((n) => `uploads/${DAY}/${n}/x.png`)));
    await expect(readQuota('uploads', 42, limits, T0, others)).resolves.toMatchObject({ allowed: false, scope: 'global', userCount: 0, globalCount: 4 });
    const overflow = vi.fn(async () => ({ blobs: [], hasMore: true }));
    await expect(readQuota('uploads', 42, { userDailyLimit: 2, globalDailyLimit: 1000 }, T0, overflow)).resolves.toMatchObject({ allowed: false, scope: 'global' });
    await expect(readQuota('uploads', 42, { userDailyLimit: 0, globalDailyLimit: 4 }, T0, vi.fn(async () => files()))).resolves.toMatchObject({ allowed: false, scope: 'user' });
  });

  it('makes a user wait between attempts', () => {
    const cooldown = createCooldown(8000);
    expect(cooldown.hit(1, T0)).toBe(0);
    expect(cooldown.hit(1, T0 + 1000)).toBe(7);
    expect(cooldown.hit(2, T0 + 1000)).toBe(0);
    expect(cooldown.hit(1, T0 + 8000)).toBe(0);
  });
});

describe('POST /api/image/generate', () => {
  const load = async () => (await import('../api/image/generate')).default as Handler;
  const gatewayOk = async () => {
    const image = await png();
    const fetchMock = vi.fn(async () => jsonResponse(200, { data: [{ b64_json: image.toString('base64') }] }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('GET tells the form what to offer, and nothing when the generator is off', async () => {
    const handler = await load();
    const on = await call(handler, { method: 'GET' });
    expect(on).toMatchObject({ status: 200, body: { enabled: true, userDailyLimit: 5, promptMax: 300 } });
    expect(on.body.models).toEqual(IMAGE_MODELS.map(({ id, label }) => ({ id, label })));
    vi.stubEnv('IMAGE_GENERATION', 'off');
    expect((await call(handler, { method: 'GET' })).body).toMatchObject({ enabled: false, models: [] });
    expect(blob.list).not.toHaveBeenCalled();
  });

  it('needs a Telegram session, the switch, a gateway credential and a valid request, before anything is spent', async () => {
    const handler = await load();
    const fetchMock = await gatewayOk();
    expect((await call(handler, { body: { prompt: 'a frog' } })).status).toBe(401);
    expect((await call(handler, { token: 'not.a.jwt', body: { prompt: 'a frog' } })).status).toBe(401);
    expect((await call(handler, { method: 'PUT', token: session(100) })).status).toBe(405);
    expect((await call(handler, { token: session(100), body: { prompt: 'a frog' }, headers: { 'x-vercel-oidc-token': '' } })).status).toBe(503);
    expect((await call(handler, { token: session(100), body: { prompt: 'a' } })).status).toBe(400);
    expect((await call(handler, { token: session(100), body: undefined })).status).toBe(400);
    expect((await call(handler, { token: session(100), body: { prompt: 'a frog', model: 'bfl/flux-2-max' } })).status).toBe(400);
    vi.stubEnv('IMAGE_GENERATION', '');
    expect((await call(handler, { token: session(100), body: { prompt: 'a frog' } })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(blob.list).not.toHaveBeenCalled();
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('stores a 512 px JPEG under the user and day and returns its URL and what is left', async () => {
    const handler = await load();
    const fetchMock = await gatewayOk();
    blob.list.mockResolvedValue(files(`generated/${DAY}/101/earlier.jpg`, `generated/${DAY}/999/other.jpg`));
    const answer = await call(handler, { token: session(101), body: { prompt: '  a golden rocket dog ', model: GROK.id } });
    expect(answer).toMatchObject({ status: 200, body: { model: GROK.id, remaining: 3 } });
    expect(answer.headers['cache-control']).toBe('no-store');

    const [pathname, data, options] = blob.put.mock.calls[0] as [string, Buffer, Record<string, unknown>];
    expect(pathname).toMatch(new RegExp(`^generated/${DAY}/101/[0-9a-f-]{36}\\.jpg$`));
    expect(answer.body.uri).toBe(`https://store.public.blob.vercel-storage.com/${pathname}`);
    expect(options).toEqual({ access: 'public', contentType: 'image/jpeg' });
    expect(await sharp(data).metadata()).toMatchObject({ format: 'jpeg', width: 512, height: 512 });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/images/generations`);
    expect(init.headers).toMatchObject({ Authorization: 'Bearer oidc-token' });
    expect(JSON.parse(init.body as string)).toMatchObject({ model: GROK.id, prompt: buildPrompt('a golden rocket dog') });
  });

  it('uses the first enabled model when none is named', async () => {
    const handler = await load();
    const fetchMock = await gatewayOk();
    vi.stubEnv('IMAGE_GEN_MODELS', `${GPT.id},${GROK.id}`);
    expect((await call(handler, { token: session(102), body: { prompt: 'a frog' } })).body).toMatchObject({ model: GROK.id });
    expect((await call(handler, { token: session(103), body: { prompt: 'a frog', model: META.id } })).status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('answers 429 at the user and the global limit without calling the gateway', async () => {
    const handler = await load();
    const fetchMock = await gatewayOk();
    vi.stubEnv('IMAGE_GEN_USER_DAILY_LIMIT', '2');
    vi.stubEnv('IMAGE_GEN_GLOBAL_DAILY_LIMIT', '3');
    blob.list.mockResolvedValue(files(`generated/${DAY}/104/a.jpg`, `generated/${DAY}/104/b.jpg`));
    expect(await call(handler, { token: session(104), body: { prompt: 'a frog' } })).toMatchObject({ status: 429, body: { scope: 'user', remaining: 0 } });
    blob.list.mockResolvedValue(files(`generated/${DAY}/1/a.jpg`, `generated/${DAY}/2/b.jpg`, `generated/${DAY}/3/c.jpg`));
    expect(await call(handler, { token: session(105), body: { prompt: 'a frog' } })).toMatchObject({ status: 429, body: { scope: 'global' } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('makes the same user wait before a second attempt, but not another user', async () => {
    const handler = await load();
    await gatewayOk();
    expect((await call(handler, { token: session(106), body: { prompt: 'a frog' } })).status).toBe(200);
    const second = await call(handler, { token: session(106), body: { prompt: 'a frog' } });
    expect(second).toMatchObject({ status: 429, body: { scope: 'cooldown' } });
    expect(second.headers['retry-after']).toBe('8');
    expect((await call(handler, { token: session(107), body: { prompt: 'a frog' } })).status).toBe(200);
    vi.setSystemTime(T0 + 8000);
    expect((await call(handler, { token: session(106), body: { prompt: 'a frog' } })).status).toBe(200);
  });

  it('answers 422 for a refused prompt and 503 when the gateway cannot serve, storing nothing and leaking nothing', async () => {
    const handler = await load();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(400, { error: { message: 'policy: a frog SECRET-UPSTREAM-TEXT' } })));
    const refused = await call(handler, { token: session(108), body: { prompt: 'a frog' } });
    expect(refused.status).toBe(422);
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(402, { error: { message: 'Insufficient credits SECRET-UPSTREAM-TEXT' } })));
    const broke = await call(handler, { token: session(109), body: { prompt: 'a frog' } });
    expect(broke.status).toBe(503);
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { data: [{ b64_json: Buffer.from('not an image').toString('base64') }] })));
    expect((await call(handler, { token: session(110), body: { prompt: 'a frog' } })).status).toBe(500);
    expect(blob.put).not.toHaveBeenCalled();
    const said = JSON.stringify([refused.body, broke.body, vi.mocked(console.warn).mock.calls, vi.mocked(console.error).mock.calls]);
    expect(said).not.toContain('SECRET-UPSTREAM-TEXT');
    expect(said).not.toContain('a frog');
  });
});

describe('POST /api/metadata/upload', () => {
  const load = async () => await import('../api/metadata/upload');

  it('recognises the four image types by their first bytes', async () => {
    const { sniffImageType } = await load();
    expect(sniffImageType(await png(4, 4))).toBe('image/png');
    expect(sniffImageType(await sharp(await png(4, 4)).jpeg().toBuffer())).toBe('image/jpeg');
    expect(sniffImageType(await sharp(await png(4, 4)).webp().toBuffer())).toBe('image/webp');
    expect(sniffImageType(await sharp(await png(4, 4)).gif().toBuffer())).toBe('image/gif');
    expect(sniffImageType(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImageType(Buffer.from('RIFF1234WAVE'))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });

  it('stores a real image under the user and day', async () => {
    const handler = (await load()).default as Handler;
    const image = await png(8, 8);
    const answer = await call(handler, { token: session(200), headers: { 'content-type': 'image/png' }, stream: image });
    const [pathname, data, options] = blob.put.mock.calls[0] as [string, Buffer, Record<string, unknown>];
    expect(pathname).toMatch(new RegExp(`^uploads/${DAY}/200/[0-9a-f-]{36}\\.png$`));
    expect(data).toEqual(image);
    expect(options).toEqual({ access: 'public', contentType: 'image/png' });
    expect(answer).toMatchObject({ status: 200, body: { uri: `https://store.public.blob.vercel-storage.com/${pathname}` } });
    expect(blob.list).toHaveBeenCalledWith({ prefix: `uploads/${DAY}/`, limit: 1000 });
  });

  it('refuses a file that is not the image it claims to be, and an unknown type', async () => {
    const handler = (await load()).default as Handler;
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    expect((await call(handler, { token: session(201), headers: { 'content-type': 'image/png' }, stream: html })).status).toBe(415);
    const jpeg = await sharp(await png(8, 8)).jpeg().toBuffer();
    expect((await call(handler, { token: session(201), headers: { 'content-type': 'image/png' }, stream: jpeg })).status).toBe(415);
    expect((await call(handler, { token: session(201), headers: { 'content-type': 'image/svg+xml' }, stream: html })).status).toBe(415);
    expect((await call(handler, { headers: { 'content-type': 'image/png' }, stream: await png(8, 8) })).status).toBe(401);
    expect(blob.put).not.toHaveBeenCalled();
    expect(blob.list).not.toHaveBeenCalled();
  });

  it('answers 429 once the user has uploaded their daily number', async () => {
    const { default: handler, UPLOAD_LIMITS } = await load();
    blob.list.mockResolvedValue(files(...Array.from({ length: UPLOAD_LIMITS.userDailyLimit }, (_, i) => `uploads/${DAY}/202/${i}.png`)));
    const answer = await call(handler as Handler, { token: session(202), headers: { 'content-type': 'image/png' }, stream: await png(8, 8) });
    expect(answer).toMatchObject({ status: 429, body: { scope: 'user' } });
    expect(blob.put).not.toHaveBeenCalled();
  });
});

describe('GET /api/image/selftest', () => {
  const KEY = 'k'.repeat(40);
  const load = async () => (await import('../api/image/selftest')).default as Handler;

  it('is closed in production, without a long key, and for a wrong key', async () => {
    const handler = await load();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('IMAGE_SELFTEST', KEY);
    vi.stubEnv('VERCEL_ENV', 'production');
    expect((await call(handler, { method: 'GET', query: { key: KEY } })).status).toBe(404);
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect((await call(handler, { method: 'GET', query: {} })).status).toBe(404);
    expect((await call(handler, { method: 'GET', query: { key: `${KEY}x` } })).status).toBe(404);
    expect((await call(handler, { method: 'POST', query: { key: KEY } })).status).toBe(404);
    vi.stubEnv('IMAGE_SELFTEST', 'off');
    expect((await call(handler, { method: 'GET', query: { key: 'off' } })).status).toBe(404);
    vi.stubEnv('IMAGE_SELFTEST', '');
    expect((await call(handler, { method: 'GET', query: { key: '' } })).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('on a preview with the key, runs one image through the gateway, sharp and Blob and names the failing stage', async () => {
    const handler = await load();
    vi.stubEnv('IMAGE_SELFTEST', KEY);
    vi.stubEnv('VERCEL_ENV', 'preview');
    const image = await png();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { data: [{ b64_json: image.toString('base64') }] })));
    const ok = await call(handler, { method: 'GET', query: { key: KEY, model: GROK.id } });
    expect(ok).toMatchObject({ status: 200, body: { ok: true, model: GROK.id, bytesIn: image.length } });
    expect(blob.put.mock.calls[0][0]).toBe(`selftest/${DAY}/spacexai-grok-imagine-image.jpg`);

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(402, { error: { message: 'Insufficient credits' } })));
    const broke = await call(handler, { method: 'GET', query: { key: KEY } });
    expect(broke.body).toMatchObject({ ok: false, model: META.id, stage: 'gateway', kind: 'unavailable', status: 402 });
    expect(broke.body.detail).toContain('Insufficient credits');
  });
});

describe('client', () => {
  it('reads what the form may offer, and null when the generator is off or unreachable', async () => {
    const info = { enabled: true, models: [{ id: META.id, label: META.label }], userDailyLimit: 5, promptMax: 300 };
    await expect(fetchImageGenInfo((async () => jsonResponse(200, info)) as unknown as typeof fetch)).resolves.toEqual(info);
    await expect(fetchImageGenInfo((async () => jsonResponse(200, { enabled: false, models: [] })) as unknown as typeof fetch)).resolves.toBeNull();
    await expect(fetchImageGenInfo((async () => jsonResponse(404, {})) as unknown as typeof fetch)).resolves.toBeNull();
    await expect(
      fetchImageGenInfo((async () => {
        throw new TypeError('offline');
      }) as unknown as typeof fetch),
    ).resolves.toBeNull();
  });

  it('turns every answer into a URL or a sentence for the creator', async () => {
    const as = (status: number, body: unknown) => (async () => jsonResponse(status, body)) as unknown as typeof fetch;
    await expect(generateTokenImage('jwt', 'a frog', META.id, as(200, { uri: 'https://store/x.jpg', remaining: 4 }))).resolves.toEqual({ status: 'ok', uri: 'https://store/x.jpg', remaining: 4 });
    await expect(generateTokenImage('jwt', 'a frog', undefined, as(200, { uri: 'javascript:alert(1)' }))).resolves.toMatchObject({ status: 'error' });
    await expect(generateTokenImage('jwt', 'a frog', undefined, as(429, { error: 'Wait 8 s before generating again' }))).resolves.toEqual({ status: 'error', message: 'Wait 8 s before generating again' });
    await expect(generateTokenImage('jwt', 'a frog', undefined, as(401, { error: 'Unauthorized' }))).resolves.toEqual({ status: 'error', message: 'Open the app in Telegram to generate an image' });
    await expect(generateTokenImage('jwt', 'a frog', undefined, as(500, { error: 'Internal error' }))).resolves.toMatchObject({ status: 'error', message: expect.stringContaining('Upload one or paste a URL') });
    await expect(generateTokenImage('jwt', 'a frog', undefined, as(502, '<html>'))).resolves.toMatchObject({ status: 'error' });

    const sent = vi.fn(async () => jsonResponse(200, { uri: 'https://store/x.jpg' }));
    await generateTokenImage('jwt', 'a frog', GROK.id, sent as unknown as typeof fetch);
    const [url, init] = sent.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/image/generate');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer jwt' });
    expect(JSON.parse(init.body as string)).toEqual({ prompt: 'a frog', model: GROK.id });
  });
});
