# GHREPO.md — Repository Guide

## Remote

- **URL:** https://github.com/Army161/ton-launchpad-miniapp
- **Branch:** `clawdbot-permanent` (active)
- **CI branch:** `main` + `clawdbot-permanent` (updated)

## Structure

```
├── src/           # React Mini App
├── contracts/     # Tact smart contracts
├── api/           # Vercel serverless
├── public/        # Static + TON Connect manifest
├── docs/          # Project documentation
├── scripts/       # Deploy helpers
└── .github/workflows/vercel-deploy.yml
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | oxlint |

## TODO

- [ ] Protect `main` branch after V1 ship
