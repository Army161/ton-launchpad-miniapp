---
description: Run the full local verification (contracts, app, API) and record the result
---

Run every check below from the repo root and report each as PASS/FAIL with the counts. Stop and diagnose on the first
failure; never skip, weaken or edit a test to make it pass.

```bash
(cd contracts && npm ci --legacy-peer-deps && npm run build && npm run typecheck && npm test)
git diff --exit-code -- src/contracts          # generated wrappers match the Tact source
npm ci && npm run lint && npm test && npm run build
grep -rlE 'TELEGRAM_BOT_TOKEN|JWT_SECRET|DEPLOY_MNEMONIC|TONCENTER_API_KEY|BLOB_READ_WRITE_TOKEN' dist && echo "LEAK" || echo "bundle clean"
git ls-files | grep -E '^\.env' | grep -v '^\.env\.example$' && echo "TRACKED ENV FILE" || echo "no tracked env files"
```

Then update the "Build and static gates" table in `docs/VERIFICATION.md` and the gate table in `docs/STATUS.md`
with the actual numbers and the commit hash (`git rev-parse --short HEAD`).
