# LAUNCH.md — Go-Live Checklist (Founder)

## What you must provide (one time)

| Item | Example | Used for |
|------|---------|----------|
| `PLATFORM_TREASURY_ADDRESS` | `UQ...` or `EQ...` | 40% of trading fees |
| `DEPLOY_MNEMONIC` | 24-word seed phrase | Deploy factory (local only, never commit) |
| `TELEGRAM_BOT_TOKEN` | from @BotFather | initData auth |
| `JWT_SECRET` | random 64 chars | session tokens |
| Bot username + app short name | `@MyBot` / `launch` | `VITE_TWA_RETURN_URL` |

Generate JWT secret:
```bash
openssl rand -hex 32
```

## One-command launch

```bash
cp .env.example .env.production
# Edit .env.production with your values

set -a && source .env.production && set +a
chmod +x scripts/launch-production.sh
./scripts/launch-production.sh
```

## Manual steps (if you prefer)

### 1. Deploy factory (mainnet)

```bash
cd contracts
npm ci --legacy-peer-deps
DEPLOY_MNEMONIC="word1 word2 ..." \
PLATFORM_TREASURY_ADDRESS=UQYourWallet... \
npm run deploy:mainnet
```

Copy `factoryAddress` from `contracts/deployed.json`.

### 2. Vercel env vars

In [Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_FACTORY_ADDRESS` | Factory address from step 1 |
| `FACTORY_ADDRESS` | Same |
| `PLATFORM_TREASURY_ADDRESS` | Your treasury wallet |
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `JWT_SECRET` | Random hex string |
| `VITE_TWA_RETURN_URL` | `https://t.me/YourBot/yourapp` |
| `VITE_MANIFEST_URL` | `https://your-domain/tonconnect-manifest.json` |
| `VITE_NETWORK` | `mainnet` |

Redeploy after setting vars (Deployments → Redeploy).

### 3. GitHub Actions (optional CI deploy)

Add repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Get IDs: `vercel link` then check `.vercel/project.json`.

### 4. BotFather

```
/myapps → select app → Edit link → https://ton-launchpad-miniapp.vercel.app
/setmenubutton → your bot → Web App → same URL
```

### 5. Cloudflare (when you have a domain)

1. Add domain to Cloudflare
2. CNAME `launch` → `cname.vercel-dns.com`
3. Add custom domain in Vercel
4. Update `public/tonconnect-manifest.json` `url` and `iconUrl`
5. Update `VITE_MANIFEST_URL` in Vercel

### 6. Smoke test

- [ ] Open bot → Mini App loads
- [ ] Connect wallet (TON Connect)
- [ ] Create token (0.05 TON + gas)
- [ ] Buy on bonding curve
- [ ] Graduated tab shows STON.fi tokens

## Design mockups

Upload Figma/screenshots when ready → pixel pass tracked in `docs/DESIGN.md`.
