# STATUS.md — current state

Updated: 2026-09-22 · Branch: `claude/project-thread-6o05dp` · Last verified commit: see "Verified at" below.

**Overall: NOT PRODUCTION READY.** All engineering that can be verified without the founder's wallets, bot and
network access is done and passing. The testnet gate and every live check are blocked on founder actions.

## Gates

| Gate | Status | Evidence |
|---|---|---|
| Build (app, API, scripts) | PASS | `npm run build` |
| Lint | PASS | `npm run lint` (0 errors) |
| Contract compile | PASS | `cd contracts && npm run build`, wrappers in sync |
| Contract tests | PASS | 46/46 sandbox tests against the compiled contracts |
| App/API tests | PASS | 62/62 vitest |
| Security review | PASS with notes | `docs/SECURITY.md`: no open CRITICAL/HIGH; no independent audit yet (#12) |
| Environment validation | READY, not run on real values | `scripts/validate-env.ts`; needs the founder's local `.env.*` |
| Testnet deployment | BLOCKED_HUMAN | needs a funded testnet deployer wallet and network access (`docs/EXECUTION.md`) |
| Mainnet deployment | NOT_DEPLOYED | locked until the testnet gate passes and "MAINNET GO-LIVE APPROVED" |
| Telegram validation | BLOCKED_HUMAN | bot, Mini App short name, bot token in Vercel |
| TON Connect validation | BLOCKED_HUMAN | needs the Mini App opened in Telegram |
| Design pixel pass | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |

## Deployment facts

| Item | Value |
|---|---|
| Factory address (testnet) | none yet |
| Factory address (mainnet) | none yet (`VITE_FACTORY_ADDRESS=PENDING_DEPLOY` disables launches in the UI) |
| Production URL | https://ton-launchpad-miniapp.vercel.app (serves `main`; this branch is not merged yet) |
| Treasury address | not provided yet |
| Liquidity manager | not decided (ADR-005); defaults to the deployer wallet |

## Human blockers (in order)

1. Merge this branch into `main` (production still serves the old, unsafe contracts' UI; no factory was ever deployed, so no funds are at risk).
2. Provide the treasury address (public, can be shared in chat).
3. Create the bot and Mini App in BotFather; share the bot username and short name (public).
4. Enter `TELEGRAM_BOT_TOKEN` and `JWT_SECRET` into Vercel → Settings → Environment Variables (never in chat).
5. Decide the liquidity manager wallet and confirm LP is locked at graduation (ADR-005).
6. Create and fund a testnet deployer wallet; run the testnet gate locally (`docs/EXECUTION.md`).
7. Optional: enable Vercel Blob (image upload) and add `TONCENTER_API_KEY` to Vercel.
8. After the testnet gate: write "MAINNET GO-LIVE APPROVED", then run the launch (`docs/LAUNCH.md`).
9. Upload design mockups for the pixel pass.

## Remaining engineering work

| Item | Priority | Notes |
|---|---|---|
| Record testnet evidence | P0 | after blocker 6: addresses and tx hashes here and in VERIFICATION |
| Pagination past the ~100 most recent factory transactions in `/api/tokens` | P1 | fine at launch volume; needs an indexer or DB later (ADR-003) |
| Rate limit on `/api/metadata/upload` | P2 | SECURITY #13 |
| Bundle size (1.05 MB, mostly TON libraries) | P2 | code-split the trading pages |
| Independent contract audit | P1 before real volume | SECURITY #12 |
| Trustless on-chain STON.fi migration | V2 | ADR-005 |

## Verified at

Commit recorded by the commit that last changed this file; verification commands and counts in
`docs/VERIFICATION.md`. Re-run `/verify` before trusting this table on a later commit.
