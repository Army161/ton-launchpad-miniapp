# TODOLIST.md — Founder Action Items

## Automated (done in repo)

- [x] Launch script: `scripts/launch-production.sh`
- [x] Launch guide: `docs/LAUNCH.md`
- [x] Cloudflare guide: `docs/CLOUDFLARE.md`
- [x] Terms + Privacy pages for TON Connect manifest
- [x] CI build/test on every push
- [x] Buffer polyfill fix for TON Connect

## You must do (requires your secrets)

- [ ] **Provide `PLATFORM_TREASURY_ADDRESS`** — your TON wallet for 40% fees
- [ ] **Provide `DEPLOY_MNEMONIC`** — fund wallet with ~1 TON, run deploy locally
- [ ] **Provide `TELEGRAM_BOT_TOKEN`** — from @BotFather
- [ ] **Generate `JWT_SECRET`** — `openssl rand -hex 32`
- [ ] **Set Vercel env vars** — or run `./scripts/launch-production.sh`
- [ ] **BotFather menu URL** — point to production HTTPS URL
- [ ] **GitHub secrets** (optional) — `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Optional (later)

- [ ] Upload design mockups / Figma → pixel UI pass
- [ ] Purchase custom domain + Cloudflare DNS (`docs/CLOUDFLARE.md`)
- [ ] Smoke test create → buy → sell on mainnet

## Quick start

```bash
cp .env.example .env.production
# fill in your values
set -a && source .env.production && set +a
./scripts/launch-production.sh
```
