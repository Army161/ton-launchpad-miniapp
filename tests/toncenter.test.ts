import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { inspect } from 'node:util';
import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ATTEMPT_SLACK_MS,
  backoffDelay,
  callPolicy,
  ChainUnavailableError,
  getterExitCode,
  isTransportError,
  retryBudget,
  toncenterSession,
  type CallPolicy,
  type Clock,
  type RetryBudget,
} from '../api/_lib/toncenter';

// Error shapes as @ton/ton (HttpApi over axios 1.x) produces them.
const httpError = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    code: status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
    response: { status },
  });
const timeoutError = (ms: number) => Object.assign(new Error(`timeout of ${ms}ms exceeded`), { isAxiosError: true, code: 'ECONNABORTED' });
const noAnswer = () => Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK' });
const connectionReset = () => Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
// axios raises this when the body breaks off after the headers, with those headers' status attached.
const cutOff = () =>
  Object.assign(new Error('stream has been aborted'), { isAxiosError: true, code: 'ERR_BAD_RESPONSE', response: { status: 200 } });
const exitCode = (code: number) => new Error(`Unable to execute get method. Got exit_code: ${code}`);

const KEYLESS = callPolicy(undefined);
const KEYED = callPolicy('a-key');

/**
 * Virtual time: sleep() parks on a queue that drive() releases in time order whenever nothing else can run.
 * `blocked` models an event loop that is busy from `from` until `until`: a timer due in between fires at `until`.
 */
function virtualClock(blocked?: { from: number; until: number }) {
  let now = 0;
  let seq = 0;
  const timers: { at: number; seq: number; wake: () => void }[] = [];
  const clock: Clock = {
    now: () => now,
    sleep: (ms) =>
      new Promise<void>((resolve) => {
        timers.push({ at: now + ms, seq: seq++, wake: () => resolve() });
      }),
  };
  async function drive<T>(work: Promise<T>): Promise<T> {
    let settled = false;
    work.then(
      () => (settled = true),
      () => (settled = true),
    );
    for (;;) {
      await new Promise((resolve) => setImmediate(resolve)); // run everything that is not asleep
      if (settled) return work;
      timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const next = timers.shift();
      if (!next) throw new Error('stalled');
      const late = blocked !== undefined && next.at >= blocked.from && next.at < blocked.until;
      now = Math.max(now, late ? blocked.until : next.at);
      next.wake();
    }
  }
  return { clock, drive, now: () => now };
}

const TIMEOUT = Symbol('timeout');
/** An attempt that never ends by itself, like a body that keeps trickling in: the HTTP timeout never fires. */
const STALL = Symbol('stall');
type Outcome = unknown;

/**
 * A session over a scripted toncenter. Each attempt takes `latencyMs` and then answers with the next outcome of its
 * request's script: an Error is thrown, TIMEOUT waits out the attempt's HTTP timeout, anything else is returned.
 * Each harness gets a full retry budget of its own unless one is passed in, so no test depends on another.
 */
function harness(policy: CallPolicy, latencyMs = 100, blocked?: { from: number; until: number }, retries: RetryBudget = retryBudget()) {
  const vc = virtualClock(blocked);
  const session = toncenterSession((timeoutMs: number) => ({ timeoutMs }), policy, { clock: vc.clock, random: () => 0.5, retries });
  const attempts: { at: number; timeoutMs: number }[] = [];
  const request = (script: Outcome[]) =>
    session.call(async ({ timeoutMs }) => {
      attempts.push({ at: vc.now(), timeoutMs });
      const outcome = script.shift();
      if (outcome === TIMEOUT) {
        await vc.clock.sleep(timeoutMs);
        throw timeoutError(timeoutMs);
      }
      if (outcome === STALL) await new Promise(() => undefined);
      await vc.clock.sleep(latencyMs);
      if (outcome instanceof Error) throw outcome;
      return outcome;
    });
  return { attempts, request, drive: vc.drive, now: vc.now };
}

