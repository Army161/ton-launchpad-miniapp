import { beginCell, type Cell, Dictionary, type Slice } from '@ton/core';
import { sha256_sync } from '@ton/crypto';

/**
 * Optional project links. TEP-64 defines no link keys, so these are extra keys in the on-chain dictionary: wallets
 * and explorers read only the keys they know and skip these, and this app shows them on the token page (ADR-013).
 * The key names follow the common launchpad convention (`twitter`, `telegram`, `website`). They are permanent: every
 * token stores them by the SHA-256 of the name, so renaming one would hide the links of tokens already launched.
 */
export const LINK_KEYS = ['website', 'twitter', 'telegram'] as const;
export type LinkKey = (typeof LINK_KEYS)[number];

/** TEP-64 metadata the Create page writes on-chain. */
export type TokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
} & Partial<Record<LinkKey, string>>;

export const METADATA_LIMITS = { name: 32, symbol: 10, description: 200, url: 256 };

/**
 * Sites each link must point at; null means any https site (the project's own website). A host matches itself or
 * its www./m. form. Telegram keeps its original exact rule (t.me only).
 */
const LINK_HOSTS: Record<LinkKey, readonly string[] | null> = {
  website: null,
  twitter: ['x.com', 'twitter.com'],
  telegram: ['t.me'],
};

/** Labels and the message shown when a link does not pass. */
export const LINK_LABELS: Record<LinkKey, { label: string; error: string; placeholder: string }> = {
  website: { label: 'Website', error: 'Website must be an https link', placeholder: 'https://yourproject.com' },
  twitter: { label: 'X (Twitter)', error: 'X link must start with https://x.com/', placeholder: 'https://x.com/yourproject' },
  telegram: { label: 'Telegram', error: 'Telegram link must start with https://t.me/', placeholder: 'https://t.me/yourchannel' },
};

const KEYS = ['name', 'symbol', 'description', 'image', 'decimals', ...LINK_KEYS] as const;
const keyHash = (key: string) => BigInt('0x' + sha256_sync(key).toString('hex'));

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * True when `value` is a link this app will store and show for `key`: https, no user:password part, a real domain,
 * at most METADATA_LIMITS.url long and, except for a website, on that platform's own site. The app checks again when
 * it reads a token, because a launch made outside the app can store anything.
 */
export function isValidLink(key: LinkKey, value: string): boolean {
  if (value.length > METADATA_LIMITS.url) return false;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  const hosts = LINK_HOSTS[key];
  if (key === 'telegram') return host === 't.me';
  if (!hosts) return host.includes('.') && host.split('.').every((label) => label.length > 0) && !/^[\d.]+$/.test(host) && !host.startsWith('[');
  return hosts.some((h) => host === h || host === `www.${h}` || host === `m.${h}`);
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
  for (const key of LINK_KEYS) {
    const value = m[key];
    if (value && !isValidLink(key, value)) errors.push(LINK_LABELS[key].error);
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
  for (const key of LINK_KEYS) {
    const value = m[key]?.trim();
    if (value) entries[key] = value;
  }
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
