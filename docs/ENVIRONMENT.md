# ENVIRONMENT.md — canonical variable list

Validate with `node scripts/validate-env.ts <profile> [--network]`. It prints PASS/FAIL per variable, never values,
and exits non-zero on any failure.

## Public client configuration (`VITE_*`, shipped to every browser)

| Variable | Example | Rule |
|---|---|---|
| `VITE_MANIFEST_URL` | `https://ton-launchpad-miniapp.vercel.app/tonconnect-manifest.json` | https, reachable, valid JSON |
| `VITE_TWA_RETURN_URL` | `https://t.me/<bot>/<app>` or `https://t.me/<bot>?startapp` (Main App) | https, `t.me`, real bot (ends in `bot`), and either a short name or `?startapp` |
| `VITE_FACTORY_ADDRESS` | factory address | valid TON address; `PENDING_DEPLOY` disables launches |
| `VITE_TONAPI_BASE` | `https://tonapi.io` | optional |
| `VITE_NETWORK` | `mainnet` | `mainnet` or `testnet` |
| `VITE_FACTORY_DEPLOY_PAGE` | unset | `on` serves `/deploy-factory`, the one-time wallet-approved mainnet factory deploy (ADR-011). Set it for Preview only; leave it unset in Production |

Never put a key, token, secret or mnemonic in a `VITE_*` variable. The validator and CI reject it.
`VITE_TONAPI_KEY` was removed: the browser uses TonAPI without a key.

## Server-only (Vercel runtime)

| Variable | Required | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | verifies Telegram `initData` |
| `JWT_SECRET` | yes | signs sessions; 64 hex chars (`openssl rand -hex 32`). Also keys the folder names of stored images (ADR-012), so a new secret restarts that day's image counts |
| `PLATFORM_TREASURY_ADDRESS` | yes | informational on the server; the on-chain value is fixed in the factory |
| `FACTORY_ADDRESS` | yes | must equal `VITE_FACTORY_ADDRESS`; the API only lists tokens from this factory |
| `TONCENTER_API_KEY` | yes in practice on mainnet production (`validate-env production` warns when it is missing but does not fail) | toncenter key for every chain read of `/api/tokens*`. Keyless toncenter allows about 1 request per second per IP, and Vercel's egress IPs are shared with other projects; a free key allows about 10. Without a key the API spaces its requests 1.1 s apart (120 ms with one) inside a 7 s budget per request: a token page with a balance needs 3-4 requests, and a token list refresh reads only about 5 known or 2 new tokens (about 46 or 22 with a key), so a fresh instance needs several refreshes to list every token. Under load, token pages and trade confirmations then answer 503 ("try again shortly") |
| `TON_NETWORK` | optional | overrides `VITE_NETWORK` for the API |
| `BLOB_READ_WRITE_TOKEN` | optional | set automatically when Vercel Blob is enabled; enables image upload. Set since 2026-11-19 (store `launchpad-token-images`, all environments) |
| `IMAGE_GENERATION` | optional | `on` switches the AI image generator on (ADR-012); it also needs `BLOB_READ_WRITE_TOKEN`. Anything else: off. Costs the platform money per image |
| `IMAGE_GEN_USER_DAILY_LIMIT` | optional | free images per Telegram user per UTC day, default 5 (0 to 100) |
| `IMAGE_GEN_GLOBAL_DAILY_LIMIT` | optional | free images for everyone per UTC day, default 50 (0 to 1000) |
| `IMAGE_GEN_MODELS` | optional | comma-separated AI Gateway model ids to offer, out of `meta/muse-image-1.0`, `spacexai/grok-imagine-image`, `openai/gpt-image-1-mini`, `google/gemini-2.5-flash-image`; default all four. A list with no known id switches the generator off |
| `AI_GATEWAY_API_KEY` | optional secret | only where the deployment's OIDC token is not available; on Vercel the function uses that token and no key is needed |
| `IMAGE_SELFTEST` | preview only | throwaway key (32+ characters) that opens `GET /api/image/selftest` on a preview; `off` or unset otherwise. Never set in Production |
| `TONAPI_KEY` | not used | reserved; no code reads it |

## Local deployment only (never in Vercel, never committed)

| Variable | Purpose |
|---|---|
| `DEPLOY_MNEMONIC` | 24-word seed of the dedicated deployer wallet; also the default liquidity manager (refund fallback) |
| `DEPLOY_WALLET_VERSION` | `v5r1` (default, Tonkeeper/Telegram Wallet) or `v4` |
| `LIQUIDITY_MANAGER_ADDRESS` | optional; defaults to the deployer wallet. Receives liquidity only if STON.fi refunds a graduation (ADR-009) |
| `STON_ROUTER_ADDRESS` | required for deploys: STON.fi v2 constant-product router for the network; fixed in the factory |
| `STON_PTON_MASTER_ADDRESS` | required on testnet (STON.fi has no testnet API; testnet v2.1 master `kQACS30DNoUQ7NfApPvzh7eBmSZ9L4ygJ-lkNWtba8TQT-Px`); ignored on mainnet, where the STON.fi API checks the router. On testnet the router's pTON wallet is asked from this master on-chain |
| `STON_PTON_WALLET_ADDRESS` | optional; must equal the wallet the pTON master reports for the router (mainnet default: read from the STON.fi API) |
| `KEEPER_MNEMONIC` | optional; wallet running `npm run graduate` if not the deployer |
| `MAINNET_GO_LIVE_APPROVED` | `yes` only after the founder's written approval |
| `STONFI_API_URL` | optional STON.fi API base for the keeper |
| `TONCENTER_API_KEY` | also used by deploy and keeper scripts; without it the scripts space requests about 1.1 s apart and retry HTTP 429 |

## Deployment

| Variable | Purpose |
|---|---|
| `VERCEL_PROD_URL` | used in launch script output |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Actions secrets for the optional CLI deploy |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (local) | optional in `.env.production`: link the Vercel CLI for `launch-production.sh` without `vercel link` |

## Profiles checked by the validator

| Profile | Checks |
|---|---|
| `deploy-testnet` | treasury (testnet-only addresses allowed), deploy mnemonic |
| `deploy-mainnet` | treasury (mainnet), deploy mnemonic, `MAINNET_GO_LIVE_APPROVED=yes` |
| `production` | bot token, JWT secret, treasury, both factory vars (equal), return URL, manifest URL, `VITE_NETWORK=mainnet`, no deploy mnemonic, no `VITE_FACTORY_DEPLOY_PAGE`, no secret-looking `VITE_*`; `--network` also fetches the manifest and its icon/terms/privacy URLs |
