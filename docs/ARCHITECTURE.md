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
| `GET /api/tokens` | lists launches found in the factory's transactions, newest first; every token is proven to come from our factory (address re-derived from `(factory, creator, salt)`). Cached for 20 s in memory and 15 s at the edge. A token whose read fails is shown as last read on that instance if that was in the last 30 minutes; a token never read there, or not in that time, is left out and the list says `partial: true`, and then (or while a launch of the last minute still reads as not deployed) the list is cached for only 5 s (`s-maxage=5`). One refresh at a time per instance. If the factory's transactions cannot be read, the last list is served again for 5 s as long as it was read in the last 5 minutes; after that, or with no list yet, 503 with `Retry-After` |
| `GET /api/tokens/:address[?holder=]` | live curve state and optionally the holder's balance, never cached. 404 only when the chain answers that the address is not one of our tokens; 503 with `Retry-After` and `no-store` when toncenter cannot be read. When only the balance cannot be read, 200 with the token and no `balance` |
| `POST /api/metadata/upload` | authenticated image upload to Vercel Blob (503 if Blob is not enabled) |
| `GET /api/health` | configuration presence flags only |

There is no database: the chain is the source of truth for tokens, and sessions are stateless (ADR-003).

### Chain reads

`api/_lib/chain.ts` reads toncenter v2 through `api/_lib/toncenter.ts`, one session per API request. The session
starts requests one at a time, at least 1.1 s apart without `TONCENTER_API_KEY` and 120 ms apart with it, counted
from when the previous request actually started (a timer that fires late delays the next request rather than letting
two start together). It retries HTTP 429, HTTP 5xx and requests with no complete answer (timeouts, resets, a body
that breaks off after the headers) with jittered exponential backoff, at most 4 attempts per request, and stops at a
7 s budget per API request: each attempt's HTTP timeout, at most 5 s, is what is left of the budget when the attempt
actually starts, and no attempt starts with less than 1 s left. That HTTP timeout stops counting once the headers are
in, so the session also ends an attempt still running 250 ms after it (a body that trickles in) and treats it as a
timeout: an API request never runs more than 250 ms past its budget. Retries come from one budget per instance,
shared by every request it serves: every 5 first attempts earn one retry, up to a reserve of 10. An occasional 429 is
retried as before, but when most reads fail (toncenter rate limiting us, or a flood of lookups for random addresses)
retries stop once the reserve is spent, so each request costs about one attempt instead of four. Instances do not
share it; a per-IP rate limit in front of `/api/tokens/*` is what would bound the total (`docs/SECURITY.md` #24). A
getter exit code (no such getter, or nothing deployed), an uninitialized curve, another factory or an address the
factory would not derive means "not our token". Running out of retries or budget throws `ChainUnavailableError`,
which the endpoints answer with 503. Getter exit codes, malformed responses and other 4xx are never retried. A token
read is 1 request (`get_curve_state`), plus `get_jetton_data` the first time an instance reads the token: the jetton
content is written once by the factory's setup and never changes, so it is kept in memory. The text is held to the
Create page's limits first (name 32, symbol 10, description 200 characters; an image or Telegram link over 256 is
dropped), since a launch made outside the app can store far more and every list would carry it. A holder balance is 2
more requests (account state, `get_wallet_data`).

The list costs 1 request (the factory's transactions) plus 1 per token, and one 7 s budget fits about 50 requests
with `TONCENTER_API_KEY` (6 without). So a refresh reads the launches never read on that instance first, then the
ones read longest ago, and leaves the rest as last read. A launch that read as not deployed is read first again only
during its first minute (it may still be deploying); after that it takes its turn by when it was last read, like a
token, so launches that never deploy cannot use up every refresh before a token is read, and one that cannot be read
is not counted as a missing token. Last-good data has an age limit: a failed read is filled in only from a view read
in the last 30 minutes (longer than a full round of re-reads, about a minute with a key and up to about 15 minutes
without one on a quiet instance), and a list is served again after a failed refresh only if it was read in the last 5
minutes; after that the endpoint answers 503. So an outage of toncenter shows as one, not as a list frozen in time.
With a key a refresh reads about 46 known tokens or 22 new ones (33 or 15 when toncenter takes 500 ms per getter),
and successive refreshes cover the whole list (at most 100 factory transactions, `docs/STATUS.md`). Without a key it
reads about 5 known tokens or 2 new ones per refresh, so a fresh instance needs several refreshes, 5 s apart, to list
everything (`tests/api-tokens-progress.test.ts` pins both rates).

## Front end (`src/`)

- `lib/contracts.ts` — message builders (tested byte-for-byte against the compiled ABI), curve maths, exact decimal parsing.
- `lib/metadata.ts` — TEP-64 on-chain metadata build/parse and validation.
- `contracts/*` — generated Tact wrappers used to derive token and wallet addresses.
- Pages: Home (launchpad from `/api/tokens`, graduated from STON.fi), Create, TokenDetail, Buy, Sell, My Tokens, Profile.
- When `/api/tokens` cannot be loaded, Home says "Could not load tokens. Try again shortly." with a Try again button
  (and fetches once more after 5 s by itself), never "No launchpad tokens yet". A `partial` list gets the line "Some
  tokens could not be loaded right now." My Tokens says when the tokens you created may be missing.
- Token pages (TokenDetail, Buy, Sell) retry a failed lookup 5 s after it ended, up to 12 times in a row, also while
  they show the token as Home listed it, and offer Try again. Only the newest lookup's answer is used: a late answer
  (an earlier lookup, or the token the page showed before) never replaces a newer one. A page that moves to another
  token or wallet starts from what is known about that one, never from the previous one. A mangled address (HTTP 400)
  reads as "Token not found." and is not retried.
- Buy and Sell trade only on a live read: until the page's latest lookup has succeeded (and again whenever one
  fails), Confirm is disabled and the page says it is loading the live price, or that it could not, with Try again.
  So the quote, the minimum received, the balance and the confirmation baseline (the trade count) never come from
  the list's copy or a lookup that failed. After a confirmed trade the page takes the lookup that confirmed it; after
  a timeout it looks the token up again. TokenDetail says when its numbers may be out of date.
- After sending, pages poll `/api/tokens/:address` until the trade count moves, then show confirmation. If 90 s pass
  without that, Buy and Sell say the trade is not confirmed yet and ask the user to check their wallet history before
  trying again, in a toast and in a notice that stays on the page until dismissed or a later trade confirms. They
  never claim a refund, because the API may simply have been unable to read the chain. An unconfirmed launch opens the
  token page, which keeps looking for the token for a minute and says "Your launch is not confirmed yet. Check your
  wallet history before launching again." until it loads.
- TON Connect uses the SDK's remote wallets list as is (no hand-written wallet entries).
