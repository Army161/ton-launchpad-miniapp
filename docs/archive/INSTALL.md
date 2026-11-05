# INSTALL.md — Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+
- TON wallet (Tonkeeper) for testnet/mainnet txs

## Frontend

```bash
npm install
cp .env.example .env.local   # fill VITE_* vars
npm run dev
```

## Contracts

```bash
cd contracts
npm install
npm run build
npm test
```

## Environment

See `.env.example` for all required variables.

## TODO

- [ ] Add Docker compose for local API + Redis (optional)
