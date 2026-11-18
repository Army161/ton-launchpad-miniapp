/**
 * Toncenter calls for the API: spaced, retried on transport errors only, and bounded by one deadline.
 *
 * @ton/ton's HttpApi posts once through axios and never retries, and axios rejects on HTTP 429, 5xx and timeouts.
 * Keyless toncenter allows about 1 request per second per IP (Vercel's egress IPs are shared), a free key about 10.
 * So every chain read of one API invocation goes through one session that:
 * - starts requests at least `gapMs` apart (1100 ms without TONCENTER_API_KEY, 120 ms with it);
 * - retries HTTP 429, HTTP 5xx and "no complete HTTP answer" (timeout, reset, DNS, a body cut off after the headers)
 *   with jittered exponential backoff, at most `maxAttempts` times per call;
 * - never runs past one budget per invocation: each attempt's HTTP timeout is cut to what is left of it, and an
 *   attempt still running shortly after that timeout (a body that trickles in) is ended and counts as a timeout;
 * - takes each retry from one retry budget per instance, which only first attempts refill, so a flood of failing
 *   requests (toncenter rate limiting us, or lookups of random addresses) costs about one attempt per request
 *   instead of up to `maxAttempts`.
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

/**
 * The session's time ran out before this request's first attempt could start, so nothing was asked of toncenter and
 * the error says nothing about whether it answers. The token list tells a read it had no time for from one that
 * failed this way. A retry that finds no time left fails with a plain ChainUnavailableError naming its failure.
 */
export class BudgetSpentError extends ChainUnavailableError {
  constructor() {
    super('toncenter: request budget spent');
    this.name = 'BudgetSpentError';
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

/** True for failures worth retrying: HTTP 429, HTTP 5xx, or no complete HTTP answer. */
export function isTransportError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const err = e as HttpFailure;
  const status = err.response?.status;
  // The code goes first: an answer that broke off after its headers carries their status, even a 200.
  if (typeof err.code === 'string' && NO_ANSWER_CODES.has(err.code)) return true;
  if (err.code === 'ERR_BAD_RESPONSE' && typeof status === 'number' && status >= 200 && status < 300) return true;
  if (typeof status === 'number') return status === 429 || status >= 500;
  return err.isAxiosError === true; // axios gave up before any HTTP answer
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

/** `sleep` ends early, at once, when `signal` aborts. */
export type Clock = { now(): number; sleep(ms: number, signal?: AbortSignal): Promise<void> };

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms, signal) =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    }),
};

/**
 * How long past its HTTP timeout an attempt may run before the session ends it. The HTTP timeout stops once the
 * headers are in, so a body that trickles in would otherwise keep an attempt, and the invocation, running.
 */
export const ATTEMPT_SLACK_MS = 250;

/**
 * Retries one instance may still make. `spend` takes one retry if there is one left; `refund` gives back one that was
 * taken but never ran.
 */
export type RetryBudget = { earn(): void; spend(): boolean; refund(): void };

/**
 * A retry budget: every `attemptsPerRetry` first attempts earn one retry, up to a reserve of `reserve` retries, and
 * it starts full. Occasional failures are retried as before. When most requests fail, retries stop once the reserve
 * is spent, so retrying adds at most one attempt per `attemptsPerRetry` requests. Counted in first attempts, so the
 * arithmetic is exact.
 */
export function retryBudget(attemptsPerRetry = 5, reserve = 10): RetryBudget {
  const full = attemptsPerRetry * reserve;
  let credit = full;
  return {
    earn() {
      credit = Math.min(full, credit + 1);
    },
    spend() {
      if (credit < attemptsPerRetry) return false;
      credit -= attemptsPerRetry;
      return true;
    },
    refund() {
      credit = Math.min(full, credit + attemptsPerRetry);
    },
  };
}

/**
 * The retry budget every session of this instance shares (module state). Fluid compute runs many invocations on one
 * instance at once, and each would otherwise retry up to `maxAttempts` times on its own. Instances do not share it,
 * so it bounds the multiplication per instance, not the total rate: a per-IP firewall limit does that.
 */
const instanceRetries = retryBudget();

export type ToncenterSession<C> = {
  /** Runs one request with retries. `fn` gets a client whose HTTP timeout fits the remaining budget. */
  call<T>(fn: (client: C) => Promise<T>): Promise<T>;
};

