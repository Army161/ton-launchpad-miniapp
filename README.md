# TON Launchpad Mini App

TON-native meme coin launchpad as a **Telegram Mini App**: create a Jetton on a bonding curve, trade with TON Connect, graduate liquidity to **STON.fi**.

**Repo:** [Army161/ton-launchpad-miniapp](https://github.com/Army161/ton-launchpad-miniapp)

## Status

**Not production ready yet.** Contracts, app and API are complete and verified in the sandbox; the testnet gate and
mainnet deploy are waiting on founder actions. See [docs/STATUS.md](docs/STATUS.md).

| Feature | Status |
|---------|--------|
| Tact contracts: factory, jetton minter + bonding curve, jetton wallet (TEP-74) | Built, 46 sandbox tests |
| 2% trading fee (60% creator / 40% platform) | On-chain, tested to the nanoton |
| Graduation at 1,500 TON → STON.fi with locked LP | Contract tested; keeper script (ADR-005) |
| Telegram Mini App + initData auth | Built, tested |
| TON Connect (Wallet, Tonkeeper) | Built; live check pending |
| Create / Buy / Sell with on-chain quotes and confirmation | Built |
| Live STON.fi, DexScreener, CoinGecko, TonAPI feeds | Built, fail safe |
| Factory on mainnet | Not deployed |

## Quick start

```bash
npm ci
cp .env.example .env.local        # public VITE_* values only
npm run dev                       # UI; `npx vercel dev` for UI + /api

cd contracts
npm ci --legacy-peer-deps
npm run build && npm test
```

Full verification: `/verify` (see [CLAUDE.md](CLAUDE.md)).

## Deploy

Founder steps, in order: [docs/LAUNCH.md](docs/LAUNCH.md). Runbooks: [docs/EXECUTION.md](docs/EXECUTION.md).
Mainnet deployment is locked until the testnet gate passes and the founder approves it.

## Documentation

- [SPEC.md](docs/SPEC.md) — what V1 is
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — contracts, API, front end
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) — every variable and where it lives
- [SECURITY.md](docs/SECURITY.md) — threats and findings
- [VERIFICATION.md](docs/VERIFICATION.md) — evidence per requirement
- [STATUS.md](docs/STATUS.md) — current state and blockers
- [DECISIONS.md](docs/DECISIONS.md) — architecture decisions
- [PLAN.md](docs/PLAN.md) — roadmap V1/V2/V3
- [MINIAPP.md](docs/MINIAPP.md) — Telegram setup
- Superseded notes: [docs/archive](docs/archive/)

## Tech stack

- **Frontend:** Vite + React 19 + TypeScript + TON Connect UI
- **Contracts:** Tact + Blueprint (`contracts/`)
- **API:** Vercel serverless (`api/`)
- **Data:** the chain via toncenter (launchpad tokens); STON.fi, DexScreener, CoinGecko, TonAPI

## License

Private / all rights reserved.
