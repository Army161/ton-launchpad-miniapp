# DESIGN.md — UI/UX Specification

> **Status:** `DESIGN_PIXEL_PASS = WAITING_FOR_FOUNDER_ASSET`. Functional UI is complete; the pixel pass starts when
> mockups or a Figma file are uploaded. It must not change contract or transaction behaviour.

## Reference launchpads

- **Pons** — Robinhood Chain: minimal create flow, bonding curve card, buy/sell sheets
- **Tolly** — Arc: terminal + launchpad hybrid
- **Blum Memepad** — TON Telegram-native, in-chat trading
- **TonPump** — low launch fee, simple cards

## Screens (current repo)

| Screen | Route | Status |
|--------|-------|--------|
| Home | `/` | Built — tabs Launchpad / Graduated |
| Creator Studio | `/create` | Built |
| Token detail | `/token/:id` | Built |
| Buy / Sell | `/buy/:id`, `/sell/:id` | Built — live quotes, 1% slippage, signing → confirming → done |
| Explore | `/explore` | Placeholder (V1.1) |
| My Tokens | `/my-tokens` | Built — wallet jettons via TonAPI |
| Profile | `/profile` | Built — Telegram profile and wallet |

## Design tokens (locked)

- TON blue: `#30A1F5`
- Background: `#0B0E11`
- Surface: `#151a20`
- Positive: `#3DDC84` · Negative: `#FF5C72`

## TODO

- [ ] Import founder mockups when uploaded
- [ ] Pixel-diff each screen vs mockups
- [ ] Finalize Profile tab icon (interim user icon)
