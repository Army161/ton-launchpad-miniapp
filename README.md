# TON Launchpad Mini App

TON-native meme coin launchpad as a **Telegram Mini App**: create a Jetton on a bonding curve, trade, then graduate liquidity to **STON.fi**. Built for Telegram Web App (HTTPS + BotFather menu URL) — domain purchase deferred.

**Repo:** [Army161/ton-launchpad-miniapp](https://github.com/Army161/ton-launchpad-miniapp)  
**Local monorepo sibling:** contracts / indexer live under the private `ton-launchpad` workspace (not this public Mini App surface).

## What this is

| Surface | Route | Status |
|---------|-------|--------|
| Home (live STON.fi Featured + Trending cards) | `/` | Green |
| Creator Studio | `/create` | Green vs mockup |
| Token detail | `/token/:id` | Green vs mockup |
| Buy / Sell | `/buy/:id`, Sell mirror | Green vs mockup |
| Bottom nav | Home · Explore · My Tokens · Profile | Official kit icons (Profile interim) |

**Product locks**

- Launch fee Assumed **0.05 TON** (protocol factory; see monorepo `LAUNCH_FEE_LOCK.md`)
- DEX graduation target: **STON.fi**
- Brand: official TON blue `#30A1F5`, Gram diamond mark, SF Pro Text system stack (legacy `#0098EA` cleared)
- Nav icons: official **Home / Discover / Holdings** from `ton-org/kit-ios` Tabbar; Profile remains interim until founder GO
- Home feed: live `api.ston.fi/v1/assets` (no demo tokens); 24h % from DexScreener `priceChange.h24` (dash when missing — never invented)
- Connect / on-chain buy: stub until testnet + TON Connect

## Current build status (2026-09-19)

| Gate | Result |
|------|--------|
| Brand lock | Green — `BRAND_LOCK_REPORT.md` |
| TON crystal mark | Green — `IconTon` = official diamond paths |
| Nav icons | Green — kit-ios Home / Discover / Holdings |
| Buy / Sell pixel match | Green — `BUY_SELL_MATCH_REPORT.md` |
| Home live cards | Green — `HOME_CARD_MATCH_REPORT.md` |
| Home 24h % | Green — DexScreener — `HOME_24H_REPORT.md` |
| `npm run build` | Exit 0 |
| Vercel / Telegram bot | **Not in this sync** — blocked on deploy tokens / BotFather |

## Screenshots

Staged under [`screenshots/`](./screenshots/) for angel / grant forms:

| File | Screen |
|------|--------|
| `01_home_live_cards.png` | Home Featured / Trending live cards |
| `01b_home_24h.webp` | Home with live 24h % |
| `02_buy.png` | Buy flow |
| `03_sell.png` | Sell flow |
| `04_create.png` | Creator Studio |
| `05_token_detail.png` | Token detail |

## Tech stack

- **Vite** + **React** + **TypeScript**
- CSS modules; TON brand tokens in `src/index.css`
- Live data: STON.fi assets API + DexScreener token-pairs (CORS `*`, no keys)
- Telegram Web App script ready in `index.html` (`Telegram.WebApp.ready()`)

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Requires Node 20+. No API keys for Home live feed.

## Hard bans

No private keys, no mainnet money, no fake audits, no invented market data.

## License

Private / all rights reserved unless founder states otherwise.
