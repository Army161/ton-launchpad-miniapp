# LAUNCH.md — founder go-live guide

Do these in order. Nothing here asks you to send a secret to anyone: secrets go only into a local file on your
machine or into Vercel's secret fields. Public values (addresses, bot username, short name) are fine to share.

## 1. Decide and create (no code)

| Item | Public? | How |
|---|---|---|
| Treasury address (receives the 0.05 TON launch fee and 40% of trade fees) | yes | any wallet you control; a hardware or multisig wallet is best |
| Liquidity manager (receives graduated liquidity until the STON.fi pool is seeded) | yes | default: the deployer wallet. See ADR-005 in `docs/DECISIONS.md` |
| Bot username and Mini App short name | yes | BotFather: `/newbot`, then `/newapp` with URL `https://ton-launchpad-miniapp.vercel.app` |
| Deployer wallet | the address is | a **new** wallet used only for deploys; W5 (Tonkeeper default) or v4 |

## 2. Secrets (never in chat, never in git)

- Human action required: Enter `TELEGRAM_BOT_TOKEN` into Vercel → Project → Settings → Environment Variables (Production). Do not send the value to anyone.
- Human action required: Enter `JWT_SECRET` (generate with `openssl rand -hex 32`) into the same Vercel screen.
- Human action required: Enter `DEPLOY_MNEMONIC` into your local `.env.testnet` / `.env.production` only. Never into Vercel.
- Optional: `TONCENTER_API_KEY` (from @tonapibot) into Vercel and your local file; enable Vercel Blob (Storage → Blob) for image uploads.

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

## 5. BotFather

```
/myapps → your app → Edit Web App URL → https://ton-launchpad-miniapp.vercel.app
/setmenubutton → your bot → same URL
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

Run the keeper from the liquidity manager wallet (`docs/EXECUTION.md` → "Graduation keeper"): it calls `Migrate`,
seeds the STON.fi pool and then, with `--lock-lp`, sends the LP tokens to the zero address.

## Custom domain (later)

See `docs/CLOUDFLARE.md`. After switching, update `public/tonconnect-manifest.json` and `VITE_MANIFEST_URL`.
