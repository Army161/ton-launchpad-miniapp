# HEARTBEAT.md — Health Checks

## Endpoints to monitor

| Check | URL / command |
|-------|---------------|
| Mini App | `GET /` → 200 |
| TON Connect manifest | `GET /tonconnect-manifest.json` → 200 |
| Auth API | `POST /api/auth/telegram` → 401 without initData |
| STON.fi | `GET api.ston.fi/v1/assets` → 200 |
| Factory on-chain | TonAPI account state for `FACTORY_ADDRESS` |

## Cadence

- Uptime: every 5 min (Vercel / external monitor)
- Contract balance: daily

## TODO

- [ ] Set up Better Stack or UptimeRobot after deploy