describe('toncenter error classification', () => {
  it.each([
    ['HTTP 429', httpError(429)],
    ['HTTP 500', httpError(500)],
    ['HTTP 503', httpError(503)],
    ['a timeout', timeoutError(5000)],
    ['no HTTP answer', noAnswer()],
    ['a connection reset', connectionReset()],
    ['a body cut off after 200 headers', cutOff()],
    ['an axios error with no answer and an unlisted code', Object.assign(new Error('write EPROTO'), { isAxiosError: true, code: 'EPROTO' })],
  ])('retries %s', (_name, err) => {
    expect(isTransportError(err)).toBe(true);
  });

  it.each([
    ['a getter exit code', exitCode(11)],
    ['exit code -13 (nothing deployed)', exitCode(-13)],
    ['HTTP 400', httpError(400)],
    ['HTTP 404', httpError(404)],
    ['a malformed response', new Error('Malformed response: Required')],
    ['a plain error', new Error('boom')],
    ['a non-error value', 'boom'],
  ])('does not retry %s', (_name, err) => {
    expect(isTransportError(err)).toBe(false);
  });

  it('reads the exit code of a failed getter', () => {
    expect(getterExitCode(exitCode(-13))).toBe(-13);
    expect(getterExitCode(exitCode(11))).toBe(11);
    expect(getterExitCode(httpError(429))).toBeNull();
    expect(getterExitCode('Unable to execute get method. Got exit_code: 11')).toBeNull();
  });
});

