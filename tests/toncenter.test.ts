import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { inspect } from 'node:util';
import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  backoffDelay,
  callPolicy,
  ChainUnavailableError,
  getterExitCode,
  isTransportError,
  toncenterSession,
  type CallPolicy,
  type Clock,
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
const exitCode = (code: number) => new Error(`Unable to execute get method. Got exit_code: ${code}`);

const KEYLESS = callPolicy(undefined);
const KEYED = callPolicy('a-key');

/** Virtual time: sleep() parks on a queue that drive() releases in time order whenever nothing else can run. */
function virtualClock() {
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
      now = Math.max(now, next.at);
      next.wake();
    }
  }
  return { clock, drive, now: () => now };
}

const TIMEOUT = Symbol('timeout');
type Outcome = unknown;

/**
 * A session over a scripted toncenter. Each attempt takes `latencyMs` and then answers with the next outcome of its
 * request's script: an Error is thrown, TIMEOUT waits out the attempt's HTTP timeout, anything else is returned.
 */
function harness(policy: CallPolicy, latencyMs = 100) {
  const vc = virtualClock();
  const session = toncenterSession((timeoutMs: number) => ({ timeoutMs }), policy, vc.clock, () => 0.5);
  const attempts: { at: number; timeoutMs: number }[] = [];
  const request = (script: Outcome[]) =>
    session.call(async ({ timeoutMs }) => {
      attempts.push({ at: vc.now(), timeoutMs });
      const outcome = script.shift();
      if (outcome === TIMEOUT) {
        await vc.clock.sleep(timeoutMs);
        throw timeoutError(timeoutMs);
      }
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
  type Reply = { status: number; body?: unknown } | 'hang' | 'drop';
  const answer = (exitCode: number): Reply => ({ status: 200, body: { ok: true, result: { gas_used: 0, exit_code: exitCode, stack: [] } } });
  const FAST: CallPolicy = { gapMs: 0, maxAttempts: 4, budgetMs: 3000, attemptTimeoutMs: 200, minAttemptMs: 50, backoffMs: 1, maxBackoffMs: 5 };
  const ADDRESS = Address.parse('EQD__________________________________________0vo');

  beforeEach(() => {
    for (const name of ['HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']) vi.stubEnv(name, '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Answers each request with the next reply: an HTTP status and JSON body, no answer at all, or a reset socket. */
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
    const session = toncenterSession((timeout) => new TonClient({ endpoint, timeout }), FAST);
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
