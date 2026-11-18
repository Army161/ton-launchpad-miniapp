# INTEGRATE.md — External API Wiring

## STON.fi

- **Endpoint:** `https://api.ston.fi/v1/assets`
- **Use:** Graduated token prices, images
- **File:** `src/pages/Home.tsx`

## DexScreener

- **Endpoint:** `https://api.dexscreener.com/token-pairs/v1/ton/{address}`
- **Use:** 24h price change %
- **File:** `src/lib/dexscreener.ts`

## CoinGecko

- **Endpoint:** `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`
- **Use:** TON/USD reference price
- **File:** `src/lib/coingecko.ts`

## TonAPI

- **Endpoint:** `https://tonapi.io/v2/*`
- **Use:** Wallet jetton balances (My Tokens)
- **File:** `src/lib/tonapi.ts`
- **Auth:** none. The browser uses the public tier; no key is ever shipped to clients (`VITE_TONAPI_KEY` was removed).

## On-chain

- **Server:** `/api/tokens*` read the factory's transactions and each jetton's `get_curve_state` / `get_jetton_data`
  through toncenter (`api/_lib/chain.ts` via `api/_lib/toncenter.ts`: spaced requests, retries on HTTP 429, 5xx and
  timeouts, a 7 s budget per API request; `get_jetton_data` once per token and instance, since the content never
  changes). `TONCENTER_API_KEY` is server-only and needed in practice on mainnet (`docs/ENVIRONMENT.md`).
- **Client:** `src/lib/contracts.ts` builds messages for TON Connect and computes quotes from the live reserves.

## Failure behaviour

Every external feed resolves to an empty list, `null` or "—" on network errors, HTTP errors and malformed JSON, and
never invents data (`tests/external-feeds.test.ts`). The app's own API resolves to an `error` result instead, which
the pages show as "try again shortly" with a Try again button, never as "no tokens" or "not found".

When toncenter cannot be read, the app's own API answers 503 with `Retry-After` instead of "not a launchpad token".
The token list then shows each token as last read; it leaves out only tokens never read, says `partial: true` and is
cached for 5 s; and when the factory's transactions cannot be read it serves the last list again
(`tests/api-tokens.test.ts`).

## TODO

- [ ] Add rate-limit backoff for CoinGecko demo tier (a 60 s cache exists)
- [ ] Cache TonAPI responses (30s TTL)
