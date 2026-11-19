# CREATORSTUDIO.md — Token Creation Flow

## UX flow

1. User opens `/create`
2. Fills: name, ticker, description, image (https URL, upload, or a free AI image from a short description), optional
   Telegram link. The chosen image is previewed as a round avatar
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
  Returns 503 when Blob is not enabled; the creator can paste an https image URL instead. PNG, JPEG, WebP or GIF
  only (checked by content), 10 uploads per user per UTC day.
- Future: IPFS pinning

## AI image (ADR-012)

- Shown when `GET /api/image/generate` says `enabled`. The creator types a description (3 to 300 characters), picks
  Meta AI, Grok, ChatGPT or Gemini Nano Banana, and presses "Generate image"; Enter in the description does the same
  and never submits the launch.
- POST `/api/image/generate` (Telegram session required) returns the https URL of a 512 px JPEG, which fills the image
  URL field, and how many free images are left today (5 per user by default).
- It takes 5 to 40 seconds. The launch button is disabled meanwhile. Every failure is a sentence the creator can act
  on (wait, try other words, or upload or paste instead).

## TODO

- [x] Per-user upload rate limit (SECURITY #13, 2026-11-19)
- [ ] Preview card before launch (the image itself is previewed since 2026-11-19)
