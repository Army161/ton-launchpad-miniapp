# CLAUDE.md — operating contract for agents in this repo

## Mission

Finish and maintain TON Launchpad V1 without bypassing tests, security checks or deployment verification.
V1 economics are locked (2% trade fee, 60% creator / 40% platform, 1500 TON graduation); see `docs/SPEC.md`.

## Required workflow

Before modifying code:

1. Inspect the relevant implementation.
2. Inspect the related tests.
3. Inspect the relevant spec (`docs/SPEC.md`, `docs/ARCHITECTURE.md`).
4. Identify the expected behaviour.
5. Write or fix tests where appropriate (for contracts: sandbox tests in `contracts/tests`).
6. Implement.
7. Run the targeted tests.
8. Run the full applicable verification (`/verify`).
9. Update the documentation that describes the behaviour.
10. Record status in `docs/STATUS.md` and evidence in `docs/VERIFICATION.md`.

## Core commands

App and API (repo root, Node 22):

```bash
npm ci
npm run lint
npm test          # vitest: auth, JWT, client encoding, env rules, feed fail-safes
npm run build     # tsc -b (app + api + scripts) and vite build
npx vercel dev    # full app with /api locally
```

Contracts:

```bash
cd contracts
npm ci --legacy-peer-deps
npm run build     # compiles Tact and syncs wrappers into src/contracts
npm run typecheck
npm test          # sandbox tests against the compiled contracts
```

Configuration: `node scripts/validate-env.ts <deploy-testnet|deploy-mainnet|production> [--network]`.

Never mark a task complete unless its applicable checks pass.

## Repository rules

- Never commit secrets, `.env.production` or any `.env.*` other than `.env.example`.
- Never expose or print mnemonic phrases, Telegram bot tokens or JWT secrets, including in logs.
- Never store production secrets in documentation.
- Never put secret values in client-side `VITE_*` variables.
- Never bypass, skip or weaken failing smart-contract tests.
- Never deploy mainnet changes that have not passed the testnet gate (`docs/VERIFICATION.md`).
- Never run `scripts/launch-production.sh` or any mainnet deploy without the founder's explicit "MAINNET GO-LIVE APPROVED".
- Never overwrite founder wallet configuration (treasury, liquidity manager) without explicit authorization.
- `src/contracts/*` is generated; change the Tact source and rebuild instead.

## Documentation rule

When behaviour changes, update the corresponding spec/status document in the same change.
Document map: `docs/SPEC.md` (what V1 is), `docs/ARCHITECTURE.md` (how it works), `docs/ENVIRONMENT.md` (variables),
`docs/SECURITY.md` (threats and findings), `docs/VERIFICATION.md` (evidence per requirement),
`docs/EXECUTION.md` (runbooks), `docs/STATUS.md` (current state), `docs/DECISIONS.md` (ADRs), `docs/LAUNCH.md` (go-live).