/** Short label for a transport failure. Never the error text or request config, which can carry the API key. */
function describe(e: unknown): string {
  const err = (typeof e === 'object' && e !== null ? e : {}) as HttpFailure;
  const status = err.response?.status;
  if (typeof status === 'number') return status >= 200 && status < 300 ? `HTTP ${status} cut off` : `HTTP ${status}`;
  return typeof err.code === 'string' ? err.code : 'no answer';
}

export type SessionOptions = {
  clock?: Clock;
  /** Jitter source for backoffDelay. */
  random?: () => number;
  /** Where retries come from; the instance's shared budget unless a test passes its own. */
  retries?: RetryBudget;
};

/**
 * One API invocation's access to toncenter. Create one per request and pass it to every read of that request, so
 * all of them share the spacing and the budget. `makeClient(timeoutMs)` builds the client for one attempt.
 */
export function toncenterSession<C>(
  makeClient: (timeoutMs: number) => C,
  policy: CallPolicy,
  { clock = systemClock, random = Math.random, retries = instanceRetries }: SessionOptions = {},
): ToncenterSession<C> {
  const deadline = clock.now() + policy.budgetMs;
  let lastStart = Number.NEGATIVE_INFINITY;
  let turns: Promise<unknown> = Promise.resolve();
  const budgetSpent = () => new BudgetSpentError();

  /**
   * Waits for an attempt's turn and returns its HTTP timeout. Attempts take turns in call order, and each starts
   * gapMs after the previous one actually started: a timer that fires late delays the attempts after it instead of
   * letting two start together. The timeout is what is left of the budget when the attempt actually starts; when
   * that is under minAttemptMs this throws, at once if no start inside the budget is left. The turn ends as the
   * attempt starts, so the requests themselves still overlap.
   */
  function admit(): Promise<number> {
    const turn = turns.then(async () => {
      const earliest = lastStart + policy.gapMs;
      if (deadline - Math.max(clock.now(), earliest) < policy.minAttemptMs) throw budgetSpent();
      let now = clock.now();
      while (now < earliest) {
        await clock.sleep(earliest - now);
        now = clock.now();
      }
      const timeoutMs = Math.min(policy.attemptTimeoutMs, deadline - now);
      if (timeoutMs < policy.minAttemptMs) throw budgetSpent();
      lastStart = now;
      return timeoutMs;
    });
    turns = turn.catch(() => undefined);
    return turn;
  }

  /** Runs one attempt, ended as a timeout if it is still running ATTEMPT_SLACK_MS after its HTTP timeout. */
  async function attempt<T>(fn: (client: C) => Promise<T>, timeoutMs: number): Promise<T> {
    const done = new AbortController();
    const overrun = clock.sleep(timeoutMs + ATTEMPT_SLACK_MS, done.signal).then((): never => {
      throw Object.assign(new Error(`attempt still running after ${Math.round(timeoutMs)} ms`), { code: 'ETIMEDOUT' });
    });
    try {
      // A late answer or failure of an attempt that was ended is ignored (race already handles both).
      return await Promise.race([fn(makeClient(Math.floor(timeoutMs))), overrun]);
    } finally {
      done.abort();
    }
  }

  return {
    async call<T>(fn: (client: C) => Promise<T>): Promise<T> {
      /** The transport failure the next attempt retries. */
      let failure: unknown;
      for (let n = 1; ; n++) {
        // A retry takes its credit before its backoff. When the attempts queued meanwhile leave it no turn inside
        // the budget, it never runs: the credit goes back, and the error names the failure it was to retry.
        const timeoutMs = await admit().catch((e: unknown) => {
          if (n === 1) throw e;
          retries.refund();
          throw new ChainUnavailableError(`toncenter: ${describe(failure)}, no time left to retry`);
        });
        if (n === 1) retries.earn();
        try {
          return await attempt(fn, timeoutMs);
        } catch (e) {
          if (!isTransportError(e)) throw e;
          if (n >= policy.maxAttempts) {
            throw new ChainUnavailableError(`toncenter: ${describe(e)} after ${n} attempts`);
          }
          const delay = backoffDelay(policy, n, random);
          if (clock.now() + delay + policy.minAttemptMs > deadline) {
            throw new ChainUnavailableError(`toncenter: ${describe(e)}, no time left to retry`);
          }
          if (!retries.spend()) {
            throw new ChainUnavailableError(`toncenter: ${describe(e)}, no retries left on this instance`);
          }
          failure = e;
          await clock.sleep(delay);
        }
      }
    },
  };
}
