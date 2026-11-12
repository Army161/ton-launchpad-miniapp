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

## ADR-005 Graduation via a liquidity manager wallet (custodial window) — superseded by ADR-009

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

## ADR-008 Referral share on buys, funded from the platform share

Decided by the founder on 2026-09-27 (option "Platform share"). A `Buy` may name a `referrer`; it receives 20% of the
trade fee, taken from the platform's 40%, so the split on a referred buy is creator 60 / platform 20 / referrer 20.
The creator's income never changes. Sells, self-referrals and cuts below `REFERRAL_DUST` (0.0005 TON) pay no referrer;
the cut stays with the platform. The threshold comes from sandbox measurements: a fee message costs about
0.00008 TON (forward + receive), so smaller payouts would be mostly gas. Added before the contract freeze because
changing `Buy` after deploy would need a new factory.

## ADR-009 Graduation seeds STON.fi on-chain; LP locked; no custodial window

Decided by the founder on 2026-11-05 (option "Build on-chain"), replacing ADR-005 before any factory deploy.
`Migrate` sends both legs of a STON.fi v2 `provide_lp` from the token contract: the remaining supply is minted to
the router's jetton wallet (`transfer_notification` carries the payload) and the reserve goes through the router's
pTON wallet (`ton_transfer`, op 0x01f3835d). Layouts follow `@ston-fi/sdk` 2.7 (`RouterV2_1`, `PtonV2_1`). The router
and its pTON wallet are fixed at factory deploy (`DexConfig`); the deploy script checks the router is v2
constant-product with pool creation on and that the pTON master maps the router to that pTON wallet.

- LP goes to the zero address, so the pool's liquidity is locked from the moment it exists.
- `min_lp_out` is 99% of a fresh pool's `sqrt(ton × tokens)`. A pool that already holds liquidity at a different
  price mints less, so STON.fi does not add the liquidity: it parks both legs in the liquidity manager's LP account
  on that pool (corrected 2026-11-12 from STON.fi's source; earlier text said "refunds"). ADR-010 makes this case
  unreachable before graduation.
- Refunds and bounced legs go to the liquidity manager, the only remaining trust point, used only on that failure
  path (`graduate.ts --fallback`).
- 0.65 TON of the reserve pays the DEX gas, so the trigger needs only 0.05 TON and anyone can run it.
- The sandbox has no STON.fi contracts, so tests check the exact messages sent; the testnet rehearsal must show a real
  pool with LP at the zero address before mainnet (`docs/VERIFICATION.md`).

## ADR-010 The router's jetton wallet is closed until graduation (router wallet guard)

Decided 2026-11-12, before any factory deploy. Found while checking ADR-009 against STON.fi v2's source: tokens are
transferable during the curve, so anyone could create the token/TON pool on the configured router early, at a
skewed price, for about 1 TON of gas. Every graduation would then miss `min_lp_out` and land in the liquidity
manager's LP account instead of a locked pool. STON.fi only adds a token to a pool from a `transfer_notification`
sent by that token's jetton wallet owned by the router, so that one wallet is the choke point.

- `JettonWallet` takes the token's router as a third init field (it changes every wallet address; clients pass the
  router from `get_curve_state`). The router's own wallet starts with `get_dex_guard() = 0xFFFFFFFF` and refuses
  every incoming transfer ("DEX closed until graduation"); the sender keeps the jettons and gets the TON back.
- The graduation mint from the token contract opens it. For `DEX_LP_GUARD` (600 s) after that it still refuses
  transfers whose payload the router would read as `provide_lp` (first reference, first 32 bits, exactly as the
  router parses it), so nobody can race a deposit into the pool before the curve's own pair is added. Swaps (DEX
  sells) pass at once. Outgoing transfers from the router's wallet are never restricted.
- Every other wallet has guard 0 and behaves as plain TEP-74.
- `DEX_DEADLINE` goes from 15 minutes to 1 day, so a slow network cannot split the two legs (a late leg is refused by
  the router while the other stays in the token contract's LP account, which nobody can empty).
- A wallet bounce now also returns the unspent TON to the owner (a rejected sell used to leave about 0.07 TON in the
  seller's jetton wallet).
- Consequence for operators: the liquidity manager's fallback deposit (`provide_lp` from its own wallet) is refused for
  the first 10 minutes after migration; the graduation tool must wait for `get_dex_guard`.
