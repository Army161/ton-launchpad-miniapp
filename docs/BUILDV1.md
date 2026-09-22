# BUILDV1.md — V1 acceptance

A box is ticked only with evidence in `docs/VERIFICATION.md`. "Sandbox" means proven against the compiled contracts;
the matching live check is still open until the testnet/mainnet gate runs.

## Acceptance criteria

| Criterion | Sandbox / code | Live |
|---|---|---|
| Create a real jetton from the Mini App | [x] factory tests, client encoding tests | [ ] testnet gate |
| Buy and sell on the curve with real TON | [x] trade and sellability tests | [ ] testnet gate |
| 2% fee split 60/40 automatically | [x] exact-amount fee tests, 7 trade sizes | [ ] testnet gate |
| Graduates at 1,500 TON; liquidity to STON.fi with locked LP | [x] graduation suite; keeper script (plan mode) | [ ] needs a graduated token and ADR-005 sign-off |
| TON Connect inside Telegram (Wallet, Tonkeeper) | [x] network pinned, return URL validated | [ ] needs bot + short name |
| Home shows launchpad and graduated STON.fi tokens | [x] chain-verified listing; feeds fail safe | [ ] after factory deploy |
| DexScreener 24h % on graduated tokens | [x] fail-safe tested | [ ] production check |
| Deployed on Vercel, reachable from the bot | [ ] branch not merged | [ ] BotFather |
| No demo or stub transactions remain | [x] fake sell and `pending_*` registration removed | — |
| Control docs exist | [x] SPEC, ENVIRONMENT, ARCHITECTURE, SECURITY, VERIFICATION, EXECUTION, STATUS, DECISIONS | — |

## Build gates

| Gate | Command | Status |
|---|---|---|
| Contract compile | `cd contracts && npm run build` | PASS |
| Contract tests | `cd contracts && npm test` | PASS 46/46 |
| Lint | `npm run lint` | PASS |
| App tests | `npm test` | PASS 62/62 |
| Frontend build | `npm run build` | PASS |
| Manifest reachable | `node scripts/validate-env.ts production --network` | BLOCKED_HUMAN (run locally) |
