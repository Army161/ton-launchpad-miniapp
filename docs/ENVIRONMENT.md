# ENVIRONMENT.md — canonical variable list

Validate with `node scripts/validate-env.ts <profile> [--network]`. It prints PASS/FAIL per variable, never values,
and exits non-zero on any failure.

## Public client configuration (`VITE_*`, shipped to every browser)

| Variable | Example | Rule |
|---|---|---|
| `VITE_MANIFEST_URL` | `https://ton-launchpad-miniapp.vercel.app/tonconnect-manifest.json` | https, reachable, valid JSON |
| `VITE_TWA_RETURN_URL` | `https://t.me/<bot>/<app>` | https, `t.me`, real bot (ends in `bot`) and short name |
| `VITE_FACTORY_ADDRESS` | factory address | valid TON address; `PENDING_DEPLOY` disables launches |
| `VITE_TONAPI_BASE` | `https://tonapi.io` | optional |
| `VITE_NETWORK` | `mainnet` | `mainnet` or `testnet` |

Never put a key, token, secret or mnemonic in a `VITE_*` variable. The validator and CI reject it.
`VITE_TONAPI_KEY` was removed: the browser uses TonAPI without a key.

## Server-only (Vercel runtime)

| Variable | Required | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | verifies Telegram `initData` |
| `JWT_SECRET` | yes | signs sessions; 64 hex chars (`openssl rand -hex 32`) |
| `PLATFORM_TREASURY_ADDRESS` | yes | informational on the server; the on-chain value is fixed in the factory |
| `FACTORY_ADDRESS` | yes | must equal `VITE_FACTORY_ADDRESS`; the API only lists tokens from this factory |
| `TONCENTER_API_KEY` | recommended | raises toncenter rate limits for `/api/tokens` |
| `TON_NETWORK` | optional | overrides `VITE_NETWORK` for the API |
| `BLOB_READ_WRITE_TOKEN` | optional | set automatically when Vercel Blob is enabled; enables image upload |
| `TONAPI_KEY` | not used | reserved; no code reads it |

## Local deployment only (never in Vercel, never committed)

| Variable | Purpose |
|---|---|
| `DEPLOY_MNEMONIC` | 24-word seed of the dedicated deployer wallet; also the default liquidity manager / keeper |
| `DEPLOY_WALLET_VERSION` | `v5r1` (default, Tonkeeper/Telegram Wallet) or `v4` |
| `LIQUIDITY_MANAGER_ADDRESS` | optional; defaults to the deployer wallet |
| `KEEPER_MNEMONIC` | optional; wallet running `npm run graduate` if not the deployer |
| `MAINNET_GO_LIVE_APPROVED` | `yes` only after the founder's written approval |
| `STONFI_API_URL` | optional STON.fi API base for the keeper |
| `TONCENTER_API_KEY` | also used by deploy and keeper scripts |

## Deployment

| Variable | Purpose |
|---|---|
| `VERCEL_PROD_URL` | used in launch script output |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Actions secrets for the optional CLI deploy |

## Profiles checked by the validator

| Profile | Checks |
|---|---|
| `deploy-testnet` | treasury (testnet-only addresses allowed), deploy mnemonic |
| `deploy-mainnet` | treasury (mainnet), deploy mnemonic, `MAINNET_GO_LIVE_APPROVED=yes` |
| `production` | bot token, JWT secret, treasury, both factory vars (equal), return URL, manifest URL, `VITE_NETWORK=mainnet`, no deploy mnemonic, no secret-looking `VITE_*`; `--network` also fetches the manifest and its icon/terms/privacy URLs |
