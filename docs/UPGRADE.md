# UPGRADE.md — Upgrade Runbook

## Frontend

1. Pull latest `main` / `clawdbot-permanent`
2. `npm install && npm run build`
3. Vercel auto-deploys on push

## Contracts

1. Deploy new factory version to new address
2. Update `VITE_FACTORY_ADDRESS` in Vercel
3. Old tokens remain on old factory — document migration

## Breaking changes

| Version | Change |
|---------|--------|
| V1 → V2 | Fee split adds cashback + LP lock |

## TODO

- [ ] Define contract upgrade proxy pattern for V2
