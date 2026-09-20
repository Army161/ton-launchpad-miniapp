# SPEC.md — Product Requirements

## V1 Scope

### Token creation

- Fixed supply: **1,000,000,000** Jettons
- Launch fee: **0.05 TON** + gas
- Fields: name, ticker, description, image, Telegram link, optional initial buy (0–100 TON)

### Bonding curve

- Virtual-reserve AMM (Pump.fun / Blum style)
- Graduation target: **1,500 TON** raised
- Post-graduation: STON.fi pool with locked LP

### Trading fees (V1)

| Fee | Amount |
|-----|--------|
| Total trading fee | 2% |
| Creator share | 1.2% (60% of 2%) |
| Platform share | 0.8% (40% of 2%) |
| Network gas | Paid by user (variable) |

### Auth

- Identity: Telegram `initData` (validated server-side)
- Wallet: TON Connect (mandatory for create/trade)
- No email/password signup

### Data rules

- Never invent market data — show `—` when unknown
- 24h % from DexScreener only when indexed

## Out of scope (V1)

- Cashback pool
- LP milestone unlocks
- Anti-MEV / commit-reveal
- Multisig treasury

## TODO

- [ ] Confirm final launch fee with mainnet gas benchmarks
- [ ] Set beta banner copy for first 48h
