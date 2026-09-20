# SECURITY.md — Security Practices

## Secrets (never in repo)

| Secret | Location |
|--------|----------|
| `TELEGRAM_BOT_TOKEN` | Vercel env |
| `JWT_SECRET` | Vercel env |
| `DEPLOY_MNEMONIC` | Local only / CI secret |
| `PLATFORM_TREASURY_ADDRESS` | Vercel env + contract immutable |

## Telegram initData validation

1. Parse `initData` query string
2. Extract `hash` field
3. Sort remaining key=value pairs alphabetically
4. HMAC-SHA256 with key = `HMAC-SHA256("WebAppData", bot_token)`
5. Compare computed hash with provided hash
6. Reject if `auth_date` older than 24h

## TON Connect manifest

- Must be HTTPS, publicly GET-able, no auth wall
- Icon must be PNG (not SVG)

## Contract security (V1)

- No owner mint after launch
- Immutable platform treasury at deploy
- LP locked on graduation

## TODO

- [ ] Add CSP headers via Vercel config
- [ ] Schedule contract audit before public marketing