describe('toncenter session', () => {
  it('limits every call to 4 attempts and one invocation to 7 s', () => {
    for (const policy of [KEYLESS, KEYED]) {
      expect(policy.maxAttempts).toBe(4);
      expect(policy.budgetMs).toBe(7000);
      expect(policy.attemptTimeoutMs).toBeLessThanOrEqual(5000);
    }
  });

  it('retries HTTP 429 and 503, then returns the answer', async () => {
    const h = harness(KEYED);
    await expect(h.drive(h.request([httpError(429), httpError(503), 'state']))).resolves.toBe('state');
    expect(h.attempts).toHaveLength(3);
  });

  it('retries a timeout and a request with no answer', async () => {
    const h = harness(KEYED);
    await expect(h.drive(h.request([TIMEOUT, noAnswer(), 'state']))).resolves.toBe('state');
    expect(h.attempts).toHaveLength(3);
  });

  it.each([
    ['a getter exit code', exitCode(11)],
    ['HTTP 400', httpError(400)],
  ])('never retries %s and passes it through unchanged', async (_name, err) => {
    const h = harness(KEYED);
    await expect(h.drive(h.request([err, 'state']))).rejects.toBe(err);
    expect(h.attempts).toHaveLength(1);
  });

  it('gives up after 4 attempts with ChainUnavailableError', async () => {
    const h = harness(KEYED);
    const failure = h.drive(h.request([httpError(429), httpError(429), httpError(429), httpError(429), 'state']));
    await expect(failure).rejects.toBeInstanceOf(ChainUnavailableError);
    await expect(failure).rejects.toThrow('HTTP 429 after 4 attempts');
    expect(h.attempts).toHaveLength(4);
    expect(h.now()).toBeLessThan(KEYED.budgetMs);
  });

  it('never runs past the budget, cutting the last timeout to fit', async () => {
    const h = harness(KEYLESS);
    const failure = h.drive(h.request([TIMEOUT, TIMEOUT, TIMEOUT, TIMEOUT]));
    await expect(failure).rejects.toBeInstanceOf(ChainUnavailableError);
    // 5 s timeout, 0.75 s backoff, then only 1.25 s of budget is left for the second attempt.
    expect(h.attempts).toEqual([
      { at: 0, timeoutMs: 5000 },
      { at: 5750, timeoutMs: 1250 },
    ]);
    expect(h.now()).toBeLessThanOrEqual(KEYLESS.budgetMs);
  });

  it('ends an attempt still running just past its timeout, and retries it', async () => {
    const h = harness(KEYED);
    await expect(h.drive(h.request([STALL, 'state']))).resolves.toBe('state');
    // Ended at 5250 ms, then 188 ms of backoff; the second attempt gets what is left of the 7 s.
    expect(h.attempts).toEqual([
      { at: 0, timeoutMs: 5000 },
      { at: 5438, timeoutMs: 1562 },
    ]);
  });

  it('ends stalled attempts within the budget plus the slack, as unavailable', async () => {
    const h = harness(KEYED);
    const failure = h.drive(h.request([STALL, STALL, STALL]));
    await expect(failure).rejects.toBeInstanceOf(ChainUnavailableError);
    await expect(failure).rejects.toThrow('toncenter: ETIMEDOUT, no time left to retry');
    expect(h.attempts).toHaveLength(2);
    expect(h.now()).toBeLessThanOrEqual(KEYED.budgetMs + ATTEMPT_SLACK_MS);
  });

  it('fails at once when the budget is spent, without another request', async () => {
    const h = harness(KEYLESS);
    await expect(h.drive(h.request([TIMEOUT, TIMEOUT]))).rejects.toBeInstanceOf(ChainUnavailableError);
    const spent = h.attempts.length;
    const at = h.now();
    await expect(h.drive(h.request(['state']))).rejects.toThrow('request budget spent');
    expect(h.attempts).toHaveLength(spent);
    expect(h.now()).toBe(at);
  });

  it('spaces calls 1100 ms apart without an API key, also when they run concurrently', async () => {
    const sequential = harness(KEYLESS);
    for (let i = 0; i < 3; i++) await sequential.drive(sequential.request(['ok']));
    expect(sequential.attempts.map((a) => a.at)).toEqual([0, 1100, 2200]);

    const concurrent = harness(KEYLESS);
    await concurrent.drive(Promise.all([concurrent.request(['ok']), concurrent.request(['ok']), concurrent.request(['ok'])]));
    expect(concurrent.attempts.map((a) => a.at)).toEqual([0, 1100, 2200]);
  });

  it('cuts each concurrent attempt to the budget left at its start, and starts none past the budget', async () => {
    const h = harness(KEYLESS);
    const outcomes = await h.drive(Promise.all(Array.from({ length: 7 }, () => h.request(['ok']).catch((e: unknown) => e))));
    expect(h.attempts).toEqual([
      { at: 0, timeoutMs: 5000 },
      { at: 1100, timeoutMs: 5000 },
      { at: 2200, timeoutMs: 4800 },
      { at: 3300, timeoutMs: 3700 },
      { at: 4400, timeoutMs: 2600 },
      { at: 5500, timeoutMs: 1500 },
    ]);
    expect(outcomes.slice(0, 6)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
    expect(outcomes[6]).toBeInstanceOf(ChainUnavailableError);
    expect((outcomes[6] as Error).message).toBe('toncenter: request budget spent');
  });

  it('spaces attempts by when they actually start when a timer fires late', async () => {
    // The event loop is busy from 1000 to 2300 ms: the second attempt, due at 1100, starts at 2300.
    const h = harness(KEYLESS, 100, { from: 1000, until: 2300 });
    await h.drive(Promise.all([h.request(['ok']), h.request(['ok']), h.request(['ok'])]));
    expect(h.attempts).toEqual([
      { at: 0, timeoutMs: 5000 },
      { at: 2300, timeoutMs: 4700 },
      { at: 3400, timeoutMs: 3600 },
    ]);
  });

  it('takes the timeout from the budget left when an attempt actually starts, never one that would run past it', async () => {
    const six = (h: ReturnType<typeof harness>) =>
      h.drive(Promise.all(Array.from({ length: 6 }, () => h.request(['ok']).catch((e: unknown) => e))));
    const onTime = [
      { at: 0, timeoutMs: 5000 },
      { at: 1100, timeoutMs: 5000 },
      { at: 2200, timeoutMs: 4800 },
      { at: 3300, timeoutMs: 3700 },
      { at: 4400, timeoutMs: 2600 },
    ];

    // The sixth attempt, due at 5500 with 1.5 s left, starts at 6000: it gets the 1 s that is left then.
    const late = harness(KEYLESS, 100, { from: 5000, until: 6000 });
    expect(await six(late)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
    expect(late.attempts).toEqual([...onTime, { at: 6000, timeoutMs: 1000 }]);

    // At 6500 only 0.5 s is left, less than one attempt needs: it does not start.
    const later = harness(KEYLESS, 100, { from: 5000, until: 6500 });
    const outcomes = await six(later);
    expect(later.attempts).toEqual(onTime);
    expect(outcomes[5]).toBeInstanceOf(ChainUnavailableError);
    expect((outcomes[5] as Error).message).toBe('toncenter: request budget spent');
    expect(later.now()).toBeLessThanOrEqual(KEYLESS.budgetMs);
  });

  it('spaces calls 120 ms apart with an API key, retries included', async () => {
    const h = harness(KEYED);
    await h.drive(h.request(['ok']));
    await h.drive(h.request(['ok']));
    await h.drive(h.request([httpError(429), 'ok']));
    // Third call: starts at 240, fails at 340, backs off 188 ms (250 ms jittered to 75%).
    expect(h.attempts.map((a) => a.at)).toEqual([0, 120, 240, 528]);
  });

  it('backs off exponentially with bounded jitter', () => {
    const range = (policy: CallPolicy, n: number) => [backoffDelay(policy, n, () => 0), backoffDelay(policy, n, () => 1)];
    expect(range(KEYLESS, 1)).toEqual([500, 1000]);
    expect(range(KEYLESS, 2)).toEqual([1000, 2000]);
    expect(range(KEYLESS, 3)).toEqual([2000, 4000]);
    expect(range(KEYLESS, 6)).toEqual([2000, 4000]); // capped
    expect(range(KEYED, 1)).toEqual([125, 250]);
  });

  it('stops retrying when the instance has spent its retries, and first attempts earn them back', async () => {
    // One retry per 2 first attempts, a reserve of 2 retries.
    const h = harness(KEYED, 100, undefined, retryBudget(2, 2));
    const attemptsOf = async (script: Outcome[]) => {
      const before = h.attempts.length;
      const outcome = await h.drive(h.request(script)).catch((e: unknown) => e);
      return { outcome, attempts: h.attempts.length - before };
    };
    const noRetries = 'toncenter: HTTP 429, no retries left on this instance';

    const first = await attemptsOf([httpError(429), httpError(429), httpError(429), 'state']);
    expect(first.attempts).toBe(3); // the reserve of 2 retries, then no more
    expect(first.outcome).toBeInstanceOf(ChainUnavailableError);
    expect((first.outcome as Error).message).toBe(noRetries);

    expect(await attemptsOf(['ok'])).toEqual({ outcome: 'ok', attempts: 1 });
    // Two first attempts since then have earned one retry.
    expect(await attemptsOf([httpError(429), 'ok'])).toEqual({ outcome: 'ok', attempts: 2 });
    const spent = await attemptsOf([httpError(429), 'ok']);
    expect(spent.attempts).toBe(1);
    expect((spent.outcome as Error).message).toBe(noRetries);
  });

  it('costs about one attempt per lookup in a flood of failing lookups, and retries again once they succeed', async () => {
    // Each lookup is its own API invocation, so its own session, and they all share the instance's budget.
    const shared = retryBudget();
    const lookup = async (script: Outcome[]) => {
      const h = harness(KEYED, 100, undefined, shared);
      const outcome = await h.drive(h.request(script)).catch((e: unknown) => e);
      return { outcome, attempts: h.attempts.length };
    };
    const always429 = () => [httpError(429), httpError(429), httpError(429), httpError(429)];

    let attempts = 0;
    for (let i = 0; i < 100; i++) {
      const r = await lookup(always429());
      expect(r.outcome).toBeInstanceOf(ChainUnavailableError); // 503 for the endpoint, never "not a token"
      attempts += r.attempts;
    }
    // Alone, each lookup makes 4 attempts (400). Shared: the reserve of 10 retries, then 1 retry per 5 lookups.
    expect(attempts).toBe(129);

    for (let i = 0; i < 46; i++) expect(await lookup(['ok'])).toEqual({ outcome: 'ok', attempts: 1 });
    expect(await lookup([httpError(429), httpError(429), httpError(429), 'state'])).toEqual({ outcome: 'state', attempts: 4 });
  });

  it('keeps the request config (and its API key) out of the error', async () => {
    const h = harness(KEYED);
    const leaky = () => Object.assign(httpError(429), { config: { headers: { 'X-API-Key': 'secret-api-key' } } });
    const err = await h.drive(h.request([leaky(), leaky(), leaky(), leaky()])).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ChainUnavailableError);
    expect(inspect(err, { depth: 10 })).not.toContain('secret-api-key');
  });
});

// The same session over a real TonClient (HttpApi + axios) and a local stand-in for toncenter on 127.0.0.1, so the
// classification is checked against the errors the libraries really throw. Real timers, tiny limits.
describe('toncenter session over a real TonClient', () => {
  type Reply = { status: number; body?: unknown } | 'hang' | 'drop' | 'stall' | 'cut' | 'trickle';
  const answer = (exitCode: number): Reply => ({ status: 200, body: { ok: true, result: { gas_used: 0, exit_code: exitCode, stack: [] } } });
  const FAST: CallPolicy = { gapMs: 0, maxAttempts: 4, budgetMs: 3000, attemptTimeoutMs: 200, minAttemptMs: 50, backoffMs: 1, maxBackoffMs: 5 };
  const ADDRESS = Address.parse('EQD__________________________________________0vo');

  beforeEach(() => {
    for (const name of ['HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']) vi.stubEnv(name, '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /**
   * Answers each request with the next reply: an HTTP status and JSON body, no answer at all, or a reset socket.
   * 'stall', 'cut' and 'trickle' send 200 headers and the start of a body, then nothing more, a reset socket, or one
   * byte every 20 ms until the client goes away.
   */
  async function fakeToncenter(replies: Reply[]) {
    let requests = 0;
    const server = createServer((req, res) => {
      req.resume();
      req.on('end', () => {
        requests++;
        const reply = replies.shift() ?? { status: 500 };
        if (reply === 'hang') return;
        if (reply === 'drop') {
          req.socket.destroy();
          return;
        }
        if (reply === 'stall' || reply === 'cut' || reply === 'trickle') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.write('{"ok":true,');
          if (reply === 'cut') setTimeout(() => req.socket.destroy(), 20);
          if (reply === 'trickle') {
            const drip = setInterval(() => res.write(' '), 20);
            res.on('close', () => clearInterval(drip));
          }
          return;
        }
        res.writeHead(reply.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(reply.body ?? { ok: false, error: 'scripted', code: reply.status }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const close = () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      });
    return { endpoint: `http://127.0.0.1:${port}/api/v2/jsonRPC`, requests: () => requests, close };
  }

  async function runGetter(endpoint: string) {
    const session = toncenterSession((timeout) => new TonClient({ endpoint, timeout }), FAST, { retries: retryBudget() });
    return session.call((c) => c.runMethod(ADDRESS, 'get_curve_state')).then(
      () => 'answered',
      (e: unknown) => e,
    );
  }

  async function run(replies: Reply[]) {
    const toncenter = await fakeToncenter(replies);
    try {
      return { outcome: await runGetter(toncenter.endpoint), requests: toncenter.requests() };
    } finally {
      await toncenter.close();
    }
  }

  it.each<[string, Reply[], number]>([
    ['HTTP 429', [{ status: 429 }, answer(0)], 2],
    ['HTTP 502 and 504', [{ status: 502 }, { status: 504 }, answer(0)], 3],
    ['a timeout', ['hang', answer(0)], 2],
    ['a dropped connection', ['drop', answer(0)], 2],
    ['a body that stops after the headers', ['stall', answer(0)], 2],
    ['a connection dropped after the headers', ['cut', answer(0)], 2],
    ['a body that trickles in past the timeout', ['trickle', answer(0)], 2],
  ])('retries %s and returns the answer', async (_name, replies, requests) => {
    expect(await run(replies)).toEqual({ outcome: 'answered', requests });
  });

  it('gives up after 4 attempts of HTTP 503', async () => {
    const { outcome, requests } = await run([{ status: 503 }, { status: 503 }, { status: 503 }, { status: 503 }]);
    expect(outcome).toBeInstanceOf(ChainUnavailableError);
    expect((outcome as Error).message).toBe('toncenter: HTTP 503 after 4 attempts');
    expect(requests).toBe(4);
  });

  it('does not retry a getter exit code or HTTP 400', async () => {
    const exited = await run([answer(11), answer(0)]);
    expect(getterExitCode(exited.outcome)).toBe(11);
    expect(exited.requests).toBe(1);
    const refused = await run([{ status: 400 }, answer(0)]);
    expect(refused.outcome).not.toBeInstanceOf(ChainUnavailableError);
    expect(isTransportError(refused.outcome)).toBe(false);
    expect(refused.requests).toBe(1);
  });

  it('retries a refused connection, then reports the chain unavailable', async () => {
    const toncenter = await fakeToncenter([]);
    await toncenter.close(); // nothing listens on the port any more
    const outcome = await runGetter(toncenter.endpoint);
    expect(outcome).toBeInstanceOf(ChainUnavailableError);
    expect((outcome as Error).message).toBe('toncenter: ECONNREFUSED after 4 attempts');
  });
});
