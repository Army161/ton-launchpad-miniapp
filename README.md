# TON Launchpad Mini App

TON-native meme coin launchpad as a **Telegram Mini App**: create a Jetton on a bonding curve, trade with TON Connect, graduate liquidity to **STON.fi**.

**Repo:** [Army161/ton-launchpad-miniapp](https://github.com/Army161/ton-launchpad-miniapp)

## Features (V1)

| Feature | Status |
|---------|--------|
| Telegram Mini App + initData auth | Ready |
| TON Connect wallet (Wallet, Tonkeeper) | Ready |
| Tact smart contracts (Factory, Curve, Jetton) | Ready — deploy required |
| 2% trading fee (60% creator / 40% platform) | On-chain |
| Live STON.fi + DexScreener + CoinGecko feeds | Ready |
| Launchpad / Graduated home tabs | Ready |
| Creator Studio (`/create`) | Ready |
| Buy / Sell with on-chain quotes | Ready |
| Vercel API routes (auth, tokens, metadata) | Ready |

## Quick start

```bash
# Frontend
npm install
cp .env.example .env.local   # fill vars
npm run dev

# Contracts
cd contracts
npm install --legacy-peer-deps
npm run build
npm test
```

For full API locally: `npx vercel dev`

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Vercel + Cloudflare + BotFather setup.

```bash
# Mainnet contract deploy (founder wallet required)
cd contracts
DEPLOY_MNEMONIC="..." PLATFORM_TREASURY_ADDRESS=UQ... npm run deploy:mainnet
```

## Documentation

All project docs live in [`docs/`](docs/):

- [PLAN.md](docs/PLAN.md) — roadmap V1/V2/V3
- [SMARTCONTRACT.md](docs/SMARTCONTRACT.md) — contracts + fee math
- [MINIAPP.md](docs/MINIAPP.md) — Telegram setup
- [DEPLOY.md](docs/DEPLOY.md) — Vercel + Cloudflare
- [BUILDV1.md](docs/BUILDV1.md) — acceptance criteria

## Tech stack

- **Frontend:** Vite + React 19 + TypeScript + TON Connect UI
- **Contracts:** Tact + Blueprint (`contracts/`)
- **API:** Vercel serverless (`api/`)
- **Data:** STON.fi, DexScreener, CoinGecko, TonAPI

## License

Private / all rights reserved.
