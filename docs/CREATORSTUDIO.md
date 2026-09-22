# CREATORSTUDIO.md — Token Creation Flow

## UX flow

1. User opens `/create`
2. Fills: name, ticker, description, image (upload or https URL), optional Telegram link
3. Optional: initial buy (0 or 0.01–100 TON)
4. Connect wallet (TON Connect)
5. Approve one transaction to the factory: `CreateToken` with 0.05 TON launch fee + initial buy + 0.15 TON gas
   (unused gas is refunded)
6. The app waits until the new jetton (address derived in advance) is live on-chain, then opens `/token/{address}`

## Contract message (`src/lib/contracts.ts` → `buildCreateTokenBody`)

```ts
CreateToken {
  queryId: uint64,
  salt: uint64,          // random; token address = f(factory, creator, salt)
  content: Cell,         // TEP-64 on-chain metadata (src/lib/metadata.ts)
  initialBuyTon: coins,  // 0 or 0.01–100 TON in nanotons
}
```

Metadata limits (`validateMetadata`): name ≤ 32 characters, ticker 2–10 of A–Z/0–9, description ≤ 200,
image must be https, Telegram link must be https://t.me/….

## Image upload

- V1: POST `/api/metadata/upload` (Telegram session required, max 2 MB) → Vercel Blob → https URL.
  Returns 503 when Blob is not enabled; the creator can paste an https image URL instead.
- Future: IPFS pinning

## TODO

- [ ] Per-user upload rate limit (SECURITY #13)
- [ ] Preview card before launch
