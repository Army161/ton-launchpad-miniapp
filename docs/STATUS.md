# STATUS.md — current state

Updated: 2026-11-19 · Branch: `clawdbot-permanent` (GitHub default; `main` was merged into it by PR #3 and deleted. Vercel's production branch setting still names `main`, so a push or merge to `clawdbot-permanent` builds a preview and production is deployed explicitly)

**Overall: MAINNET LIVE, SMOKE TEST PASSED.** The testnet gate passed, the founder wrote "MAINNET GO-LIVE
APPROVED" on 2026-11-17 and deployed the factory `EQBJLEGjCAaZ7hLmW1LoJNa59nU6h4F56vhlk4s-4GKh9-55` from his wallet app on
2026-11-19. Production runs df7a7fa (PR #14 merged) pointed at that factory on mainnet. The founder's smoke test in Telegram passed on
2026-11-19 22:20 to 22:24 UTC: he uploaded an image, launched the test token TEST1, bought and sold, and the launch
and trade fees reached the treasury and the creator wallet (see "First mainnet launch" below). Image upload is live
in production since 2026-11-19 13:54 UTC and proven by that upload. The free AI image generator (ADR-012) is live in production since 2026-11-19 21:30 UTC,
with Grok and ChatGPT (GPT Image 1 Mini), on the founder's go-ahead; his first generated image in Telegram is the
remaining proof.

## Gates

| Gate | Status | Evidence |
|---|---|---|
| Build (app, API, scripts) | PASS | `npm run build` (2026-11-19 on 3efb51c, the image generator, and on e623b19, its review follow-up; before that e113ccf, 2026-11-17; again 2026-11-17 with the API read-path change on 933a165, and 2026-11-18 on 3df8aa4, on fae7421, on d41d543 and on PR #12's head 345365e; 2026-11-19 on 2ef6051 and on cc2436d) |
| Lint | PASS | `npm run lint` (0 errors, 5 warnings on 3efb51c and on e623b19, 2026-11-19; before that 0 errors, e113ccf; again with the API read-path change, and 2026-11-18 on 3df8aa4, fae7421, d41d543 and 345365e: 0 errors, 5 warnings; the same on 2ef6051 and cc2436d, 2026-11-19) |
| Contract compile | PASS | `cd contracts && npm run build`, wrappers in sync (2026-11-19 on 3efb51c and on e623b19; e113ccf; again 2026-11-18 in the `/verify` runs on 3df8aa4, fae7421, d41d543 and 345365e; 2026-11-19 on 2ef6051 and on cc2436d) |
| Contract tests | PASS | 96/96 on 3efb51c and on e623b19 (2026-11-19, contracts unchanged); 96/96 on 2ef6051 (2026-11-19: adds the two wallet-app deploy tests) and again on cc2436d; before that 94/94 sandbox and script tests against the compiled contracts (93 + the rehearsal-build suite, which runs after `npm run build:rehearsal`), incl. the ADR-010 router wallet guard; e113ccf, 2026-11-17; 93 passed + 1 skipped (no rehearsal build) in the `/verify` run of the API review follow-up on 3df8aa4, 2026-11-18; 94/94 in the `/verify` runs on fae7421, d41d543 and 345365e, 2026-11-18 |
| App/API tests | PASS | 235/235 vitest (2026-11-19 on e623b19: the image folder named by a keyed hash instead of the Telegram id, the request that crosses UTC midnight, the log line); 232/232 (2026-11-19 on 3efb51c: 36 new tests for the image generator, its daily limits and the upload checks); 196/196 (2026-11-19 on cc2436d: the deploy page's checks before every send, its single unresolved send, the exact router type and the STON.fi time limit); 192/192 (2026-11-19 on 2ef6051: the wallet-approved factory deploy and its production env rule); 178/178 (2026-11-18, PR #12 on 345365e: a launch whose reads keep failing waits at most a minute; 176/176 on d41d543: trading only on a live read, retry budget per instance, age limits on last-good data, the final review fixes, the code-review bot's fixes); 172/172 on fae7421; 136/136 on 3df8aa4 (list refresh coalesced and filled from the last read, short cache for a partial list, retryable errors in the client); 119/119 with the API read-path change on 933a165; 68/68 at e113ccf |
| Claude PR review on GitHub | READY, needs secret | `claude-code-review.yml` + `claude.yml`; founder adds `CLAUDE_CODE_OAUTH_TOKEN` (`docs/EXECUTION.md`) |
| GitHub Actions | PASS | "CI and deploy" green on 6638371 (2026-11-05); billing lock is gone |
| Security review | PASS with notes | `docs/SECURITY.md`: no open CRITICAL/HIGH in our code (2026-11-12: pool pre-seeding attack #20 fixed by ADR-010, needs testnet proof); dependency notes #18–19; no independent audit yet (#12) |
| Environment validation | READY, not run on real values | `scripts/validate-env.ts`; needs the founder's local `.env.*` |
| Live site | PASS | production deploy of 4a1392f (2026-11-19, `dpl_9Wm6GpBfYoFTDGj9Yg1DcyvKsNsH`, and again as `dpl_D3x9yK6MSjGMRSBMa93baErrkZst` with `TONCENTER_API_KEY` set); `/api/health` ok, `network: mainnet`, `factoryConfigured: true`, `telegramAuthConfigured: true`; `/api/tokens` 200 `{"configured":true,"tokens":[]}`; no runtime errors in the hour around the deploy. Redeployed 2026-11-19 13:54 UTC as `dpl_3AdMTQunjU2XfbTvkT6yLBpcviux` with Blob storage connected: `imageUploadConfigured: true`. Redeployed 2026-11-19 21:30 UTC as `dpl_6MEEZ3zPzFZHTiMEsEJqckF5pS7K` from df7a7fa (PR #14 merged) with the AI image generator on: `imageGenerationConfigured: true`, `/api/tokens` 200, no runtime errors in the hour around the deploy |
| Telegram validation | DONE | @TONLaunchpad_Bot Main App, menu button, return URL `https://t.me/TONLaunchpad_Bot?startapp` |
| Testnet deployment | PASS | factory `kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx` deployed 2026-11-14; it embeds STON.fi's broken testnet router, so redeploy if a working one appears. sell and refund checks passed 2026-11-17 |
| Mainnet deployment | PASS (factory and smoke test) | testnet gate PASS and "MAINNET GO-LIVE APPROVED" (2026-11-17). On 2026-11-19 the founder deployed the factory `EQBJLEGjCAaZ7hLmW1LoJNa59nU6h4F56vhlk4s-4GKh9-55` from his wallet app on `/deploy-factory` (ADR-011, `docs/EXECUTION.md` "Factory deploy from a wallet app"), because the mnemonic-in-a-file step could not be done safely (SECURITY #27); the page verified `get_factory_info` and the address equals the one computed from his wallet and the pinned treasury and router (`docs/VERIFICATION.md`). Vercel Production points at it and was redeployed. Smoke test PASS 2026-11-19 22:24 UTC: token TEST1 `EQCeZtdMKQQ11QO15H6P9bSPzcbk0ZJFBguzpI-pxXHt04sY` launched, bought and sold from the founder's wallet, fees paid as specified (`docs/VERIFICATION.md`) |
| TON Connect validation | BLOCKED_HUMAN | testnet factory exists; needs a Tonkeeper testnet wallet run (`docs/EXECUTION.md` 4-7). Also check that the wallet list shows Telegram's wallet once and that it connects (the stale hand-written "Wallet" entry, review finding TC-1, was removed) |
| Design pixel pass | DEFERRED | `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET` |

## Deployment facts

| Item | Value |
|---|---|
| Factory address (testnet) | `kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx` (2026-11-14) |
| Platform treasury (mainnet) | `UQBNwH67i7p23n2LYgEJtEEWp9p44HlqoDzZHBXm2mcUKyF3` (founder, 2026-11-17; valid mainnet basechain address) |
| STON.fi router (mainnet, pin) | `EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql` (v2.2 constant product, passed the mainnet-fork rehearsal) |
| Factory address (mainnet) | `EQBJLEGjCAaZ7hLmW1LoJNa59nU6h4F56vhlk4s-4GKh9-55` (deployed 2026-11-19 10:04 UTC from the owner wallet, transaction `e7d83327e5f39f15c8e9cfaf2220a7afb9886cd16bfc8067fc6f951c4ff4f9e9`) |
| Factory owner (mainnet) | `UQAilXDBqbF_t4Bd1qRJEqgLoJVXom6-LOIDkVYZt8lRkhCH` (the founder's wallet that approved the deploy) |
| Production URL | https://ton-launchpad-miniapp.vercel.app (deployed explicitly from `clawdbot-permanent`; pushes there build previews only, see the branch note above) |
| Bot | @TONLaunchpad_Bot (Main App) |
| Liquidity manager | refund fallback only (ADR-009); the deployer wallet (founder's choice, 2026-11-18), on mainnet the owner wallet above |
| STON.fi router | chosen at deploy (`STON_ROUTER_ADDRESS`); graduation seeds it on-chain |

## Human blockers (in order)

1. Done 2026-11-17: treasury address provided; "MAINNET GO-LIVE APPROVED" given 2026-11-17.
2. Testnet gate (2026-11-14): factory deployed and graduation steps 1-4 passed on testnet; STON.fi's testnet router is broken, so the pool leg ran on a mainnet fork (`npm run rehearse:fork`): PASS, pool created and LP burned on the real mainnet router code. Sell and refund checks passed 2026-11-17 (`npm run check:trades`, 10/10). Testnet gate PASS.
3. Add the `CLAUDE_CODE_OAUTH_TOKEN` repository secret so Claude reviews PRs on GitHub (`docs/EXECUTION.md`).
4. Done 2026-11-19: the founder added `TONCENTER_API_KEY` to Vercel (Production, stored as a sensitive value) and
   production was redeployed (`dpl_D3x9yK6MSjGMRSBMa93baErrkZst`). Without it the API read toncenter at about one
   request per second from shared Vercel IPs (`docs/ENVIRONMENT.md`). Done 2026-11-19: Vercel Blob is connected and
   image upload is live.
5. Optional, recommended before real volume: independent contract audit (SECURITY #12).
6. Done 2026-11-19: mainnet factory deployed from the founder's wallet app, and the smoke test in Telegram
   (@TONLaunchpad_Bot: image upload, launch of TEST1, a buy and a sell) passed at 22:24 UTC.
7. Upload design mockups for the pixel pass.
8. Done 2026-11-19: the founder chose "Yes, put it live" for the AI image generator (ADR-012). PR #14 is merged,
   Production has `IMAGE_GENERATION=on` and
   `IMAGE_GEN_MODELS=spacexai/grok-imagine-image,openai/gpt-image-1-mini`, the two models Vercel AI Gateway serves
   without paid credits, and production is redeployed. His first upload is done (2026-11-19, the TEST1 image). Open, as a separate check:
   his first AI-generated image in Telegram.
   Optional: buy AI Gateway credits in Vercel to add Meta AI and Gemini Nano Banana (then extend
   `IMAGE_GEN_MODELS`), and set an AI Gateway budget there as the hard spending stop (SECURITY #28).

## Remaining engineering work

| Item | Priority | Notes |
|---|---|---|
| Record the first official token | P1 | the smoke test (TEST1) is recorded (2026-11-19). When the founder launches QRECON, add its address and launch transaction here and in VERIFICATION. A buy that names a referrer has not been run on mainnet (the full-size sell was run on TEST1 at 22:37 UTC, see below) |
| Pagination past the ~100 most recent factory transactions in `/api/tokens` | P1 | fine at launch volume; needs an indexer or DB later (ADR-003) |
| `/api/tokens` reads the chain inside one 7 s budget per refresh | P1 | a refresh reads about 46 known or 22 new tokens with `TONCENTER_API_KEY` (about 5 or 2 without), never-read and stalest first, and shows the rest as last read, so successive refreshes cover the list (5 s apart while it is partial). The state is per Vercel instance: a fresh instance's first lists can be partial (`partial: true`, 5 s cache) past about 22 tokens with a key, or 2 without. An indexer removes the limit (ADR-003) |
| Rate limit per IP on `/api/tokens/*` | P1 | SECURITY #24: a Vercel Firewall rule, about 120 requests a minute per IP (the app polls at most every 3 s per tab). Each instance already stops retrying in a flood of failing lookups, but nothing bounds the total across instances, so a script can still use up the toncenter quota |
| Pending trades and launches survive leaving the page | P2 | review finding CLIENT-2: Buy, Sell and Create keep the unconfirmed operation in page state, so a page opened again starts idle and allows a second send (the wallet still asks for approval) and drops the "not confirmed yet" notice; Create still navigates to the token page after the user has left it. Keep pending operations in a store keyed by wallet and token |
| AI image generator live in production | P1 | built and checked on a preview (ADR-012); needs the founder's merge, the two Production variables and a production deploy; then one generated image from the Create page in Telegram as the live check. How many images AI Gateway's free tier allows is not known |
| Old test images in Blob | P3 | nothing deletes `selftest/` or unused `generated/` and `uploads/` files; about 50 kB per generated image against a 1 GB store |
| Bundle size (1.05 MB, mostly TON libraries) | P2 | code-split the trading pages |
| Independent contract audit | P1 before real volume | SECURITY #12 |
| Prove on-chain STON.fi graduation on testnet | P0 | ADR-009 built and sandbox-tested; needs a real pool with LP at the zero address |
| Short referral deep links (`startapp`, 64-char limit) | P1 | contract side done (ADR-008); needs launch id + referral code mapping in the API and the Buy page reading `start_param` |

## Verified at

2026-11-19, mainnet go-live: the founder approved one 0.1 TON transaction on `/deploy-factory` (preview of f59e51d)
and the page reported "The factory is deployed and its settings are verified on-chain" with factory
`EQBJLEGjCAaZ7hLmW1LoJNa59nU6h4F56vhlk4s-4GKh9-55`, owner and refund wallet
`UQAilXDBqbF_t4Bd1qRJEqgLoJVXom6-LOIDkVYZt8lRkhCH`, the recorded treasury and the pinned router. `planFactoryDeploy` run
locally for that owner with the pinned treasury, router and router pTON wallet gives exactly that address, and the
address is the hash of the contract code and its starting data, so the deployed code and settings are those of this
repository. A read-only check on the founder's PC (contracts rebuilt on 4a1392f, toncenter) reported the same
address, the account active, the deploy transaction `e7d83327e5f39f15c8e9cfaf2220a7afb9886cd16bfc8067fc6f951c4ff4f9e9` at 10:04:19 UTC with
exit code 0, and `get_factory_info`: that owner, treasury and liquidity manager, the pinned router and pTON wallet,
graduation at 1,500 TON, launch fee 0.05 TON, trade fee 2%, creator share 60%, referrer share 20%, 0 launches. The
cloud sandbox cannot reach toncenter, so the transaction and those getter values were not read a second time from
here. Vercel Production: `VITE_FACTORY_ADDRESS` and `FACTORY_ADDRESS` set to the factory,
`PLATFORM_TREASURY_ADDRESS` to the treasury, `VITE_NETWORK=mainnet`; production deployment
`dpl_9Wm6GpBfYoFTDGj9Yg1DcyvKsNsH` of `clawdbot-permanent` 4a1392f is READY and serves
https://ton-launchpad-miniapp.vercel.app. Read through Vercel at 10:08 UTC: `/api/health`
`{"ok":true,"network":"mainnet","factoryConfigured":true,"telegramAuthConfigured":true,"imageUploadConfigured":false}`,
`/api/tokens` 200 `{"configured":true,"tokens":[]}` (the API read the factory's transactions on mainnet and found no
launch yet), the app shell 200, no runtime errors. The client bundle's factory address was not read directly; the
smoke test shows it. `VITE_FACTORY_DEPLOY_PAGE` (Preview, branch `claude/project-thread-ri5mr2`) is set to `off`, so
new previews no longer serve the deploy page. Not yet done at that time: the smoke test in Telegram (passed 2026-11-19 22:24 UTC, see "First mainnet launch").

2026-11-19 10:23 UTC, toncenter key: the founder added `TONCENTER_API_KEY` in Vercel (Production only, sensitive; its
value was never read from here). Production was redeployed from `clawdbot-permanent` 4a1392f as
`dpl_D3x9yK6MSjGMRSBMa93baErrkZst` (READY, serves the production domain). On the new deployment `/api/tokens`
answered 200 `{"configured":true,"tokens":[]}` from a fresh instance, which it does only when the factory's
transactions were read from toncenter, so toncenter accepts the key; `/api/health` unchanged (mainnet, factory and
Telegram auth configured). The higher request limit itself was not load-tested.

2026-11-19, the wallet-approved factory deploy on 2ef6051 (on top of 4a1392f): contracts build, typecheck and 96/96
tests (rehearsal build present), wrappers in sync, lint 0 errors (the same 5 warnings), 192/192 app tests, build
(1,068 kB JS, gzip 316 kB, and the deploy page's own 266 kB chunk), bundle secret scan clean, no tracked env files.
Also run in a headless browser against the built app with a simulated Tonkeeper (injected TON Connect bridge) and
mocked toncenter and STON.fi answers: the wallet received one `sendTransaction` for mainnet (`-239`) with one message,
the bounceable factory address, `100000000` nanoTON, the state init whose hash is that address and no payload; the
page then showed "deployed and verified" only after `get_factory_info` matched. A wallet below 0.2 TON, a STON.fi
answer with pool creation off and a refusal in the wallet each stopped before anything was sent; with the STON.fi
API unreachable the page went on from the on-chain pTON check, as ADR-011 says. Not yet run against the real network.

2026-11-19, the review follow-up of that page on cc2436d: contracts build, typecheck and 96/96 tests, wrappers in
sync, lint 0 errors (the same 5 warnings), 196/196 app tests, build (1,068 kB JS, gzip 316 kB, and the deploy page's
268 kB chunk), bundle secret scan clean, no tracked env files. The headless-browser run with the simulated wallet
again: each tap on "Deploy the factory" asked toncenter and STON.fi once more before the wallet was asked, also on the
retry after a refusal; a STON.fi answer that turned to "pool creation off" between the first look and the tap stopped
with "Nothing was sent" and the wallet was never asked; after a send the wallet neither confirmed nor refused, "Check
again" and a reload both kept the page on "Do not send again" with no deploy button, and the button came back only
once the stored request was older than its `validUntil` plus two minutes. Still not run against the real network.

2026-11-18, PR #12 on 345365e (on top of d41d543): contracts build, typecheck and 94/94 tests, wrappers in sync, lint 0
errors (the same 5 warnings), 178/178 app tests, build (1,066 kB JS, gzip 315 kB), bundle secret scan clean, no
tracked env files. A launch whose reads failed twice or more in a row now waits behind the others for 15 s, doubling
up to one minute, instead of a whole round of re-reads: in a simulated rate-limit storm (40 tokens, 2 hours, 30 to
70% of toncenter requests answering 429) the share of partial lists is back to that of the order before d41d543, and
none with `TONCENTER_API_KEY`. The 30-minute limit on last-good data also applies when no token read could start.

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

2026-11-19 13:46 to 14:00 UTC, token images (ADR-012), on the founder's ask for a real upload and a free image
generator. Upload: a public Vercel Blob store `launchpad-token-images` (`store_kzWeuQRHga10Mm2c`, iad1) was created
and connected to the project, which set `BLOB_READ_WRITE_TOKEN` for all environments (its value was never read).
Production was redeployed from `clawdbot-permanent` 4a1392f as `dpl_3AdMTQunjU2XfbTvkT6yLBpcviux` (READY, serves the
production domain): `/api/health`
`{"ok":true,"network":"mainnet","factoryConfigured":true,"telegramAuthConfigured":true,"imageUploadConfigured":true}`,
`/api/tokens` 200. Production still runs the upload code of 4a1392f, without the daily limits and the file-type check
of 3efb51c (SECURITY #13 is fixed on the branch, not yet in production). No upload was made from here. Generator:
`/verify` passed on 3efb51c (96 contract tests, 232 app tests, lint 0 errors, build, bundle clean). On its preview
`dpl_CkDKvmHEHgcnDXSUfv8jGs5WiJ7b`, with `IMAGE_GENERATION=on` and a throwaway `IMAGE_SELFTEST` key set for this
branch's previews only, `GET /api/image/selftest` made one real image each with Grok Imagine (5.1 s) and GPT Image 1
Mini (12.7 s) through Vercel AI Gateway, authenticated by the deployment's OIDC token, re-encoded them with sharp to
15 kB and 39 kB JPEGs and stored them in Blob. Meta Muse and Gemini 2.5 Flash Image answered 403: the team is on AI
Gateway's free tier, which does not serve those two. The key was then set to `off`; the preview built while it was
set still answers to it, and the key is random and was discarded. `IMAGE_GEN_MODELS` on the branch's previews now
names the two working models. Not done from here: looking at the two test images (the sandbox cannot reach the Blob
host), a `POST /api/image/generate` with a Telegram session, and the Create page in Telegram.

Review follow-up, 2026-11-19 14:10 UTC (e623b19, `/verify` passed: 96 contract tests, 235 app tests, lint 0 errors,
build, bundle clean). The automatic review of PR #14 found that stored images were filed under the raw Telegram id,
which would have put that id into the public image address in a token's immutable metadata, next to the creator's
wallet (SECURITY #30). The folder is now a keyed hash of the id; the id is written only to the function log.
Production never ran the affected code (it stores uploads as `tokens/<uuid>`). The two self-test images of the
preview sit under `selftest/` and carry no id. The preview of 0eefa12 (`dpl_5kGZ5uoAN9XVmmCSmnSeUvNfjTMr`) was read
after this change: `/api/health` showed upload and generation configured, `GET /api/image/generate` listed Grok and
ChatGPT with a daily limit of 5, and the privacy page showed the new text. The keyed folder itself was not exercised
there (storing a file needs a Telegram session).

Go-live of the generator, 2026-11-19 21:30 UTC. The founder chose "Yes, put it live" at 21:26 UTC. PR #14 was merged
into `clawdbot-permanent` as df7a7fa; its tree is identical to 0eefa12, the head whose code `/verify` passed on
(e623b19) and whose checks were green on GitHub. Production got `IMAGE_GENERATION=on` and
`IMAGE_GEN_MODELS=spacexai/grok-imagine-image,openai/gpt-image-1-mini` (plain values, Production only) and was
deployed explicitly as `dpl_6MEEZ3zPzFZHTiMEsEJqckF5pS7K` (READY, serves the production domain). Read through Vercel
at 21:31 UTC: `/api/health`
`{"ok":true,"network":"mainnet","factoryConfigured":true,"telegramAuthConfigured":true,"imageUploadConfigured":true,"imageGenerationConfigured":true}`;
`GET /api/image/generate` lists Grok and ChatGPT with `userDailyLimit: 5` and `promptMax: 300`; `/api/tokens` 200
`{"configured":true,"tokens":[]}`; `/api/image/selftest` 404; no runtime errors in the last hour. Production has no
`VITE_FACTORY_DEPLOY_PAGE`, so the deploy page is not in its build. The upload limits and file-type check
(SECURITY #13) and the keyed image folder (SECURITY #30) are now in production too. Not done from here, and tracked as two separate
checks: an upload with a Telegram session (`POST /api/metadata/upload`; done by the founder at about 22:10 UTC, see
"First mainnet launch") and an AI-generated image with a Telegram session (`POST /api/image/generate`; still open). The size of AI Gateway's free allowance is not known; an AI Gateway budget in Vercel is
the hard spending stop (SECURITY #28).

First mainnet launch (smoke test), 2026-11-19 22:10 to 22:24 UTC, by the founder in Telegram with the owner wallet
`UQAilXDBqbF_t4Bd1qRJEqgLoJVXom6-LOIDkVYZt8lRkhCH`. Read at 22:25 UTC from the token's transactions on tonapi.io (all
three succeeded, exit code 0) and from production `/api/tokens`.
- Upload: his first try with a logo file over 2 MB was refused in the app ("Image max 2MB") and stored nothing. A
  512 px PNG (0.44 MB) uploaded; the stored address is `uploads/2026-11-19/<24 hex characters>/<uuid>.png`, the keyed
  folder of SECURITY #30, with no Telegram id in it.
- Launch, 22:20:21 UTC, `638fe7c27b396ab8cdbf7fd221cc496f3c4a4910e4c076d6cd9db728c58fbaa9`: token TEST1
  `EQCeZtdMKQQ11QO15H6P9bSPzcbk0ZJFBguzpI-pxXHt04sY` created by the factory; 0.05 TON "Launch fee" to the treasury
  `UQBNwH67i7p23n2LYgEJtEEWp9p44HlqoDzZHBXm2mcUKyF3`; 0.0937 TON of unused network fee back to the creator. The API
  lists it with the creator wallet, the uploaded image and the pinned STON.fi router.
- Buy of 0.1 TON, 22:23:02 UTC, `6d17d1f23b24fd6bd8788de092ee325d389adcde34b595b05b2090e30f1eef1c`: 0.0012 TON
  "Creator fee" to the creator wallet and 0.0008 TON "Platform fee" to the treasury (2% split 60/40);
  3,256,030.301016678 TEST1 minted to the buyer; 0.098 TON entered the curve.
- Sell, 22:24:02 UTC, `0cb1f10b460ab47b66a89ea9db8f2c2ccc87feb5bdbee623e6e681a7cc7da070`: the founder entered 0.1 in
  the sell box, which counts tokens, so 0.1 TEST1 was burned for 3 nanoTON gross; 1 nanoTON "Platform fee" to the
  treasury and "Sell proceeds" (2 nanoTON plus the unused network fee, 0.0978 TON in all) to the seller.
- State afterwards: `realTonRaised` 97,999,997 nanoTON, `totalSupply` 3,256,030.201016678 TEST1, `tradeCount` 2.
  Tonkeeper lists TEST1 among the wallet's tokens with its "unverified token" label, as it does for any new jetton.
- Full-size sell, 22:37:49 UTC (Sell, then Max): the wallet's transaction
  `ba8dcd7d89549782ab74f67eb2fb92a011b9eb6311ddff0fb0148b1d0c6d4a03` burned all 3,256,030.201016678 TEST1 with the
  SELL payload and 0.1 TON attached. The minter paid 1,176,000 nanoTON "Creator fee" to the creator
  (`6026f8954e5188bb20ebffef64b64ba58ea578255a8f03132fe38e2465385e86`), 784,000 "Platform fee" to the treasury
  (`bd68863cb6f85d001cf1501f2828835cff677ba2c97ba6a89e273f0f18cab6e1`) and 193,631,061 "Sell proceeds" to the seller
  (`890f2f1bb0079c02eebc3938e474705306e0ca23f561a1347ad2f919ef26e66a`; 96,039,996 for the tokens plus the unused
  network fee). The fees are 2% of the 97,999,996 nanoTON gross, split 60/40. State afterwards from production
  `/api/tokens`: `realTonRaised` 1 nanoTON, `totalSupply` 0, `tradeCount` 3. The hashes are the receiving accounts'
  transactions, read from tonapi.io at 22:39 UTC; tonapi's page for the minter itself had not yet indexed the trade.
- Not covered: a buy that names a referrer, graduation on mainnet, and an AI-generated image.
