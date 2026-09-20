# UIUX.md — Design System

## Color palette (TON brand)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ton-blue` | `#30A1F5` | Primary CTA, accents |
| `--bg` | `#0B0E11` | App background |
| `--surface` | `#151a20` | Cards |
| `--positive` | `#3DDC84` | Gains |
| `--negative` | `#FF5C72` | Losses |
| Legacy TON | `#0098EA` | Do not use (cleared) |

## Typography

- System stack: SF Pro Text / -apple-system / Segoe UI
- Base size: 15px

## Components

| Component | File |
|-----------|------|
| BottomNav | `src/components/BottomNav.tsx` |
| BondingCurve | `src/components/BondingCurve.tsx` |
| ConnectButton | `src/components/ConnectButton.tsx` |
| TokenAvatar | `src/components/TokenAvatar.tsx` |
| Sparkline | `src/components/Sparkline.tsx` |

## Official assets

- Gram diamond: `src/assets/brand/gram_diamond_mark.svg`
- TON logo white: `src/assets/brand/ton_logo_white.svg`
- Nav icons: `src/assets/nav/*` (ton-org/kit-ios)

## TODO

- [ ] Add TON crystal loading GIF
- [ ] Add Telegram Wallet icon for connect button
- [ ] Add favicon.ico + apple-touch-icon (PNG 180×180)
