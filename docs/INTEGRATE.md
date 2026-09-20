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
- **Use:** Wallet balances, tx status, account events
- **File:** `src/lib/tonapi.ts`
- **Auth:** Optional `TONAPI_KEY` for higher rate limits

## On-chain (TON Connect + @ton/ton)

- Factory / curve getters for quotes and graduation state
- **File:** `src/lib/contracts.ts`

## TODO

- [ ] Add rate-limit backoff for CoinGecko demo tier
- [ ] Cache TonAPI responses (30s TTL)
