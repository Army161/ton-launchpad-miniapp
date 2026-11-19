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
2. `cd contracts && npm run deploy:testnet -- --dry-run --env-file ../.env.testnet` (contract scripts load the file with `--env-file`; the path is relative to `contracts/`) → check the printed deployer address matches the funded wallet.
   If it does not, set `DEPLOY_WALLET_VERSION=v4` and retry.
3. `npm run deploy:testnet` → note the factory address (also in `contracts/deployed.testnet.json`).
4. Run the app against testnet: `VITE_NETWORK=testnet VITE_FACTORY_ADDRESS=<factory> FACTORY_ADDRESS=<factory> npx vercel dev`
   (or a Vercel preview with those variables).
5. With a Tonkeeper testnet wallet: create a token with a 0.5 TON initial buy, buy 0.2 TON, sell half, sell the rest.
6. On https://testnet.tonviewer.com check for each trade: creator got 1.2% and treasury 0.8% of the TON side;
   the curve balance never dropped below its reserve; the seller received TON.
7. Try a sell with too little TON attached and a buy with a stale quote (edit amount after quote): both must refund.
   Steps 5-7 without the app: `cd contracts && npm run check:trades -- --env-file ../.env.testnet` launches a token on
   the deployed testnet factory, buys 0.2 TON, checks the 1.2% / 0.8% fee payments, sells half, tries both refunds and
   sells the rest (about 0.3 faucet TON, most returned). PASS = every line prints PASS.
8. Graduation rehearsal (ADR-009): a 1,500 TON graduation cannot be bought with faucet TON, so a testnet-only
   build graduates at 1.5 TON. With ~3 TON in the deployer and `STON_ROUTER_ADDRESS` set to the STON.fi testnet v2
   router and `STON_PTON_MASTER_ADDRESS` set to its pTON master (STON.fi has no testnet API; values in `.env.example`):
   `cd contracts && npm run rehearse:graduation -- --execute --env-file ../.env.testnet`. It deploys a rehearsal factory, launches a token,
   buys past the target, sends `Migrate` and prints the pool and the zero-address LP wallet. PASS = the pool shows
   both reserves and the LP sits at the zero address. The rehearsal factory is never used by the app.
   `REHEARSAL_TARGET_TON=1` makes it fit in one 2 TON faucet drip (about 1.7 TON).
   Known limit (2026-11-14): STON.fi's published testnet router (CPI v2.1.0, `kQALh-…Wk0v`) aborts every call with
   exit 9 because its library code is missing on testnet, so steps 1-4 pass but no pool can appear. Run 8b for the pool leg.
8b. Pool leg on a mainnet fork (no TON spent, nothing signed): `cd contracts && npm run rehearse:fork`. It runs the
   rehearsal graduation in @ton/sandbox while loading the real mainnet STON.fi v2 router, pTON and their libraries
   on demand. Pin the router for a repeatable run: `npm run rehearse:fork -- --router EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql`
   (without it the STON.fi API picks one, and the pick can change). Mainnet state is read from toncenter v2
   (`TON_V4_ENDPOINT` switches to a tonhub v4 reader; the public tonhub endpoint now answers 403).
   PASS = pool active and the zero-address LP wallet holds at least 99% of LP supply (STON.fi locks a small minimum).
   Needs internet access to mainnet APIs; `TONCENTER_API_KEY` is optional.
9. Record factory, token and transaction hashes in `docs/STATUS.md` and mark rows in `docs/VERIFICATION.md`.

Any failure → stop, fix, re-run the whole gate.

## Mainnet (Phase 8–10) — only after "MAINNET GO-LIVE APPROVED"

```bash
set -a && source .env.production && set +a
MAINNET_GO_LIVE_APPROVED=yes ./scripts/launch-production.sh
```

The script validates configuration, checks that the Vercel CLI reaches the linked project and that `.vercelignore`
keeps `.env.*` out of the upload, rebuilds and tests contracts, deploys or re-verifies the factory, validates the
runtime configuration (including the live manifest), writes Vercel variables with `--force` (secrets as Vercel
Secrets) and deploys. Re-running it is safe. See `docs/LAUNCH.md` for the founder's steps, the dashboard alternative
and the smoke test.

