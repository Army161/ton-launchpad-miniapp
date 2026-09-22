# VERIFICATION.md — evidence per requirement

Statuses: NOT_STARTED · IN_PROGRESS · PASS · FAIL · BLOCKED_HUMAN · DEFERRED. PASS needs evidence.
Last run: 2026-09-22 on branch `claude/project-thread-6o05dp` (verified at `62f0c4e`), Node 22.22, cloud sandbox.
Contract tests are in `contracts/tests/launchpad.spec.ts`; app tests in `tests/*.test.ts`.

## Build and static gates

| Requirement | Method | Command/Test | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|
| Contracts compile | build | `cd contracts && npm run build` | 3 contracts, no errors | JettonWallet, LaunchpadJetton, LaunchpadFactory compiled | build log | PASS |
| Build is reproducible | rebuild + diff | `npm run build && git status` | no diff | no diff | CI step "Generated wrappers match" | PASS |
| Contract scripts typecheck | tsc | `cd contracts && npm run typecheck` | 0 errors | 0 errors | | PASS |
| Contract tests | sandbox | `cd contracts && npm test` | all pass | 46/46 | jest output | PASS |
| App lint | oxlint | `npm run lint` | 0 errors | 0 errors, 5 warnings (fast-refresh/effect style) | | PASS |
| App + API tests | vitest | `npm test` | all pass | 62/62 | vitest output | PASS |
| Typecheck + build | tsc -b, vite | `npm run build` | success | success (1.05 MB JS, gzip 307 KB) | | PASS |
| No server secrets in bundle | grep dist | CI step | no matches | no matches | | PASS |
| Dependency audit | npm audit | `npm audit --omit=dev`; `cd contracts && npm audit` | no runtime vulns | 0 / 0 | SECURITY #16–17 | PASS |

## Economics and contract behaviour (sandbox, compiled code)

| Requirement | Test | Expected | Actual | Status |
|---|---|---|---|---|
| Fee = 2%, 60/40 split | "mints exactly the quoted amount and pays 2% split 60/40"; `fees` suite (7 sizes 0.01–1000 TON) | creator/treasury receive exact nanoton amounts | exact | PASS |
| Tiny trades still pay fees | "fees are never zero on the smallest allowed trade" | both shares > 0 at 0.01 TON | yes | PASS |
| Rounding cannot leak funds | "repeated random trades never leak value…" (40 trades, all exit) | reserve never negative, totals match | pass; dust < 1000 nanoton stays in pool | PASS |
| Quotes match execution | getters `quote_buy`/`quote_sell` vs minted/paid | equal | equal | PASS |
| Buy increases state | "mints exactly…" | supply, reserve, trade count up | yes | PASS |
| Sell decreases state; sellability | "a bought token can be sold back…" | holder gets quoted TON, balance 0 | yes | PASS |
| Zero / dust / malformed / underfunded rejected | "rejects zero, dust and under-funded buys", "rejects a malformed buy message" | tx fails, no mint | yes | PASS |
| Slippage enforced both ways | "rejects the trade and refunds…", "restores the jettons…" | refund / jettons restored | yes | PASS |
| Balance enforced | "refuses to sell more than the wallet holds" | fail, balance unchanged | yes | PASS |
| No arbitrary mint | "nobody can mint by sending an internal transfer…" | fail | yes | PASS |
| No drain via forged sell | "a forged burn notification cannot withdraw TON" (+ naming a real holder) | fail, reserve unchanged | yes | PASS |
| Treasury immutable | "the treasury and liquidity manager are fixed at launch" | unchanged | yes | PASS |
| No early graduation | "nobody can force graduation or migration early" | fail | yes | PASS |
| Factory: creation, init, bad input, duplicate | `factory` suite (9 tests) | as named | yes | PASS |
| Graduation below / at / above target | `graduation` suite | not graduated at −1 nano; graduated at exactly 1500; overshoot graduates | yes | PASS |
| Graduation once, curve closed | "graduates exactly at the target, once…", "migrates liquidity exactly once…" | late buy/sell fail; second Migrate fails | yes | PASS |
| Post-graduation state | "migrates liquidity…" | supply = 1B, mintable false, reserve moved | yes | PASS |
| Gas budgets sufficient | "gas: buy and sell fit…" | buy < 0.1, sell < 0.1 TON | buy ≈ 0.028, sell ≈ 0.003 TON net | PASS |

## App and API

| Requirement | Test | Status |
|---|---|---|
| initData: valid accepted; tampered, wrong bot, stale, future, oversized, no user rejected | `tests/telegram-auth.test.ts` | PASS |
| JWT: round trip; expiry, wrong secret, forged body, alg=none rejected | `tests/telegram-auth.test.ts` | PASS |
| Client message encoding = compiled ABI (CreateToken, Buy, Sell) | `tests/contracts-lib.test.ts` | PASS |
| Client derives the same token address as the factory | `tests/contracts-lib.test.ts` | PASS |
| Amount parsing rejects floats, exponents, too many decimals | `tests/contracts-lib.test.ts` | PASS |
| Metadata round-trip and validation (https image, t.me link) | `tests/contracts-lib.test.ts` | PASS |
| Env validator fails closed and never echoes values | `tests/env-rules.test.ts` | PASS |
| External feeds fail safe (network error, 500, 429, bad JSON → empty/null, never invented data) | `tests/external-feeds.test.ts` (DexScreener, CoinGecko, TonAPI, own API); STON.fi list in `Home.tsx` by inspection (try/catch → empty tab) | PASS |

## Live and on-chain gates

| Requirement | Method | Status | Blocker |
|---|---|---|---|
| Manifest, `/terms`, `/privacy`, icon reachable | `node scripts/validate-env.ts production --network` | BLOCKED_HUMAN | This sandbox's egress policy blocks `*.vercel.app` and toncenter; run locally |
| `/api/health`, `/api/tokens` on production | curl after deploy | NOT_STARTED | needs this branch deployed |
| Testnet deploy, create, buy, sell, fees, refunds | `docs/EXECUTION.md` testnet gate | BLOCKED_HUMAN | funded testnet deployer wallet; network access |
| TON Connect in Telegram (Tonkeeper, Wallet), return URL | manual in Telegram | BLOCKED_HUMAN | bot + Mini App short name |
| Telegram auth on production | manual | BLOCKED_HUMAN | bot token + JWT secret in Vercel |
| STON.fi seeding + LP lock | keeper on testnet/mainnet | BLOCKED_HUMAN | a graduated token (testnet) and founder sign-off (ADR-005) |
| Mainnet factory deploy + smoke test | `launch-production.sh` | BLOCKED_HUMAN | testnet gate + "MAINNET GO-LIVE APPROVED" |
| Design pixel pass | — | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |
