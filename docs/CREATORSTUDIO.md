# CREATORSTUDIO.md — Token Creation Flow

## UX flow

1. User opens `/create`
2. Fills: name, ticker, description, image, Telegram link
3. Optional: initial buy (0–100 TON)
4. Connect wallet (TON Connect)
5. Approve tx: `factory.createToken(...)` + 0.05 TON launch fee
6. Redirect to `/token/{jetton_address}`

## Contract params

```ts
createToken({
  name: string,        // max 32 chars
  symbol: string,      // max 10 chars
  imageUri: string,    // HTTPS or IPFS
  description: string,
  telegramLink: string,
  initialBuyTon: bigint, // 0 – 100 TON in nanotons
})
```

## Image upload

- V1: POST `/api/metadata/upload` → returns HTTPS URI
- Future: IPFS pinning

## TODO

- [ ] Add image size validation (max 2MB)
- [ ] Preview card before launch
