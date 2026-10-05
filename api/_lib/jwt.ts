import crypto from 'crypto';

export type JwtPayload = {
  sub: string;
  tgId: number;
  iat: number;
  exp: number;
};

const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
export const DEFAULT_TTL_SECONDS = 86400;

function sign(data: string, secret: string): Buffer {
  return crypto.createHmac('sha256', secret).update(data).digest();
}

export function signJwt(tgId: number, secret: string, ttlSeconds = DEFAULT_TTL_SECONDS, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const payload: JwtPayload = { sub: String(tgId), tgId, iat, exp: iat + ttlSeconds };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${HEADER}.${body}.${sign(`${HEADER}.${body}`, secret).toString('base64url')}`;
}

/** Verifies an HS256 token we issued. Anything unexpected returns null. */
export function verifyJwt(token: string, secret: string, now = Date.now()): JwtPayload | null {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  // Only our exact header is accepted, so "alg: none" and algorithm swaps fail here.
  if (header !== HEADER) return null;

  const expected = sign(`${header}.${body}`, secret);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<JwtPayload>;
    if (typeof payload.tgId !== 'number' || !Number.isSafeInteger(payload.tgId)) return null;
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(now / 1000)) return null;
    if (payload.sub !== String(payload.tgId)) return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
