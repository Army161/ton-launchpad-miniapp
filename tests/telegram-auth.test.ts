import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { validateInitData } from '../api/_lib/telegram';
import { signJwt, verifyJwt } from '../api/_lib/jwt';

const BOT_TOKEN = '123456789:AAHtestTokenForUnitTestsOnly_abcdefghij';
const NOW = Date.UTC(2026, 8, 22, 12, 0, 0);

/** Signs initData exactly as Telegram does. */
function signInitData(fields: Record<string, string>, token = BOT_TOKEN): string {
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

const user = JSON.stringify({ id: 42, first_name: 'Ada', username: 'ada' });
const authDate = String(Math.floor(NOW / 1000) - 60);

describe('Telegram initData', () => {
  it('accepts correctly signed data', () => {
    const u = validateInitData(signInitData({ auth_date: authDate, query_id: 'q', user }), BOT_TOKEN, NOW);
    expect(u?.id).toBe(42);
    expect(u?.username).toBe('ada');
  });

  it('rejects a tampered user field', () => {
    const data = signInitData({ auth_date: authDate, user }).replace('%22id%22%3A42', '%22id%22%3A43');
    expect(validateInitData(data, BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects data signed with another bot token', () => {
    expect(validateInitData(signInitData({ auth_date: authDate, user }, '999:other'), BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects missing, malformed or duplicate-free forged hashes', () => {
    expect(validateInitData(`auth_date=${authDate}&user=${encodeURIComponent(user)}`, BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData(`auth_date=${authDate}&hash=zz`, BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData('', BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData(signInitData({ auth_date: authDate, user }), '', NOW)).toBeNull();
  });

  it('rejects stale and future-dated data', () => {
    const old = String(Math.floor(NOW / 1000) - 86401);
    const future = String(Math.floor(NOW / 1000) + 3600);
    expect(validateInitData(signInitData({ auth_date: old, user }), BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData(signInitData({ auth_date: future, user }), BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects signed data without a usable user', () => {
    expect(validateInitData(signInitData({ auth_date: authDate }), BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData(signInitData({ auth_date: authDate, user: '{"id":"x"}' }), BOT_TOKEN, NOW)).toBeNull();
    expect(validateInitData(signInitData({ auth_date: authDate, user: 'not json' }), BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects oversized input', () => {
    expect(validateInitData('a'.repeat(5000), BOT_TOKEN, NOW)).toBeNull();
  });
});

describe('JWT', () => {
  const SECRET = 'a'.repeat(32) + 'b'.repeat(32);

  it('round-trips a session', () => {
    const t = signJwt(42, SECRET, 3600, NOW);
    expect(verifyJwt(t, SECRET, NOW)?.tgId).toBe(42);
  });

  it('rejects expiry, wrong secret and tampering', () => {
    const t = signJwt(42, SECRET, 3600, NOW);
    expect(verifyJwt(t, SECRET, NOW + 3601_000)).toBeNull();
    expect(verifyJwt(t, 'other-secret', NOW)).toBeNull();
    const [h, , s] = t.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ sub: '1', tgId: 1, iat: 0, exp: 9e9 })).toString('base64url');
    expect(verifyJwt(`${h}.${forgedBody}.${s}`, SECRET, NOW)).toBeNull();
  });

  it('rejects alg=none and other headers', () => {
    const t = signJwt(42, SECRET, 3600, NOW);
    const [, b] = t.split('.');
    const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    expect(verifyJwt(`${none}.${b}.`, SECRET, NOW)).toBeNull();
    expect(verifyJwt('garbage', SECRET, NOW)).toBeNull();
    expect(verifyJwt('a.b.c.d', SECRET, NOW)).toBeNull();
  });
});
