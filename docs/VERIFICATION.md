# VERIFICATION.md — evidence per requirement

Statuses: NOT_STARTED · IN_PROGRESS · PASS · FAIL · BLOCKED_HUMAN · DEFERRED. PASS needs evidence.
Last run: 2026-09-27 on branch `claude/project-thread-dm0n4u` (referral share, ADR-008), Node 22, cloud sandbox.
Contract tests are in `contracts/tests/launchpad.spec.ts`; app tests in `tests/*.test.ts`.

## Build and static gates

| Requirement | Method | Command/Test | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|
| Contracts compile | build | `cd contracts && npm run build` | 3 contracts, no errors | JettonWallet, LaunchpadJetton, LaunchpadFactory compiled | build log | PASS |
| Build is reproducible | rebuild + diff | `npm run build && git status` | no diff | no diff | CI step "Generated wrappers match" | PASS |
| Contract scripts typecheck | tsc | `cd contracts && npm run typecheck` | 0 errors | 0 errors | | PASS |
| Contract tests | sandbox | `cd contracts && npm test` | all pass | 92/92 with the rehearsal build present (91 + 1 skipped without it); 2026-11-14 with ADR-010, script 429 retries and the fork reader | jest output | PASS |
| App lint | oxlint | `npm run lint` | 0 errors | 0 errors, warnings only (fast-refresh/effect style) | | PASS |
| App + API tests | vitest | `npm test` | all pass | 68/68 (2026-11-12) | vitest output | PASS |
| Typecheck + build | tsc -b, vite | `npm run build` | success | success (1.05 MB JS, gzip 307 KB) | | PASS |
| No server secrets in bundle | grep dist | CI step | no matches | no matches | | PASS |
| Dependency audit | npm audit | `npm audit --omit=dev`; `cd contracts && npm audit` | no unaccepted runtime vulns | app runtime: 2 high (zod 3 inside @ton/ton) + 3 low (deepmerge via @tonconnect/ui), all accepted in SECURITY #19; contracts toolchain: 5 high + 9 low (dev only, major-upgrade fixes) | SECURITY #16–19 | PASS with notes |

## Economics and contract behaviour (sandbox, compiled code)

| Requirement | Test | Expected | Actual | Status |
|---|---|---|---|---|
| Fee = 2%, 60/40 split | "mints exactly the quoted amount and pays 2% split 60/40"; `fees` suite (7 sizes 0.01–1000 TON) | creator/treasury receive exact nanoton amounts | exact | PASS |
| Referral split 60/20/20 from platform share | `referral` suite: 4 sizes 0.2–1000 TON; same tokens minted with or without referrer | creator/treasury/referrer receive exact nanoton amounts; creator unchanged | exact | PASS |
| Referral dust, self-referral, sells | "keeps a dust referral cut…", "pays the first referral exactly at the dust threshold", "ignores self-referral", "sells never pay a referrer" | no referrer message; platform keeps the cut | yes | PASS |
| Bad referrer cannot block a buy; mint does not bounce | "a referrer that cannot accept TON…", "the mint cannot bounce at the minimum attached gas…" | buy succeeds, wallet deployed, no bounce | yes | PASS |
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
| Testnet deploy, create, buy, sell, fees, refunds | `docs/EXECUTION.md` testnet gate | PASS | 2026-11-17 `npm run check:trades` on that factory: token `kQDUxg8cZ2K1vweaIKjuMLg-PRuobF3XiGQyKLu6FusdDm5U`, launch, buy 0.2 TON (curve kept 0.196, creator 0.0024 and treasury 0.0016 TON paid), sell half (+0.095 TON), underfunded sell kept the tokens, stale-quote buy refunded (0.0011 TON gas), sell rest, supply back to 0: 10/10 PASS. 2026-11-14 testnet: factory `kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx` deployed and verified on-chain (fee 200 bps, creator 6000 bps; wallet tx 94bed270…3bdf, factory tx 065af6e1…8479); create and buy proven by the rehearsal below |
| TON Connect in Telegram (Tonkeeper, Wallet), return URL | manual in Telegram | BLOCKED_HUMAN | bot + Mini App short name |
| Telegram auth on production | manual | BLOCKED_HUMAN | bot token + JWT secret in Vercel |
| STON.fi seeding + LP lock | sandbox: "seeds STON.fi straight from the curve…", "sets min_lp_out…", "if the DEX legs bounce…" (exact messages); testnet: real pool | PASS (sandbox) / PARTIAL (testnet) / PASS (mainnet fork) | 2026-11-14 testnet rehearsal, target 1 TON: rehearsal factory `kQCyqBiKoSlucHJfVkoCdJGmMwkBsT8d3W-_Igi2IhCLiFts`, token `kQBugvy3LG5arVJLDAaS7tn1DQnDuzGO2jQ3KrJtu1bLYztD`; deploy 5e56788c…bdc5, launch 33c32ffa…712b, buy 9571b312…b42c / 7e44b806…2bee, migrate ee76281d…cd5b / 752cb7e8…a5cb; jettons to router wallet 89b74d8d…e8e7, 0.67 TON to pTON wallet d3e733b8…bc2d: PASS. Pool: FAIL outside our code, router `kQALh-…Wk0v` aborts with exit 9 (aeb59263…5d2b, fb9c254f…c0dc) because its library is missing on testnet. Pool leg moves to `npm run rehearse:fork` (`docs/EXECUTION.md` 8b). 2026-11-14 mainnet fork, no TON spent: router `EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql` (v2.2 constant product), pTON `EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S`, 7 mainnet libraries; factory deploy, launch, buy 1.030408163 TON, graduate, Migrate (16 transactions, 0 aborted): PASS; pool `EQCDmhZ9Yb6AgiqC2D4_tGohwy4We5aFK90fWThs_B05SE3_` active, LP supply 18656996224687; zero-address LP wallet `EQD6XbMUuDTjJXyCce31v1Y9elzY-27LLMRLnO5dV7IG7CoU` exists: PASS |
| Mainnet factory deploy + smoke test | `launch-production.sh` | BLOCKED_HUMAN | testnet gate passed and "MAINNET GO-LIVE APPROVED" given 2026-11-17; the founder runs the deploy from their own machine |
| Design pixel pass | — | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |
