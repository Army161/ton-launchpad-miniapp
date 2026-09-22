# DECISIONS.md — architecture decisions

## ADR-001 Retain React + TypeScript + Vite

Reason: existing production architecture, TON Connect compatibility, lower regression risk, faster verified launch.

## ADR-002 Rewrite the contracts on TEP-74 with the minter as the curve (2026-09-22)

The previous contracts refunded the whole contract balance to every buyer, paid TON for forged sell notifications and
never minted tokens. They could not be patched safely. The minter now is the curve, sells are burns verified by
recomputing the seller's wallet address, and the reserve is locked with `nativeReserve`. Economics unchanged.
Consequence: addresses from the old factory (never deployed) are irrelevant; wallets show a sell as a "burn".

## ADR-003 No database for V1

Tokens are discovered from the factory's on-chain transactions and verified by address derivation; sessions are
stateless JWTs. The JSON-file store (ephemeral on Vercel) and the unverified wallet-link endpoint were removed.
Revisit when V1.1 needs history, search or more than the ~100 most recent factory transactions (see STATUS).

## ADR-004 Rounding favours the pool

Fee = ceil(2%); payouts round down. This moves at most a nanoton per trade toward the pool and makes insolvency
through repeated tiny trades impossible (tested). Not an economics change.

## ADR-005 Graduation via a liquidity manager wallet (custodial window)

On-chain STON.fi seeding from Tact could not be verified in the sandbox. V1 sends graduated liquidity to a liquidity
manager fixed at factory deploy (default: the deployer wallet); the keeper script seeds the STON.fi v2 pool and can
send the LP to the zero address. Trust: between `Migrate` and pool creation the liquidity manager holds the funds.
**Founder decision pending:** confirm the liquidity manager wallet and that LP is locked (SPEC says "locked LP").
V2: trustless on-chain migration.

## ADR-006 Deterministic token addresses from (factory, creator, salt)

The client derives the new token's address before sending, so it can wait for exactly that contract. A reused salt
refunds the creator and changes nothing.

## ADR-007 Operator scripts refuse mainnet without explicit approval

`deploy:mainnet`, `graduate --execute` on mainnet and `launch-production.sh` require `MAINNET_GO_LIVE_APPROVED=yes`,
set only after the founder writes "MAINNET GO-LIVE APPROVED".
