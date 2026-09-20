import fs from 'fs';
import path from 'path';

export type UserRecord = {
  telegramId: number;
  username?: string;
  firstName?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
};

export type TokenRecord = {
  jettonAddress: string;
  curveAddress: string;
  creator: string;
  creatorTelegramId?: number;
  name: string;
  symbol: string;
  imageUri?: string;
  description?: string;
  telegramLink?: string;
  raisedTon: number;
  graduated: boolean;
  progressBps: number;
  createdAt: string;
};

type Store = {
  users: Record<string, UserRecord>;
  tokens: Record<string, TokenRecord>;
};

const DATA_DIR = process.env.VERCEL ? '/tmp/launchpad-data' : path.join(process.cwd(), 'api', 'data');

function storePath(): string {
  return path.join(DATA_DIR, 'store.json');
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): Store {
  ensureDir();
  const p = storePath();
  if (!fs.existsSync(p)) return { users: {}, tokens: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Store;
  } catch {
    return { users: {}, tokens: {} };
  }
}

function writeStore(store: Store) {
  ensureDir();
  fs.writeFileSync(storePath(), JSON.stringify(store, null, 2));
}

export function upsertUser(user: TelegramUserInput): UserRecord {
  const store = readStore();
  const key = String(user.telegramId);
  const existing = store.users[key];
  const now = new Date().toISOString();
  const record: UserRecord = {
    telegramId: user.telegramId,
    username: user.username ?? existing?.username,
    firstName: user.firstName ?? existing?.firstName,
    walletAddress: user.walletAddress ?? existing?.walletAddress,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.users[key] = record;
  writeStore(store);
  return record;
}

export function linkWallet(telegramId: number, walletAddress: string): UserRecord | null {
  const store = readStore();
  const key = String(telegramId);
  const existing = store.users[key];
  if (!existing) return null;
  existing.walletAddress = walletAddress;
  existing.updatedAt = new Date().toISOString();
  store.users[key] = existing;
  writeStore(store);
  return existing;
}

export function getUser(telegramId: number): UserRecord | null {
  return readStore().users[String(telegramId)] ?? null;
}

export function listTokens(): TokenRecord[] {
  const store = readStore();
  return Object.values(store.tokens).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addToken(token: TokenRecord): TokenRecord {
  const store = readStore();
  store.tokens[token.jettonAddress] = token;
  writeStore(store);
  return token;
}

export function getToken(jettonAddress: string): TokenRecord | null {
  return readStore().tokens[jettonAddress] ?? null;
}

type TelegramUserInput = {
  telegramId: number;
  username?: string;
  firstName?: string;
  walletAddress?: string;
};
