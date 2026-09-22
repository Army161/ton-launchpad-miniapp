import { beginCell, type Cell, Dictionary, type Slice } from '@ton/core';
import { sha256_sync } from '@ton/crypto';

/** TEP-64 metadata the Create page writes on-chain. */
export type TokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  telegram?: string;
};

export const METADATA_LIMITS = { name: 32, symbol: 10, description: 200, url: 256 };

const KEYS = ['name', 'symbol', 'description', 'image', 'decimals', 'telegram'] as const;
const keyHash = (key: string) => BigInt('0x' + sha256_sync(key).toString('hex'));

function isHttpsUrl(value: string, hostSuffix?: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    return hostSuffix ? u.hostname === hostSuffix : true;
  } catch {
    return false;
  }
}

/** Returns a list of human-readable problems; empty means valid. */
export function validateMetadata(m: TokenMetadata): string[] {
  const errors: string[] = [];
  const name = m.name.trim();
  const symbol = m.symbol.trim();
  if (!name) errors.push('Name is required');
  if (name.length > METADATA_LIMITS.name) errors.push(`Name must be at most ${METADATA_LIMITS.name} characters`);
  if (!/^[A-Z0-9]{2,10}$/.test(symbol)) errors.push('Ticker must be 2–10 letters or digits');
  if (m.description.length > METADATA_LIMITS.description) errors.push(`Description must be at most ${METADATA_LIMITS.description} characters`);
  if (!m.image) errors.push('An image is required');
  else if (!isHttpsUrl(m.image) || m.image.length > METADATA_LIMITS.url) errors.push('Image must be an https URL');
  if (m.telegram && (!isHttpsUrl(m.telegram, 't.me') || m.telegram.length > METADATA_LIMITS.url)) {
    errors.push('Telegram link must start with https://t.me/');
  }
  return errors;
}

/** TEP-64 on-chain content cell (0x00 prefix + sha256-keyed snake dictionary). */
export function buildOnchainContent(m: TokenMetadata): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  const entries: Record<string, string> = {
    name: m.name.trim(),
    symbol: m.symbol.trim(),
    description: m.description.trim(),
    image: m.image,
    decimals: '9',
  };
  if (m.telegram) entries.telegram = m.telegram;
  for (const [key, value] of Object.entries(entries)) {
    dict.set(keyHash(key), beginCell().storeUint(0, 8).storeStringTail(value).endCell());
  }
  return beginCell().storeUint(0, 8).storeDict(dict).endCell();
}

function readSnake(s: Slice): string {
  if (s.remainingBits >= 8 && s.preloadUint(8) === 0) s.skip(8);
  return s.loadStringTail();
}

/** Decode on-chain content written by buildOnchainContent. Unknown formats return null. */
export function parseOnchainContent(content: Cell): Partial<Record<(typeof KEYS)[number], string>> | null {
  try {
    const s = content.beginParse();
    if (s.loadUint(8) !== 0) return null;
    const dict = s.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    const out: Partial<Record<(typeof KEYS)[number], string>> = {};
    for (const key of KEYS) {
      const v = dict.get(keyHash(key));
      if (v) out[key] = readSnake(v.beginParse());
    }
    return out;
  } catch {
    return null;
  }
}
