# LAUNCH.md — founder go-live guide

Do these in order. Nothing here asks you to send a secret to anyone: secrets go only into a local file on your
machine or into Vercel's secret fields. Public values (addresses, bot username, short name) are fine to share.

## 1. Decide and create (no code)

| Item | Public? | How |
|---|---|---|
| Treasury address (receives the 0.05 TON launch fee and 40% of trade fees) | yes | any wallet you control; a hardware or multisig wallet is best |
| Liquidity manager (receives graduated liquidity only if STON.fi refunds a provision) | yes | default: the deployer wallet. See ADR-009 in `docs/DECISIONS.md` |
| STON.fi v2 router (`STON_ROUTER_ADDRESS`) | yes | public; from the STON.fi API for each network; fixed in the factory |
| Bot username and Mini App link | yes | BotFather: `/newbot`, then either set the bot's Main App (link `https://t.me/<bot>?startapp`) or `/newapp` with a short name (link `https://t.me/<bot>/<app>`); URL `https://ton-launchpad-miniapp.vercel.app` |
| Deployer wallet | the address is | a **new** wallet used only for deploys; W5 (Tonkeeper default) or v4 |

## 2. Secrets (never in chat, never in git)

- Human action required: Enter `TELEGRAM_BOT_TOKEN` into Vercel → Project → Settings → Environment Variables (Production). Do not send the value to anyone.
- Human action required: Enter `JWT_SECRET` (generate with `openssl rand -hex 32`) into the same Vercel screen.
- Human action required: Enter `DEPLOY_MNEMONIC` into your local `.env.testnet` / `.env.production` only. Never into Vercel.
- Needed for mainnet traffic: `TONCENTER_API_KEY` (free, from @tonapibot) into Vercel (Production) and your local file. Without it the API reads the chain at about one request per second from Vercel's shared IPs, and token pages and trade confirmations answer "try again shortly" under load (`docs/ENVIRONMENT.md`). The production check in step 4 of the launch script prints `WARN TONCENTER_API_KEY` when your local file lacks it.
- Optional: enable Vercel Blob (Storage → Blob) for image uploads.

```bash
cp .env.example .env.testnet        # and later .env.production; both are gitignored
```

## 3. Testnet gate (required before mainnet)

Follow `docs/EXECUTION.md` → "Testnet gate". Short version:

```bash
set -a && source .env.testnet && set +a
node scripts/validate-env.ts deploy-testnet
cd contracts && npm ci --legacy-peer-deps && npm run deploy:testnet -- --dry-run && npm run deploy:testnet
```

Then create, buy and sell a token on testnet in Tonkeeper and check the fee payments on testnet.tonviewer.com.
Send the factory address and transaction links (public) so they can be recorded in `docs/STATUS.md`.

## 4. Mainnet (only after the testnet gate)

Write **"MAINNET GO-LIVE APPROVED"** in the project. Then, on your machine, with ~0.5 TON in the deployer wallet:

```bash
set -a && source .env.production && set +a
MAINNET_GO_LIVE_APPROVED=yes ./scripts/launch-production.sh
```

The script refuses to run without the approval flag, validates everything, rebuilds and tests the contracts, deploys
(or re-verifies) the factory, sets Vercel variables and deploys production. Re-running it is safe.

Before running it, log the Vercel CLI in and link it to the project: `vercel login`, then
`vercel link --project ton-launchpad-miniapp`, or put `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (IDs, not secrets) in
`.env.production`. With the CLI installed, step 1 stops before any TON is spent if the CLI cannot reach the project,
if `.vercelignore` does not list `.env.*` (it keeps `.env.production` out of the upload) or if tracked files have local
changes. Without the CLI nothing is uploaded: the script deploys the factory and prints the variables to set in the
dashboard. On Windows, a checkout made before `.gitattributes` existed may still have CRLF scripts that bash cannot
run: `sed -i 's/\r$//' $(git ls-files '*.sh')` strips the carriage returns from the tracked scripts only.

Alternative without the Vercel CLI: in `contracts/`, run `MAINNET_GO_LIVE_APPROVED=yes npm run deploy:mainnet` with
`.env.production` sourced, then in Vercel → Project → Settings → Environment Variables (Production) set
`FACTORY_ADDRESS` and `VITE_FACTORY_ADDRESS` to the printed factory and `PLATFORM_TREASURY_ADDRESS`, check
`VITE_NETWORK=mainnet`, and redeploy production. The bot token and JWT secret already in Vercel stay as they are.

Alternative without a recovery phrase in any file: deploy the factory from your wallet app. Open the
`/deploy-factory` link Claude sends, connect the wallet that will own the factory (at least 0.2 TON in it), tap
"Deploy the factory" and approve the 0.1 TON transaction in the wallet. The page verifies the factory on-chain and
shows its address; send that address to Claude, who sets the Vercel variables and deploys production
(`docs/EXECUTION.md`, "Factory deploy from a wallet app"). Never type or send your recovery phrase to anyone.

## 5. BotFather

```
Main App (link https://t.me/<bot>?startapp):
/mybots → your bot → Bot Settings → Configure Mini App → URL https://ton-launchpad-miniapp.vercel.app
Named app from /newapp (link https://t.me/<bot>/<app>):
/myapps → your app → Edit Web App URL → https://ton-launchpad-miniapp.vercel.app
Both: /setmenubutton → your bot → same URL
```

## 6. Smoke test (smallest amounts)

- [ ] Open the bot → Mini App loads, Telegram profile shows (auth works)
- [ ] Connect Tonkeeper and Telegram Wallet; closing and reopening keeps the session
- [ ] Create a token with no initial buy (≈0.2 TON attached; unused gas is refunded) → token page opens
- [ ] Buy 0.05 TON → balance appears; treasury and creator wallets received their fee shares
- [ ] Sell all → TON arrives, balance 0
- [ ] `/api/health` shows `factoryConfigured` and `telegramAuthConfigured` true; `/production-check` passes
- [ ] Graduated tab shows STON.fi tokens

## 7. At graduation (1,500 TON raised)

Anyone sends `Migrate` (`docs/EXECUTION.md` → "Graduation trigger"); the token contract seeds the STON.fi pool and
the LP goes to the zero address. Check on tonviewer that the pool exists and the LP holder is the zero address.

## Custom domain (later)

See `docs/CLOUDFLARE.md`. After switching, update `public/tonconnect-manifest.json` and `VITE_MANIFEST_URL`.