### Factory deploy from a wallet app

For a founder who keeps the owner wallet in a wallet app and will not put its recovery phrase in a file (ADR-011).
It replaces only the factory deploy of the script above; nobody types or stores a mnemonic.

1. Build a deployment with `VITE_FACTORY_DEPLOY_PAGE=on` (a preview deployment; the variable is set for Preview only)
   and open `/deploy-factory` on it.
2. Connect the mainnet wallet that will own the factory. It needs at least 0.2 TON.
3. The page checks the pinned STON.fi router as the deploy script does (the pTON master on-chain must name the pinned
   pTON wallet; the STON.fi API must describe a v2 constant-product router with pool creation on), shows the owner,
   treasury, router and the factory address, and offers "Deploy the factory".
4. Tap "Deploy the factory". The page runs the router checks once more (about ten seconds) and only then opens the
   wallet app. Approve the one transaction there: 0.1 TON to the factory address with its state init.
5. The page waits for the factory, reads `get_factory_info` and compares owner, treasury, liquidity manager, router,
   pTON wallet and fees. Only then does it show "deployed and verified" and the address.
6. Set `FACTORY_ADDRESS`, `VITE_FACTORY_ADDRESS` and `PLATFORM_TREASURY_ADDRESS` in Vercel (Production), check
   `VITE_NETWORK=mainnet`, deploy production from `clawdbot-permanent` and run `/production-check`.
7. Remove `VITE_FACTORY_DEPLOY_PAGE` from Vercel (or set it to anything but `on`), so later previews do not serve the
   page. Done 2026-11-19 after the mainnet deploy: it is `off`.

The owner is the connected wallet, and so is the liquidity manager (the deploy script's default). Opening the page
again with the same wallet finds the factory and only verifies it. If the wallet app does not confirm the send, the
page offers "Check again" and no second send, also after a reload, until the factory appears or the request has
expired (twelve minutes after the tap; the page shows the time). A refusal in the wallet app is the one case that
brings the deploy button back at once. Another wallet gets another factory address, which is never ours.

## Graduation trigger

`Migrate` is permissionless; the contract seeds STON.fi and locks the LP itself (ADR-009).

```bash
cd contracts
npm run graduate -- mainnet <tokenAddress>                    # plan only
MAINNET_GO_LIVE_APPROVED=yes npm run graduate -- mainnet <tokenAddress> --execute
```

Fallback only if STON.fi refunded the provision to the liquidity manager:

```bash
MAINNET_GO_LIVE_APPROVED=yes npm run graduate -- mainnet <tokenAddress> --fallback --ton=<refunded TON> --execute
MAINNET_GO_LIVE_APPROVED=yes npm run graduate -- mainnet --lock-lp --pool=<pool> --execute
```

## Production checks (`/production-check`)

```bash
curl -fsS https://ton-launchpad-miniapp.vercel.app/api/health
node scripts/validate-env.ts production --network     # with production values loaded
curl -fsS https://ton-launchpad-miniapp.vercel.app/api/tokens | head -c 400
```

## Claude on GitHub (PR review and merges)

Two workflows run Claude through `anthropics/claude-code-action@v1`:

- `.github/workflows/claude-code-review.yml` reviews every non-draft PR (contracts and fund safety first, then
  secrets, tests, bugs, docs) and ends with "Ready to merge" or "Changes needed".
- `.github/workflows/claude.yml` answers `@claude` in PR/issue comments. Only the repository owner's comments
  trigger it. It can push fixes and, when the owner asks ("@claude merge this"), merges with `gh pr merge --merge`
  after every check passes. It never deploys and never touches mainnet.

Both need one repository secret, `CLAUDE_CODE_OAUTH_TOKEN` (run `claude setup-token` with a Claude subscription) or
`ANTHROPIC_API_KEY`, at Settings → Secrets and variables → Actions. Without it they skip with a notice. The Claude
GitHub App must be installed on the repository (https://github.com/apps/claude). A workflow edited inside a PR is
not trusted by the action until it is on the default branch, so the first review runs on the PR after this one.
