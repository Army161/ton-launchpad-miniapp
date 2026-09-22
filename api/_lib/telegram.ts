import crypto from 'crypto';

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export const INIT_DATA_MAX_AGE_SECONDS = 86400;
const MAX_INIT_DATA_LENGTH = 4096;
const CLOCK_SKEW_SECONDS = 60;

/**
 * Validates Telegram Mini App initData per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string, now = Date.now()): TelegramUser | null {
  if (!initData || !botToken || typeof initData !== 'string' || initData.length > MAX_INIT_DATA_LENGTH) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest();
  if (!crypto.timingSafeEqual(computed, Buffer.from(hash, 'hex'))) return null;

  const authDate = Number(params.get('auth_date'));
  const nowSec = Math.floor(now / 1000);
  if (!Number.isInteger(authDate) || authDate <= 0) return null;
  if (authDate > nowSec + CLOCK_SKEW_SECONDS) return null;
  if (nowSec - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;

  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr) as TelegramUser;
    if (typeof user.id !== 'number' || !Number.isSafeInteger(user.id) || user.id <= 0) return null;
    return user;
  } catch {
    return null;
  }
}
