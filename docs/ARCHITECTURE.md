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

Events are emitted as external messages: `TokenLaunched`, `TradeEvent`, `ReferralPaidEvent`, `GraduatedEvent`,
`MigratedEvent`.

### Curve maths

`k = virtualTon × virtualTokens`; buy: `tokensOut = virtualTokens − ceil(k / (virtualTon + tonIn − fee))`;
sell: `grossTon = virtualTon − ceil(k / (virtualTokens + tokensIn))`, seller gets `grossTon − fee`.
`fee = ceil(amount × 2%)`, `creatorFee = floor(fee × 60%)`, `platformFee = fee − creatorFee`.
On a buy with `referrer` set (and not the buyer): `referrerFee = floor(fee × 20%)` if that is ≥ 0.0005 TON, else 0;
`platformFee` drops by `referrerFee`. The referrer is paid with a non-bouncing message, so a bad referrer address
cannot block a buy. Deep links must fit Telegram's 64-character `startapp` limit, so they will carry a short launch id
and referral code resolved by the API, not raw addresses (not built yet).
Invariants tested after every trade: `virtualTon − 30 TON = realTonRaised`, `virtualTokens + totalSupply = 1B`,
contract balance ≥ `realTonRaised` + storage buffer.

### Graduation

The buy that brings `realTonRaised` to ≥ 1,500 TON sets `graduated`; buys and curve sells then fail (and refund).
`Migrate` (permissionless, anyone can send it with 0.05 TON) seeds the STON.fi v2 pool from the contract itself
(ADR-009): it mints the remaining curve inventory (`virtualTokens`, ≈ 19.6M tokens at exactly 1,500 TON) straight to
the router's jetton wallet and sends the reserve minus 0.65 TON of DEX gas to the router's pTON wallet. Both legs
carry the same STON.fi `provide_lp` payload: LP receiver = the zero address (locked for good), `min_lp_out` = 99% of
`sqrt(ton × tokens)`, refund address = the liquidity manager, excesses = the treasury, 15-minute deadline. Nobody
holds the liquidity on the normal path. The final curve price and the pool's opening price match to within ~2%.
If STON.fi refunds the provision (a pool created earlier at another price fails `min_lp_out`) or a leg bounces, the
liquidity goes to the liquidity manager, which seeds manually with `graduate.ts --fallback`.

## API (`api/`, Vercel functions)

| Route | Purpose |
|---|---|
| `POST /api/auth/telegram` | verifies `initData`, returns a 24 h JWT and the Telegram profile |
| `GET /api/tokens` | lists launches found in the factory's transactions, newest first; every token is proven to come from our factory (address re-derived from `(factory, creator, salt)`). Cached for 20 s in memory and 15 s at the edge. A token whose read fails is shown as last read on that instance; a token never read there is left out and the list says `partial: true`, and then (or while a launch of the last minute still reads as not deployed) the list is cached for only 5 s (`s-maxage=5`). One refresh at a time per instance. If the factory's transactions cannot be read, the last list is served again for 5 s; with no list yet, 503 with `Retry-After` |
| `GET /api/tokens/:address[?holder=]` | live curve state and optionally the holder's balance, never cached. 404 only when the chain answers that the address is not one of our tokens; 503 with `Retry-After` and `no-store` when toncenter cannot be read. When only the balance cannot be read, 200 with the token and no `balance` |
| `POST /api/metadata/upload` | authenticated image upload to Vercel Blob (503 if Blob is not enabled) |
| `GET /api/health` | configuration presence flags only |

There is no database: the chain is the source of truth for tokens, and sessions are stateless (ADR-003).

### Chain reads

`api/_lib/chain.ts` reads toncenter v2 through `api/_lib/toncenter.ts`, one session per API request. The session
starts requests at least 1.1 s apart without `TONCENTER_API_KEY` and 120 ms apart with it, retries HTTP 429, HTTP 5xx
and requests with no answer (timeouts, resets) with jittered exponential backoff, at most 4 attempts per request, and
stops at a 7 s budget per API request (each attempt's HTTP timeout, at most 5 s, is cut to what is left). A getter
exit code (no such getter, or nothing deployed), an uninitialized curve, another factory or an address the factory
would not derive means "not our token". Running out of retries
or budget throws `ChainUnavailableError`, which the endpoints answer with 503. Getter exit codes, malformed responses
and other 4xx are never retried. A token read is 1 request (`get_curve_state`), plus `get_jetton_data` the first time
an instance reads the token: the jetton content is written once by the factory's setup and never changes, so it is
kept in memory. A holder balance is 2 more requests (account state, `get_wallet_data`).

The list costs 1 request (the factory's transactions) plus 1 per token, and one 7 s budget fits about 50 requests with
`TONCENTER_API_KEY` (6 without). So a refresh reads the tokens never read on that instance first, then the ones read
longest ago, and leaves the rest as last read: with a key it reads about 46 known tokens or 22 new ones (33 or 15 when
toncenter takes 500 ms per getter), and successive refreshes cover the whole list (at most 100 factory transactions,
`docs/STATUS.md`). Without a key it reads about 5 known tokens or 2 new ones per refresh, so a fresh instance needs
several refreshes, 5 s apart, to list everything.

## Front end (`src/`)

- `lib/contracts.ts` — message builders (tested byte-for-byte against the compiled ABI), curve maths, exact decimal parsing.
- `lib/metadata.ts` — TEP-64 on-chain metadata build/parse and validation.
- `contracts/*` — generated Tact wrappers used to derive token and wallet addresses.
- Pages: Home (launchpad from `/api/tokens`, graduated from STON.fi), Create, TokenDetail, Buy, Sell, My Tokens, Profile.
- When `/api/tokens` cannot be loaded, Home says "Could not load tokens. Try again shortly." with a Try again button
  (and fetches once more after 5 s by itself), never "No launchpad tokens yet". A `partial` list gets the line "Some
  tokens could not be loaded right now." My Tokens says when the tokens you created may be missing.
- Token pages (TokenDetail, Buy, Sell) retry a failed lookup every 5 s for a minute and offer Try again.
- After sending, pages poll `/api/tokens/:address` until the trade count moves, then show confirmation. If 90 s pass
  without that, Buy and Sell say the trade is not confirmed yet and ask the user to check their wallet history before
  trying again, in a toast and in a notice that stays on the page until dismissed or a later trade confirms. They
  never claim a refund, because the API may simply have been unable to read the chain. An unconfirmed launch opens the
  token page, which keeps looking for the token for a minute and says "Your launch is not confirmed yet. Check your
  wallet history before launching again." until it loads.
- TON Connect uses the SDK's remote wallets list as is (no hand-written wallet entries).
