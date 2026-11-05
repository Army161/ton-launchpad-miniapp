# SMARTCONTRACT.md — On-Chain Architecture

## Contracts

| Contract | Purpose |
|----------|---------|
| `LaunchpadFactory` | Deploy new tokens + curve pools |
| `BondingCurvePool` | Buy/sell, fee routing, graduation |
| `JettonMinter` | TEP-74 Jetton, 1B fixed supply |

## Fee math

```
trade_amount = user TON or Jetton value
total_fee    = trade_amount × 2%
creator_fee  = total_fee × 60%  (= 1.2% of trade)
platform_fee = total_fee × 40%  (= 0.8% of trade)
```

## Constants

| Constant | Value |
|----------|-------|
| `TOTAL_SUPPLY` | 1_000_000_000 |
| `LAUNCH_FEE` | 0.05 TON |
| `GRADUATION_TARGET` | 1_500 TON |
| `TRADE_FEE_BPS` | 200 (2%) |
| `CREATOR_FEE_SHARE_BPS` | 6000 (60% of fee) |

## Mainnet addresses

> **TODO:** Fill after deploy with founder wallet + mnemonic

| Contract | Address |
|----------|---------|
| LaunchpadFactory | `PENDING_DEPLOY` |
| Platform treasury | `$PLATFORM_TREASURY_ADDRESS` |

## Deploy steps

```bash
cd contracts
npm install
npm run build
npm test

# Mainnet (founder runs locally — never commit mnemonic)
DEPLOY_MNEMONIC="word1 word2 ..." \
PLATFORM_TREASURY_ADDRESS=UQYourWallet... \
TONCENTER_API_KEY=optional \
npm run deploy:mainnet
```

After deploy, set `VITE_FACTORY_ADDRESS` and `FACTORY_ADDRESS` in Vercel env vars.
Artifact written to `contracts/deployed.json`.

## Opcodes (reference)

| Op | Name | Description |
|----|------|-------------|
| 0x1 | `create_token` | Factory: deploy jetton + curve |
| 0x2 | `buy` | Curve: TON → Jetton |
| 0x3 | `sell` | Curve: Jetton → TON |
| 0x4 | `graduate` | Curve: STON.fi pool creation |

## TODO

- [ ] Record deployed mainnet addresses
- [ ] Publish verified source on tonviewer
- [ ] Schedule third-party audit before marketing push
