# DEPLOY.md — Vercel + Cloudflare Setup

## Vercel env vars

Set in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | From @BotFather |
| `JWT_SECRET` | Yes | Random 64-char string |
| `PLATFORM_TREASURY_ADDRESS` | Yes | Your TON wallet for 40% fees |
| `FACTORY_ADDRESS` | After deploy | Mainnet factory address |
| `VITE_FACTORY_ADDRESS` | After deploy | Same as FACTORY_ADDRESS |
| `VITE_MANIFEST_URL` | Yes | `https://your-domain/tonconnect-manifest.json` |
| `VITE_TWA_RETURN_URL` | Yes | `https://t.me/BotName/appname` |
| `VITE_NETWORK` | Yes | `mainnet` |
| `TONAPI_KEY` | Optional | Higher rate limits |

## Interim domain (before custom domain)

1. Deploy to Vercel → get `*.vercel.app` URL
2. Update `public/tonconnect-manifest.json` `url` and `iconUrl` to match
3. Set BotFather Mini App URL to Vercel URL

## Cloudflare (when custom domain ready)

1. Add domain to Cloudflare (free plan)
2. Update nameservers at registrar
3. Add CNAME: `launch` → `cname.vercel-dns.com` (or Vercel-provided)
4. Enable proxy (orange cloud) + DNSSEC
5. Update Vercel custom domain settings
6. Update manifest URL + Vercel env vars

## BotFather

```
/myapps → select app → Edit link → set HTTPS URL
/setmenubutton → set button text + URL
```

## Contract deploy (founder runs locally)

```bash
cd contracts
DEPLOY_MNEMONIC="..." PLATFORM_TREASURY_ADDRESS=UQ... npm run deploy:mainnet
```

Then paste factory address into Vercel env.

## Smoke test checklist

- [ ] Mini App opens from Telegram bot
- [ ] TON Connect modal opens
- [ ] Wallet connects and returns to Mini App
- [ ] `/tonconnect-manifest.json` returns 200
- [ ] Create token tx submits (with factory deployed)
- [ ] Home shows Launchpad + Graduated tabs
