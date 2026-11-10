# STATUS.md — current state

Updated: 2026-11-10 · Branch: `clawdbot-permanent` (GitHub default and Vercel production branch; `main` was merged into it by PR #3 and deleted)

**Overall: NOT PRODUCTION READY.** All engineering that can be verified without the founder's wallets is done and
passing. The live site runs 6638371; the 2026-11-10 dependency and validator fixes go live when PR #8 merges. What remains is the testnet gate and the mainnet deploy, both founder actions.

## Gates

| Gate | Status | Evidence |
|---|---|---|
| Build (app, API, scripts) | PASS | `npm run build` |
| Lint | PASS | `npm run lint` (0 errors) |
| Contract compile | PASS | `cd contracts && npm run build`, wrappers in sync |
| Contract tests | PASS | 60/60 sandbox tests against the compiled contracts (+1 rehearsal-only suite skipped) |
| App/API tests | PASS | 67/67 vitest |
| Claude PR review on GitHub | READY, needs secret | `claude-code-review.yml` + `claude.yml`; founder adds `CLAUDE_CODE_OAUTH_TOKEN` (`docs/EXECUTION.md`) |
| GitHub Actions | PASS | "CI and deploy" green on 6638371 (2026-11-05); billing lock is gone |
| Security review | PASS with notes | `docs/SECURITY.md`: no open CRITICAL/HIGH in our code; dependency notes #18–19; no independent audit yet (#12) |
| Environment validation | READY, not run on real values | `scripts/validate-env.ts`; needs the founder's local `.env.*` |
| Live site | PASS | production deploy of 6638371; `/api/health` ok, `telegramAuthConfigured: true`; no runtime errors in 7 days |
| Telegram validation | DONE | @TONLaunchpad_Bot Main App, menu button, return URL `https://t.me/TONLaunchpad_Bot?startapp` |
| Testnet deployment | BLOCKED_HUMAN | needs a funded testnet deployer wallet and the STON.fi testnet router (`docs/EXECUTION.md`) |
| Mainnet deployment | NOT_DEPLOYED | locked until the testnet gate passes and "MAINNET GO-LIVE APPROVED" |
| TON Connect validation | BLOCKED_HUMAN | needs a deployed factory to send a real transaction |
| Design pixel pass | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |

## Deployment facts

| Item | Value |
|---|---|
| Factory address (testnet) | none yet |
| Factory address (mainnet) | none yet (`VITE_FACTORY_ADDRESS=PENDING_DEPLOY` disables launches in the UI) |
| Production URL | https://ton-launchpad-miniapp.vercel.app (auto-deploys `clawdbot-permanent`) |
| Bot | @TONLaunchpad_Bot (Main App) |
| Treasury address | not provided yet (needed only at factory deploy; it is baked into the contract) |
| Liquidity manager | refund fallback only (ADR-009); defaults to the deployer wallet |
| STON.fi router | chosen at deploy (`STON_ROUTER_ADDRESS`); graduation seeds it on-chain |

## Human blockers (in order)

1. Provide the treasury address (public, can be shared in chat).
2. Create and fund a testnet deployer wallet; run the testnet gate and `npm run rehearse:graduation` locally (`docs/EXECUTION.md`).
3. Add the `CLAUDE_CODE_OAUTH_TOKEN` repository secret so Claude reviews PRs on GitHub (`docs/EXECUTION.md`).
4. Optional: enable Vercel Blob (image upload) and add `TONCENTER_API_KEY` to Vercel.
5. Optional, recommended before real volume: independent contract audit (SECURITY #12).
6. After the testnet gate: write "MAINNET GO-LIVE APPROVED", then run the launch (`docs/LAUNCH.md`).
7. Upload design mockups for the pixel pass.

## Remaining engineering work

| Item | Priority | Notes |
|---|---|---|
| Record testnet evidence | P0 | after blocker 2: addresses and tx hashes here and in VERIFICATION |
| Pagination past the ~100 most recent factory transactions in `/api/tokens` | P1 | fine at launch volume; needs an indexer or DB later (ADR-003) |
| Rate limit on `/api/metadata/upload` | P2 | SECURITY #13 |
| Bundle size (1.05 MB, mostly TON libraries) | P2 | code-split the trading pages |
| Independent contract audit | P1 before real volume | SECURITY #12 |
| Prove on-chain STON.fi graduation on testnet | P0 | ADR-009 built and sandbox-tested; needs a real pool with LP at the zero address |
| Short referral deep links (`startapp`, 64-char limit) | P1 | contract side done (ADR-008); needs launch id + referral code mapping in the API and the Buy page reading `start_param` |

## Verified at

2026-11-10, `clawdbot-permanent` 6638371 plus the dependency and env-validator fixes: contracts build + typecheck + 60/60 tests
(1 rehearsal suite skipped), wrappers in sync, lint 0 errors, 67/67 app tests, build, bundle secret scan clean, no tracked env files.

2026-11-05, on-chain graduation branch (ADR-009): contracts build + typecheck + 61/61 tests, wrappers in sync, lint 0 errors, 67/67 app tests, build, bundle
secret scan clean, no tracked env files. Re-run `/verify` before trusting this table on a later commit.
