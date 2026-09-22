# TODOLIST.md — action items

Current state and evidence: `docs/STATUS.md`, `docs/VERIFICATION.md`. Founder steps in detail: `docs/LAUNCH.md`.

## Done in the repo (verified)

- [x] Contracts rewritten on TEP-74 with a solvent bonding curve (46 sandbox tests)
- [x] Buy mints to the buyer; sell burns from the seller's wallet and pays TON; 2% fee split 60/40 on every trade
- [x] Graduation at 1,500 TON, curve closed, one-time `Migrate`; keeper seeds STON.fi and can lock LP
- [x] Create / Buy / Sell pages send real transactions and wait for on-chain confirmation
- [x] API lists tokens from the chain, verified against the factory; no JSON-file store
- [x] Telegram initData and JWT hardened and tested
- [x] External feeds fail safe (tested)
- [x] Env validator, idempotent launch script locked behind approval, CI with secret-leak checks
- [x] Terms and Privacy pages for the TON Connect manifest

## Founder (only you can do these)

- [ ] Merge `claude/project-thread-6o05dp` into `main`
- [ ] Share the treasury address (public)
- [ ] BotFather: create bot and Mini App; share bot username and short name (public)
- [ ] Enter `TELEGRAM_BOT_TOKEN` and `JWT_SECRET` in Vercel (never in chat)
- [ ] Decide the liquidity manager wallet and confirm LP lock (ADR-005)
- [ ] Fund a testnet deployer wallet and run the testnet gate (`docs/EXECUTION.md`)
- [ ] Optional: enable Vercel Blob; add `TONCENTER_API_KEY` in Vercel
- [ ] Write "MAINNET GO-LIVE APPROVED", then run the launch script locally
- [ ] Upload design mockups for the pixel pass
- [ ] Optional: GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for CI deploys

## Engineering (after launch)

- [ ] Record testnet and mainnet evidence in STATUS and VERIFICATION
- [ ] `/api/tokens` pagination past the ~100 most recent factory transactions
- [ ] Upload rate limit
- [ ] Code-split trading pages (bundle 1.05 MB)
- [ ] Independent contract audit before real volume
