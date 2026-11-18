# STATUS.md — current state

Updated: 2026-11-18 · Branch: `clawdbot-permanent` (GitHub default; `main` was merged into it by PR #3 and deleted. Vercel's production branch setting still names `main`, so a push or merge to `clawdbot-permanent` builds a preview and production is deployed explicitly)

**Overall: MAINNET DEPLOY IN PROGRESS.** The testnet gate passed and the founder wrote "MAINNET GO-LIVE APPROVED" on
2026-11-17. The live site runs 682021b with launches disabled (`VITE_FACTORY_ADDRESS=PENDING_DEPLOY`). What remains is
the founder's factory deploy from their own wallet, pointing Vercel at the factory, and the Telegram smoke test.

## Gates

| Gate | Status | Evidence |
|---|---|---|
| Build (app, API, scripts) | PASS | `npm run build` (e113ccf, 2026-11-17; again 2026-11-17 with the API read-path change on 933a165, and 2026-11-18 on 3df8aa4, on fae7421 and on PR #12's head d41d543) |
| Lint | PASS | `npm run lint` (0 errors, e113ccf; again with the API read-path change, and 2026-11-18 on 3df8aa4, fae7421 and d41d543: 0 errors, 5 warnings) |
| Contract compile | PASS | `cd contracts && npm run build`, wrappers in sync (e113ccf; again 2026-11-18 in the `/verify` runs on 3df8aa4, fae7421 and d41d543) |
| Contract tests | PASS | 94/94 sandbox and script tests against the compiled contracts (93 + the rehearsal-build suite, which runs after `npm run build:rehearsal`), incl. the ADR-010 router wallet guard; e113ccf, 2026-11-17; 93 passed + 1 skipped (no rehearsal build) in the `/verify` run of the API review follow-up on 3df8aa4, 2026-11-18; 94/94 in the `/verify` runs on fae7421 and d41d543, 2026-11-18 |
| App/API tests | PASS | 176/176 vitest (2026-11-18, PR #12 on d41d543: trading only on a live read, retry budget per instance, age limits on last-good data, the final review fixes, the code-review bot's fixes); 172/172 on fae7421; 136/136 on 3df8aa4 (list refresh coalesced and filled from the last read, short cache for a partial list, retryable errors in the client); 119/119 with the API read-path change on 933a165; 68/68 at e113ccf |
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
| Production URL | https://ton-launchpad-miniapp.vercel.app (deployed explicitly from `clawdbot-permanent`; pushes there build previews only, see the branch note above) |
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
| `/api/tokens` reads the chain inside one 7 s budget per refresh | P1 | a refresh reads about 46 known or 22 new tokens with `TONCENTER_API_KEY` (about 5 or 2 without), never-read and stalest first, and shows the rest as last read, so successive refreshes cover the list (5 s apart while it is partial). The state is per Vercel instance: a fresh instance's first lists can be partial (`partial: true`, 5 s cache) past about 22 tokens with a key, or 2 without. An indexer removes the limit (ADR-003) |
| Rate limit per IP on `/api/tokens/*` | P1 | SECURITY #24: a Vercel Firewall rule, about 120 requests a minute per IP (the app polls at most every 3 s per tab). Each instance already stops retrying in a flood of failing lookups, but nothing bounds the total across instances, so a script can still use up the toncenter quota |
| Pending trades and launches survive leaving the page | P2 | review finding CLIENT-2: Buy, Sell and Create keep the unconfirmed operation in page state, so a page opened again starts idle and allows a second send (the wallet still asks for approval) and drops the "not confirmed yet" notice; Create still navigates to the token page after the user has left it. Keep pending operations in a store keyed by wallet and token |
| Rate limit on `/api/metadata/upload` | P2 | SECURITY #13 |
| Bundle size (1.05 MB, mostly TON libraries) | P2 | code-split the trading pages |
| Independent contract audit | P1 before real volume | SECURITY #12 |
| Prove on-chain STON.fi graduation on testnet | P0 | ADR-009 built and sandbox-tested; needs a real pool with LP at the zero address |
| Short referral deep links (`startapp`, 64-char limit) | P1 | contract side done (ADR-008); needs launch id + referral code mapping in the API and the Buy page reading `start_param` |

## Verified at

2026-11-18, PR #12 on d41d543 (on top of fae7421 and its docs commits: the code-review bot's three comments on
098664f): contracts build, typecheck and 94/94 tests (rehearsal build present), wrappers in sync, lint 0 errors (the
same 5 warnings), 176/176 app tests, build (1,066 kB JS, gzip 315 kB), bundle secret scan clean, no tracked env
files. A launch whose reads keep failing takes its turn after two failed reads in a row instead of going first in
every refresh; every token list and token lookup request is aborted after 15 s, so a stalled one cannot hold a page
or a confirmation wait; a call from an earlier visit stays ignored after the page comes back to that token and
wallet.

2026-11-18, PR #12 on fae7421 (on top of 3df8aa4: the token list cached and filled from the last read and retryable
errors in the app, 5e17756; the env validator's mnemonic fix, 1eea118; trading only on a live read, one retry budget
per instance and age limits on last-good data, b38dd9a; refresh-progress tests, 098664f; the last independent
review's findings FE-1 and API-1 to API-3, fae7421): contracts build, typecheck and 94/94 tests (rehearsal build
present), wrappers in sync, lint 0 errors (the same 5 warnings), 172/172 app tests, build (1,065 kB JS, gzip 315 kB),
bundle secret scan clean, no tracked env files. Sell now also needs the balance its live read returned; a retry the
session has no time left to start gives its credit back; a launch read as not deployed only in its first minute is
read first again; the 30-minute limit on showing a token as last read applies only once a read of the refresh failed.

2026-11-18, review follow-up on 3df8aa4 (review findings server-R1/R2/R3, client-UX-1 to UX-5, tests-docs-CACHE-1 and
TEST-1): lint 0 errors (same 5 warnings as before), 136/136 app tests (new: `tests/chain-session.test.ts`; two runs hit the env validator
flake, since fixed in 1eea118, and passed on rerun), build,
bundle secret scan clean, no tracked env files. Contracts untouched; the `/verify` contract run passed (93 passed, 1
skipped without the rehearsal build) and left `src/contracts` unchanged. `/api/tokens` now runs one refresh
at a time per instance, reads `get_jetton_data` once per token, shows a token whose read fails as last read, leaves
out (and marks `partial`) only tokens never read, caches that for 5 s instead of not at all, serves the last list when
the factory's transactions cannot be read, and caches for 5 s while a launch of the last minute is still deploying.
`/api/tokens/:address` returns the token without a balance when only the balance read fails. Home and My Tokens show
a retryable error instead of "No launchpad tokens yet"; token pages retry a failed lookup and offer Try again; Buy and
Sell keep an on-page notice after a confirmation timeout; an unconfirmed launch no longer promises that the page will
load by itself. `validate-env production` warns when `TONCENTER_API_KEY` is missing. A virtual-clock run of the real
handlers (one 10 rps key, 10 tokens, 2 Home loads per second, one trader polling every 3 s) served 229 of 259 loads
from memory and offered toncenter 1.7 requests/s, with no 503 among 40 polls; the previous version served none from
memory, offered 52.0 requests/s and answered 26 of 40 polls with 503.

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
