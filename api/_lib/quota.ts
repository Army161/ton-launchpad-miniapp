import { list } from '@vercel/blob';

/**
 * Daily limits for the two endpoints that write to Blob storage, counted from the stored files themselves: every file
 * lives under `<kind>/<UTC day>/<Telegram id>/`, so one list call for the day gives both the user's and everyone's
 * count. There is no database in V1; this needs none. Two requests at the same moment can each see the count before
 * the other's file exists, so a limit can be passed by the number of parallel requests, which the per-user cooldown
 * keeps small.
 */

export type QuotaKind = 'uploads' | 'generated';
export type QuotaLimits = { userDailyLimit: number; globalDailyLimit: number };
export type QuotaState = { allowed: boolean; scope: 'user' | 'global' | null; userCount: number; globalCount: number };

export type ListFn = (options: { prefix: string; limit: number }) => Promise<{ blobs: Array<{ pathname: string }>; hasMore: boolean }>;

export function dayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Folder of one user's files of one kind on one day, with a trailing slash. */
export function quotaFolder(kind: QuotaKind, tgId: number, now = Date.now()): string {
  return `${kind}/${dayKey(now)}/${tgId}/`;
}

/** Reads today's counts. A day with more files than one list page holds counts as full for everyone. */
export async function readQuota(
  kind: QuotaKind,
  tgId: number,
  limits: QuotaLimits,
  now = Date.now(),
  listImpl: ListFn = list,
): Promise<QuotaState> {
  const dayPrefix = `${kind}/${dayKey(now)}/`;
  const { blobs, hasMore } = await listImpl({ prefix: dayPrefix, limit: 1000 });
  const userPrefix = quotaFolder(kind, tgId, now);
  const userCount = blobs.filter((b) => b.pathname.startsWith(userPrefix)).length;
  const globalCount = blobs.length;
  const scope = userCount >= limits.userDailyLimit ? 'user' : hasMore || globalCount >= limits.globalDailyLimit ? 'global' : null;
  return { allowed: scope === null, scope, userCount, globalCount };
}

/**
 * Per-user pause between attempts, kept in the function instance's memory: best effort (another instance does not see
 * it), enough to stop one session from firing requests in a tight loop.
 */
export function createCooldown(ms: number, maxEntries = 5000) {
  const last = new Map<number, number>();
  return {
    /** Seconds still to wait, or 0 after recording this attempt. */
    hit(tgId: number, now = Date.now()): number {
      const prev = last.get(tgId);
      if (prev !== undefined && now - prev < ms) return Math.ceil((ms - (now - prev)) / 1000);
      if (last.size >= maxEntries) last.clear();
      last.set(tgId, now);
      return 0;
    },
  };
}
