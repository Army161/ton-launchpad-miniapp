/**
 * Toncenter rate limiting: one queue per client that spaces requests out and
 * retries transport errors (no answer, HTTP 429, 5xx) with backoff. Contract
 * errors are never retried.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MAX_ATTEMPTS = 6;

/** True for errors worth retrying: no HTTP answer at all, HTTP 429 or a 5xx. */
export function isTransportError(e: unknown): boolean {
    const err = e as { response?: { status?: number }; code?: string; isAxiosError?: boolean; message?: string };
    const status = err?.response?.status;
    if (typeof status === 'number') return status === 429 || status >= 500;
    if (err?.isAxiosError) return true;
    return typeof err?.code === 'string' && /^(ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ERR_NETWORK|ERR_BAD_RESPONSE)/.test(err.code);
}

/** Runs tasks one at a time, at least `gapMs` apart, retrying transport errors with backoff. */
export function requestQueue(gapMs: number, attempts = MAX_ATTEMPTS, wait: (ms: number) => Promise<unknown> = sleep) {
    let tail: Promise<unknown> = Promise.resolve();
    let last = 0;
    return function run<T>(task: () => Promise<T>, retry = true): Promise<T> {
        const result = tail.then(async () => {
            for (let attempt = 1; ; attempt++) {
                const since = Date.now() - last;
                if (since < gapMs) await wait(gapMs - since);
                last = Date.now();
                try {
                    return await task();
                } catch (e) {
                    if (!retry || attempt >= attempts || !isTransportError(e)) throw e;
                    await wait(Math.min(1000 * 2 ** (attempt - 1), 15_000));
                }
            }
        });
        tail = result.catch(() => undefined);
        return result;
    };
}

