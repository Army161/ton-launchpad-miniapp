# PLAN.md — Master Roadmap

> TON Meme Coin Launchpad · V1 / V2 / V3

## Vision

Telegram-native meme coin launchpad on TON: create Jettons on a bonding curve, trade in-app, graduate liquidity to STON.fi.

## V1 — Live Operational (current sprint)

- [x] Mini App UI shell (Home, Create, Buy, Sell, Detail, nav)
- [ ] Tact smart contracts (Factory, BondingCurve, Jetton)
- [ ] TON Connect wallet integration
- [ ] Telegram initData auth (no signup form)
- [ ] 2% trading fee → 60% creator / 40% platform
- [ ] STON.fi graduation at 1,500 TON cap
- [ ] Live feeds: STON.fi, DexScreener, CoinGecko, TonAPI
- [ ] Vercel + Cloudflare deployment

## V2 — Advanced Economics (documented, not built)

See fee mechanics section below.

## V3 — Growth & Listings

- GMGN / GeckoTerminal / DexScreener auto-submit
- Trending algorithm, social sharing rewards
- Creator analytics dashboard

## V2 Fee Mechanics (backlog — DO NOT BUILD IN V1)

### Full 2% fee model

| Component | Detail |
|-----------|--------|
| Total fee | 2% per trade |
| Split A (1%) | 60% creator · 40% platform (same as V1) |
| Split B (1%) | Split between cashback pool + LP reserve |
| Cashback | Distributed to active traders proportional to volume |
| LP reserve | Added to locked liquidity on STON.fi graduation |

### LP lock & milestone unlock

- LP tokens locked at graduation until market-cap milestone reached
- Creator optional toggle: max 50% of locked LP can be unlocked
- Unlock only in **10% increments** — never all at once (anti-liquidation)
- Platform creator decides whether to enable the 50% unlock option at token launch
- Clear UI disclosure: anti-rug, anti-honeypot policy

### Anti-abuse (V2)

| Threat | Mitigation |
|--------|------------|
| Rug pull | No owner mint; LP lock; immutable metadata |
| Honeypot | Sell path tested in contract; open source |
| MEV / bundles | Commit-reveal or private mempool partner |
| Vamp copies | Duplicate detection via metadata hash + creator signature |
| Liquidation events | 10% increment unlock cap |

### Listings & growth (V3)

- Auto-submit to GMGN, GeckoTerminal, DexScreener
- Trending algorithm based on volume + holder growth
- Creator analytics dashboard
- Multisig treasury upgrade for platform fees

## Milestones

| Milestone | Target |
|-----------|--------|
| Docs skeleton | Phase 0 |
| Contracts + tests | Phase 1 |
| Mainnet deploy | Phase 1 |
| Wallet + auth | Phase 2 |
| Wire trading | Phase 3 |
| Deploy infra | Phase 5 |

## TODO

- [ ] Flesh out timeline dates after mainnet deploy
- [ ] Add mockup-driven UI pass when design assets arrive
