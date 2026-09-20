# BUILDV1.md — V1 Build Checklist

## Acceptance criteria

- [ ] Create real Jetton on TON mainnet from Telegram Mini App
- [ ] Buy and sell on bonding curve with real TON
- [ ] 2% fee splits 60/40 creator/platform automatically
- [ ] Token graduates to STON.fi at cap with locked LP
- [ ] TON Connect works inside Telegram (Wallet, Tonkeeper)
- [ ] Home shows launchpad + graduated STON.fi tokens
- [ ] DexScreener 24h % on graduated tokens
- [ ] Deployed on Vercel, reachable from Telegram bot
- [ ] All `docs/*.md` skeleton files exist
- [ ] No demo/stub transactions remain

## Build gates

| Gate | Command / check |
|------|-----------------|
| Frontend build | `npm run build` |
| Contract compile | `cd contracts && npm run build` |
| Contract tests | `cd contracts && npm test` |
| Lint | `npm run lint` |
| Manifest reachable | `GET /tonconnect-manifest.json` |

## TODO

- [ ] Record mainnet factory address after deploy
- [ ] Smoke test full create → buy → sell on mainnet
