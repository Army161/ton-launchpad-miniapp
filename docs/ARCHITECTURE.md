# ARCHITECTURE.md — how V1 works

```
Telegram ──► Mini App (Vite/React, Vercel static) ──TON Connect──► user wallet ──► TON chain
                 │                                                        ▲
                 └──► /api (Vercel functions) ──toncenter──► reads getters ┘
```

## Contracts (`contracts/contracts/*.tact`, Tact 1.6)

| Contract | Role |
|---|---|
| `LaunchpadFactory` | Receives `CreateToken`, deploys a `LaunchpadJetton` at `initOf(factory, creator, salt)` and sends it `JettonSetup` with the treasury and liquidity manager fixed at factory deploy. Holds no user funds. |
| `LaunchpadJetton` | TEP-74 jetton minter **and** bonding curve. Buys mint to the buyer's wallet; sells arrive as burn notifications from the seller's own wallet. Keeps the TON reserve (`realTonRaised`) locked with `nativeReserve` on every trade. Pays fees on every trade. Graduates at 1,500 TON; `Migrate` moves liquidity out once. |
| `JettonWallet` | Standard TEP-74 wallet. Forwards the burn custom payload so the curve can read the seller's minimum TON. |

### Messages

| Op | Message | From → to |
|---|---|---|
| `0x4c500001` | `CreateToken{queryId, salt, content, initialBuyTon}` | creator → factory; value ≥ 0.05 + initialBuy + 0.15 TON |
| `0x4c500002` | `JettonSetup{…}` | factory → new jetton (once) |
| `0x4c500003` | `Buy{queryId, tonAmount, minTokensOut}` | trader → jetton; value ≥ tonAmount + 0.1 TON |
| `0x595f07bc` | TEP-74 `burn` with custom payload `SELL(0x53454c4c) minTonOut:coins` | trader → own jetton wallet; value ≥ 0.07 TON |
| `0x4c500004` | `Migrate{queryId}` | anyone → graduated jetton |
| `0x4c500005` | `FactoryWithdraw` | factory owner → factory (recovers TON from bounced deploys only) |

Events are emitted as external messages: `TokenLaunched`, `TradeEvent`, `GraduatedEvent`, `MigratedEvent`.

### Curve maths

`k = virtualTon × virtualTokens`; buy: `tokensOut = virtualTokens − ceil(k / (virtualTon + tonIn − fee))`;
sell: `grossTon = virtualTon − ceil(k / (virtualTokens + tokensIn))`, seller gets `grossTon − fee`.
`fee = ceil(amount × 2%)`, `creatorFee = floor(fee × 60%)`, `platformFee = fee − creatorFee`.
Invariants tested after every trade: `virtualTon − 30 TON = realTonRaised`, `virtualTokens + totalSupply = 1B`,
contract balance ≥ `realTonRaised` + storage buffer.

### Graduation

The buy that brings `realTonRaised` to ≥ 1,500 TON sets `graduated`; buys and curve sells then fail (and refund).
`Migrate` (permissionless) mints the remaining curve inventory (`virtualTokens`, ≈ 19.6M tokens at exactly 1,500 TON)
to the liquidity manager and sends it the reserve. The final curve price and the pool's opening price match to
within ~2%. `contracts/scripts/graduate.ts` then seeds the STON.fi v2 pool and can lock the LP by sending it to the
zero address. The liquidity manager is trusted between `Migrate` and pool creation (ADR-005).

## API (`api/`, Vercel functions)

| Route | Purpose |
|---|---|
| `POST /api/auth/telegram` | verifies `initData`, returns a 24 h JWT and the Telegram profile |
| `GET /api/tokens` | lists launches found in the factory's transactions; every token is proven to come from our factory (address re-derived from `(factory, creator, salt)`); 20 s cache |
| `GET /api/tokens/:address[?holder=]` | live curve state and optionally the holder's balance |
| `POST /api/metadata/upload` | authenticated image upload to Vercel Blob (503 if Blob is not enabled) |
| `GET /api/health` | configuration presence flags only |

There is no database: the chain is the source of truth for tokens, and sessions are stateless (ADR-003).

## Front end (`src/`)

- `lib/contracts.ts` — message builders (tested byte-for-byte against the compiled ABI), curve maths, exact decimal parsing.
- `lib/metadata.ts` — TEP-64 on-chain metadata build/parse and validation.
- `contracts/*` — generated Tact wrappers used to derive token and wallet addresses.
- Pages: Home (launchpad from `/api/tokens`, graduated from STON.fi), Create, TokenDetail, Buy, Sell, My Tokens, Profile.
- After sending, pages poll `/api/tokens/:address` until the trade count moves, then show confirmation.
