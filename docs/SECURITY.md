# SECURITY.md — threats, controls and findings

## Secrets

| Secret | Lives in | Never in |
|---|---|---|
| `DEPLOY_MNEMONIC` / `KEEPER_MNEMONIC` | founder's machine (`.env.production`, ignored) | git, Vercel, chat, docs, logs |
| `TELEGRAM_BOT_TOKEN`, `JWT_SECRET` | Vercel (server), local `.env.production` | `VITE_*`, git, chat |
| `TONCENTER_API_KEY`, `BLOB_READ_WRITE_TOKEN` | Vercel (server) | `VITE_*`, git |

Controls: `.gitignore` ignores `.env.*` except the template; CI fails on tracked env files and on server variable
names in the client bundle; the env validator never prints values; the launch script passes secrets to the Vercel
CLI on stdin and never uses `set -x`. History scan (2026-09-22): only placeholders were ever committed; no credential
needs rotation.

## Security review — 2026-09-22

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | CRITICAL | Buy refunded the curve's whole balance to each buyer | FIXED (ADR-002; test "keeps the reserve…") |
| 2 | CRITICAL | Sell accepted a forged transfer notification from any sender | FIXED (burn from verified wallet; tests "forged burn notification…") |
| 3 | CRITICAL | No jetton wallet; buyers never received tokens | FIXED (TEP-74 wallet; sellability tests) |
| 4 | HIGH | Sell page sent 0.05 TON with no payload and reported success | FIXED (real burn, confirmation polling) |
| 5 | HIGH | Create registered fake `pending_*` addresses; anyone with a JWT could register any token | FIXED (registry removed; chain-verified listing) |
| 6 | MEDIUM | `.env.production` not gitignored | FIXED |
| 7 | MEDIUM | JWT and initData compared with `!==`; no future-date check; no header pinning | FIXED (timing-safe, pinned header, tests) |
| 8 | MEDIUM | JSON-file store on Vercel `/tmp` (lost on cold start) | FIXED (removed, ADR-003) |
| 9 | MEDIUM | `VITE_TONAPI_KEY` exposed a key to browsers | FIXED (removed) |
| 10 | MEDIUM | Launch script: `add \|\| rm && add` precedence bug; repeated runs failed or duplicated | FIXED (rewritten, idempotent) |
| 11 | MEDIUM | Graduated liquidity is held by the liquidity manager until the keeper seeds STON.fi | ACCEPTED for V1, needs founder sign-off (ADR-005) |
| 12 | MEDIUM | Contracts have not had an independent audit | OPEN — recommended before mainnet with real volume |
| 13 | LOW | Upload endpoint has no per-user rate limit (Blob storage cost) | OPEN |
| 14 | LOW | JWT kept in `localStorage` (XSS exposure; token only authorizes image upload) | ACCEPTED |
| 15 | LOW | A mint that bounces (only possible if gas budgets are wrong) leaves supply counted but undelivered | ACCEPTED; gas budgets tested |
| 16 | INFO | Dev-only advisories in `@vercel/node` (types only) and polyfill plugin deps (not bundled); runtime deps: 0 | ACCEPTED |
| 17 | INFO | Contract toolchain pulled protobufjs 6 (critical advisory) | FIXED (override to 7.6.6, output byte-identical) |

No unresolved CRITICAL or HIGH findings. Finding 12 is a risk the founder should weigh before mainnet.

## Access control (all covered by sandbox tests)

- Only the factory can set up a jetton; only once.
- Only a holder's own wallet can burn/transfer its jettons; only the minter or a sibling wallet can credit a wallet.
- Only a burn notification from the wallet derived for `(sender, minter)` can release TON.
- Treasury and liquidity manager are immutable per token; no message changes them.
- `Migrate` is permissionless but only after graduation, only once, and only to the fixed liquidity manager.
- Factory owner can only withdraw TON stranded in the factory by bounced deploys; user reserves never sit there.
