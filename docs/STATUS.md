# STATUS.md — current state

Updated: 2026-11-17 · Branch: `clawdbot-permanent` (GitHub default and Vercel production branch; `main` was merged into it by PR #3 and deleted)

**Overall: MAINNET DEPLOY IN PROGRESS.** The testnet gate passed and the founder wrote "MAINNET GO-LIVE APPROVED" on
2026-11-17. The live site runs 682021b with launches disabled (`VITE_FACTORY_ADDRESS=PENDING_DEPLOY`). What remains is
the founder's factory deploy from their own wallet, pointing Vercel at the factory, and the Telegram smoke test.

## Gates

| Gate | Status | Evidence |
|---|---|---|
| Build (app, API, scripts) | PASS | `npm run build` (e113ccf, 2026-11-17; again 2026-11-17 with the API read-path change on 933a165) |
| Lint | PASS | `npm run lint` (0 errors, e113ccf; again with the API read-path change) |
| Contract compile | PASS | `cd contracts && npm run build`, wrappers in sync (e113ccf) |
| Contract tests | PASS | 94/94 sandbox and script tests against the compiled contracts (93 + the rehearsal-build suite, which runs after `npm run build:rehearsal`), incl. the ADR-010 router wallet guard; e113ccf, 2026-11-17 |
| App/API tests | PASS | 119/119 vitest (2026-11-17, API read-path change on 933a165: toncenter retries, 503 instead of a false 404, no cached partial list); 68/68 at e113ccf |
| Claude PR review on GitHub | READY, needs secret | `claude-code-review.yml` + `claude.yml`; founder adds `CLAUDE_CODE_OAUTH_TOKEN` (`docs/EXECUTION.md`) |
| GitHub Actions | PASS | "CI and deploy" green on 6638371 (2026-11-05); billing lock is gone |
| Security review | PASS with notes | `docs/SECURITY.md`: no open CRITICAL/HIGH in our code (2026-11-12: pool pre-seeding attack #20 fixed by ADR-010, needs testnet proof); dependency notes #18–19; no independent audit yet (#12) |
| Environment validation | READY, not run on real values | `scripts/validate-env.ts`; needs the founder's local `.env.*` |
| Live site | PASS | production deploy of 682021b (2026-11-17); `/api/health` ok, `network: mainnet`, `telegramAuthConfigured: true`, `factoryConfigured: false` until the factory exists |
| Telegram validation | DONE | @TONLaunchpad_Bot Main App, menu button, return URL `https://t.me/TONLaunchpad_Bot?startapp` |
| Testnet deployment | PASS | factory `kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx` deployed 2026-11-14; it embeds STON.fi's broken testnet router, so redeploy if a working one appears. sell and refund checks passed 2026-11-17 |
| Mainnet deployment | IN PROGRESS | testnet gate PASS and "MAINNET GO-LIVE APPROVED" (2026-11-17); the founder deploys the factory from a fresh wallet, then Vercel gets the address. The launch script's Vercel upload of `.env.production` was fixed first (SECURITY #23) |
| TON Connect validation | BLOCKED_HUMAN | testnet factory exists; needs a Tonkeeper testnet wallet run (`docs/EXECUTION.md` 4-7). Also check that the wallet list shows Telegram's wallet once and that it connects (the stale hand-written "Wallet" entry, review finding TC-1, was removed) |
| Design pixel pass | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |

## Deployment facts

| Item | Value |
|---|---|
| Factory address (testnet) | `kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx` (2026-11-14) |
| Platform treasury (mainnet) | `UQBNwH67i7p23n2LYgEJtEEWp9p44HlqoDzZHBXm2mcUKyF3` (founder, 2026-11-17; valid mainnet basechain address) |
| STON.fi router (mainnet, pin) | `EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql` (v2.2 constant product, passed the mainnet-fork rehearsal) |
| Factory address (mainnet) | none yet (`VITE_FACTORY_ADDRESS=PENDING_DEPLOY` disables launches in the UI) |
| Production URL | https://ton-launchpad-miniapp.vercel.app (auto-deploys `clawdbot-permanent`) |
| Bot | @TONLaunchpad_Bot (Main App) |
| Liquidity manager | refund fallback only (ADR-009); defaults to the deployer wallet |
| STON.fi router | chosen at deploy (`STON_ROUTER_ADDRESS`); graduation seeds it on-chain |

## Human blockers (in order)

1. Done 2026-11-17: treasury address provided; "MAINNET GO-LIVE APPROVED" given 2026-11-17.
2. Testnet gate (2026-11-14): factory deployed and graduation steps 1-4 passed on testnet; STON.fi's testnet router is broken, so the pool leg ran on a mainnet fork (`npm run rehearse:fork`): PASS, pool created and LP burned on the real mainnet router code. Sell and refund checks passed 2026-11-17 (`npm run check:trades`, 10/10). Testnet gate PASS.
3. Add the `CLAUDE_CODE_OAUTH_TOKEN` repository secret so Claude reviews PRs on GitHub (`docs/EXECUTION.md`).
4. Add `TONCENTER_API_KEY` to Vercel (Production) before launch traffic. Without it the API reads toncenter at about
   one request per second from shared Vercel IPs, so token pages and trade confirmations answer 503 ("try again
   shortly") under load (`docs/ENVIRONMENT.md`). Optional: enable Vercel Blob (image upload).
5. Optional, recommended before real volume: independent contract audit (SECURITY #12).
6. Deploy the mainnet factory from a fresh deploy wallet (`docs/LAUNCH.md` section 4), then the smoke test.
7. Upload design mockups for the pixel pass.

## Remaining engineering work

| Item | Priority | Notes |
|---|---|---|
| Record mainnet evidence | P0 | after the factory deploy: address and transaction here and in VERIFICATION |
| Pagination past the ~100 most recent factory transactions in `/api/tokens` | P1 | fine at launch volume; needs an indexer or DB later (ADR-003) |
| `/api/tokens` reads 2 getters per token inside one 7 s budget | P1 | about 2 tokens per request without `TONCENTER_API_KEY`, about 25 with it; past that the list comes back partial and uncached, so each Home load reads the chain again. Token metadata never changes after launch, so caching `get_jetton_data` per token would halve the requests; an indexer removes the limit (ADR-003) |
| Env validator calls a real mnemonic a placeholder | P1 | `checkMnemonic` (`scripts/env/rules.ts`) matches its placeholder pattern against the words, and `example` and `replace` are real wordlist words: about 2.3% of valid mnemonics fail with "still a placeholder". If the founder's `DEPLOY_MNEMONIC` contains either word, `validate-env deploy-mainnet` fails and `scripts/launch-production.sh` (which runs under `set -euo pipefail`) stops at step 1/5, before it spends any TON. The same bug makes two tests in `tests/env-rules.test.ts` fail about 1 run in 20 |
| Rate limit on `/api/metadata/upload` | P2 | SECURITY #13 |
| Bundle size (1.05 MB, mostly TON libraries) | P2 | code-split the trading pages |
| Independent contract audit | P1 before real volume | SECURITY #12 |
| Prove on-chain STON.fi graduation on testnet | P0 | ADR-009 built and sandbox-tested; needs a real pool with LP at the zero address |
| Short referral deep links (`startapp`, 64-char limit) | P1 | contract side done (ADR-008); needs launch id + referral code mapping in the API and the Buy page reading `start_param` |

## Verified at

2026-11-17, API read-path change on 933a165 (pre-launch review findings API-1 and TC-1): lint 0 errors, 119/119 app
tests (new: `tests/toncenter.test.ts`, `tests/chain-read.test.ts`, `tests/api-tokens.test.ts`), build, bundle secret
scan clean, no tracked env files. Contracts untouched and not re-run. Toncenter reads now go through
`api/_lib/toncenter.ts` (spacing, retries, 7 s budget); `/api/tokens/:address` answers 503 instead of a false 404 when
toncenter cannot be read; `/api/tokens` no longer caches a partial list; Buy and Sell no longer claim a refund when a
confirmation poll times out; the stale "Wallet" entry is gone from the TON Connect list.

2026-11-10, `clawdbot-permanent` 6638371 plus the dependency and env-validator fixes: contracts build + typecheck + 60/60 tests
(1 rehearsal suite skipped), wrappers in sync, lint 0 errors, 67/67 app tests, build, bundle secret scan clean, no tracked env files.

2026-11-05, on-chain graduation branch (ADR-009): contracts build + typecheck + 61/61 tests, wrappers in sync, lint 0 errors, 67/67 app tests, build, bundle
secret scan clean, no tracked env files. Re-run `/verify` before trusting this table on a later commit.
