/**
 * Toncenter calls for the API: spaced, retried on transport errors only, and bounded by one deadline.
 *
 * @ton/ton's HttpApi posts once through axios and never retries, and axios rejects on HTTP 429, 5xx and timeouts.
 * Keyless toncenter allows about 1 request per second per IP (Vercel's egress IPs are shared), a free key about 10.
 * So every chain read of one API invocation goes through one session that:
 * - starts requests at least `gapMs` apart (1100 ms without TONCENTER_API_KEY, 120 ms with it);
 * - retries HTTP 429, HTTP 5xx and "no HTTP answer" (timeout, reset, DNS) with jittered exponential backoff, at most
 *   `maxAttempts` times per call;
 * - never runs past one budget per invocation: each attempt's HTTP timeout is cut to what is left of it.
 * When the retries or the budget run out it throws ChainUnavailableError, so an endpoint can answer "try again
 * shortly" instead of "not a launchpad token". Contract errors (a getter's exit code), malformed responses and other
 * 4xx pass through unchanged and are never retried.
 */

/** The chain could not be read right now (rate limit, timeout, toncenter 5xx). The same read may work shortly. */
export class ChainUnavailableError extends Error {
  constructor(message: string) {
    // The axios error is deliberately not kept as `cause`: its request config carries the X-API-Key header, and a
    // logged cause would print it.
    super(message);
    this.name = 'ChainUnavailableError';
  }
}

type HttpFailure = { response?: { status?: unknown }; code?: unknown; isAxiosError?: unknown };

const NO_ANSWER_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ERR_NETWORK',
]);

/** True for failures worth retrying: HTTP 429, HTTP 5xx, or no HTTP answer at all. */
export function isTransportError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const err = e as HttpFailure;
  const status = err.response?.status;
  if (typeof status === 'number') return status === 429 || status >= 500;
  if (err.isAxiosError === true) return true; // axios gave up before any HTTP answer
  return typeof err.code === 'string' && NO_ANSWER_CODES.has(err.code);
}

const EXIT_CODE = /^Unable to execute get method\. Got exit_code: (-?\d+)$/;

/**
 * Exit code of a get-method that ran and failed (the error TonClient.runMethod throws), else null. It is an answer
 * about the contract, never a transport problem: 11 means no such getter, -13 that no contract is deployed there.
 */
export function getterExitCode(e: unknown): number | null {
  const match = e instanceof Error ? EXIT_CODE.exec(e.message) : null;
  return match ? Number(match[1]) : null;
}

export type CallPolicy = {
  /** Minimum time between the starts of two requests in one session. */
  gapMs: number;
  /** Attempts per call, the first one included. */
  maxAttempts: number;
  /** Time budget for all requests of one session (one API invocation). */
  budgetMs: number;
  /** HTTP timeout of one attempt, cut to what is left of the budget. */
  attemptTimeoutMs: number;
  /** No attempt starts with less than this left of the budget. */
  minAttemptMs: number;
  /** Delay before the first retry; doubles per retry up to maxBackoffMs, then jittered to 50-100%. */
  backoffMs: number;
  maxBackoffMs: number;
};

/** Limits for one API invocation. The 7 s budget keeps one invocation well under 10 s. */
export function callPolicy(apiKey: string | undefined): CallPolicy {
  const keyed = Boolean(apiKey);
  return {
    gapMs: keyed ? 120 : 1100,
    maxAttempts: 4,
    budgetMs: 7000,
    attemptTimeoutMs: 5000,
    minAttemptMs: 1000,
    backoffMs: keyed ? 250 : 1000,
    maxBackoffMs: 4000,
  };
}

/** Delay before retry `n` (1 = the first retry): exponential and capped, with jitter so callers spread out. */
export function backoffDelay(policy: CallPolicy, n: number, random: () => number = Math.random): number {
  const ceiling = Math.min(policy.maxBackoffMs, policy.backoffMs * 2 ** (n - 1));
  return Math.round(ceiling * (0.5 + random() / 2));
}

export type Clock = { now(): number; sleep(ms: number): Promise<void> };

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export type ToncenterSession<C> = {
  /** Runs one request with retries. `fn` gets a client whose HTTP timeout fits the remaining budget. */
  call<T>(fn: (client: C) => Promise<T>): Promise<T>;
};

/** Short label for a transport failure. Never the error text or request config, which can carry the API key. */
function describe(e: unknown): string {
  const err = (typeof e === 'object' && e !== null ? e : {}) as HttpFailure;
  const status = err.response?.status;
  if (typeof status === 'number') return `HTTP ${status}`;
  return typeof err.code === 'string' ? err.code : 'no answer';
}

/**
 * One API invocation's access to toncenter. Create one per request and pass it to every read of that request, so
 * all of them share the spacing and the budget. `makeClient(timeoutMs)` builds the client for one attempt.
 */
export function toncenterSession<C>(
  makeClient: (timeoutMs: number) => C,
  policy: CallPolicy,
  clock: Clock = systemClock,
  random: () => number = Math.random,
): ToncenterSession<C> {
  const deadline = clock.now() + policy.budgetMs;
  let nextStart = Number.NEGATIVE_INFINITY;

  return {
    async call<T>(fn: (client: C) => Promise<T>): Promise<T> {
      for (let attempt = 1; ; attempt++) {
        const now = clock.now();
        // Reserve a start slot before waiting: concurrent calls of the session stay gapMs apart.
        const startAt = Math.max(now, nextStart);
        const timeoutMs = Math.min(policy.attemptTimeoutMs, deadline - startAt);
        if (timeoutMs < policy.minAttemptMs) throw new ChainUnavailableError('toncenter: request budget spent');
        nextStart = startAt + policy.gapMs;
        if (startAt > now) await clock.sleep(startAt - now);
        try {
          return await fn(makeClient(Math.floor(timeoutMs)));
        } catch (e) {
          if (!isTransportError(e)) throw e;
          if (attempt >= policy.maxAttempts) {
            throw new ChainUnavailableError(`toncenter: ${describe(e)} after ${attempt} attempts`);
          }
          const delay = backoffDelay(policy, attempt, random);
          if (clock.now() + delay + policy.minAttemptMs > deadline) {
            throw new ChainUnavailableError(`toncenter: ${describe(e)}, no time left to retry`);
          }
          await clock.sleep(delay);
        }
      }
    },
  };
}
