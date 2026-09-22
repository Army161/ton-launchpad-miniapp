# SPEC.md — what V1 is

A requirement is met only when `docs/VERIFICATION.md` shows evidence for it.

## Core flow

Telegram → Mini App → TON Connect → Create jetton → Bonding curve → Buy/Sell → Fee distribution → Graduation → STON.fi.

## Economics (locked for V1)

| Parameter | Value | Where enforced |
|---|---|---|
| Supply | 1,000,000,000 tokens, 9 decimals | `contracts/contracts/messages.tact` |
| Launch fee | 0.05 TON to the platform treasury | LaunchpadJetton setup |
| Trade fee | 2.00% of the TON side of every buy and sell | `tradeFee()` |
| Creator share | 60% of the trade fee | `creatorShare()` |
| Platform share | 40% of the trade fee (remainder after creator share) | LaunchpadJetton |
| Curve | constant product on virtual reserves: 30 TON / 1B tokens | LaunchpadJetton |
| Graduation | when net TON raised ≥ 1,500 TON | LaunchpadJetton |
| Initial creator buy | 0 or 0.01–100 TON | LaunchpadFactory |
| Minimum trade | 0.01 TON | LaunchpadJetton |

Rounding favours the pool: the fee rounds up (to the nanoton), tokens and TON paid out round down. This can only move
fractions of a nanoton and is recorded in ADR-004.

## Telegram

- The app opens as a Telegram Mini App.
- `initData` is verified server-side (HMAC per Telegram's spec, constant-time compare, max age 24 h, no future dates).
- Invalid or tampered `initData` cannot create a session.
- Valid sessions are HS256 JWTs signed with `JWT_SECRET`, 24 h lifetime, stateless.

## Wallet

- TON Connect loads, supported wallets connect and the session restores.
- The Telegram return URL (`VITE_TWA_RETURN_URL`) brings the user back after signing.
- Transactions are pinned to the configured network.
- No private key or mnemonic ever enters the front end.

## Token creation

A creator can connect a wallet, enter metadata (name ≤ 32, ticker 2–10 A–Z/0–9, description ≤ 200, https image,
optional https://t.me link), send one real transaction to the factory, see it confirmed, and land on the token page.
Metadata is stored on-chain (TEP-64). No demo path may masquerade as a real transaction.

## Trading

Users can get a quote from live reserves, buy, sell, see pending/confirmed/failed state and errors. Both directions
carry a 1% slippage limit enforced on-chain; a failed limit refunds the buyer or returns the seller's tokens.
A sell is a burn from the seller's own jetton wallet; the curve pays TON for it.

## Graduation

- Proven by deterministic sandbox tests (below / at / above target, exactly once, curve closed afterwards).
- After graduation anyone can trigger `Migrate`, which sends the reserve and remaining supply to the liquidity
  manager fixed at factory deploy. The keeper script seeds a STON.fi v2 pool and can lock the LP (ADR-005).
- The founder is not required to spend 1,500 TON on mainnet to test it.

## External feeds

STON.fi, DexScreener, CoinGecko and TonAPI calls fail safe: a network error shows an empty state or "—", never a crash
and never invented data.

## Out of scope for V1

Cashback pool, LP milestone unlocks, anti-MEV, multisig treasury, custom domain (see `docs/PLAN.md`).
