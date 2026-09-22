# EXECUTION.md — runbooks

All commands run from the repo root unless noted. Secrets come from a local, ignored `.env.production` or `.env.testnet`:

```bash
cp .env.example .env.testnet      # fill locally; never commit, never paste into chat
set -a && source .env.testnet && set +a
```

## Local development

```bash
npm ci && (cd contracts && npm ci --legacy-peer-deps)
npm run dev          # UI only (API calls fail safe)
npx vercel dev       # UI + /api
```

## Full verification (`/verify`)

```bash
(cd contracts && npm run build && npm run typecheck && npm test)
git diff --exit-code -- src/contracts            # wrappers in sync
npm run lint && npm test && npm run build
```

## Testnet gate (Phase 7)

Needs: a testnet deployer wallet (Tonkeeper → Settings → Dev mode → Testnet), funded from
[@testgiver_ton_bot](https://t.me/testgiver_ton_bot) with ~5 TON, and a testnet treasury address.

1. `node scripts/validate-env.ts deploy-testnet`
2. `cd contracts && npm run deploy:testnet -- --dry-run` → check the printed deployer address matches the funded wallet.
   If it does not, set `DEPLOY_WALLET_VERSION=v4` and retry.
3. `npm run deploy:testnet` → note the factory address (also in `contracts/deployed.testnet.json`).
4. Run the app against testnet: `VITE_NETWORK=testnet VITE_FACTORY_ADDRESS=<factory> FACTORY_ADDRESS=<factory> npx vercel dev`
   (or a Vercel preview with those variables).
5. With a Tonkeeper testnet wallet: create a token with a 0.5 TON initial buy, buy 0.2 TON, sell half, sell the rest.
6. On https://testnet.tonviewer.com check for each trade: creator got 1.2% and treasury 0.8% of the TON side;
   the curve balance never dropped below its reserve; the seller received TON.
7. Try a sell with too little TON attached and a buy with a stale quote (edit amount after quote): both must refund.
8. Record factory, token and transaction hashes in `docs/STATUS.md` and mark rows in `docs/VERIFICATION.md`.

Any failure → stop, fix, re-run the whole gate.

## Mainnet (Phase 8–10) — only after "MAINNET GO-LIVE APPROVED"

```bash
set -a && source .env.production && set +a
MAINNET_GO_LIVE_APPROVED=yes ./scripts/launch-production.sh
```

The script validates configuration, rebuilds and tests contracts, deploys or re-verifies the factory, validates the
runtime configuration (including the live manifest), writes Vercel variables with `--force` and deploys. Re-running it
is safe. See `docs/LAUNCH.md` for the founder's steps and the smoke test.

## Graduation keeper

```bash
cd contracts
npm run graduate -- mainnet <tokenAddress>                    # plan only
MAINNET_GO_LIVE_APPROVED=yes npm run graduate -- mainnet <tokenAddress> --execute
MAINNET_GO_LIVE_APPROVED=yes npm run graduate -- mainnet --lock-lp --pool=<pool> --execute
```

## Production checks (`/production-check`)

```bash
curl -fsS https://ton-launchpad-miniapp.vercel.app/api/health
node scripts/validate-env.ts production --network     # with production values loaded
curl -fsS https://ton-launchpad-miniapp.vercel.app/api/tokens | head -c 400
```
