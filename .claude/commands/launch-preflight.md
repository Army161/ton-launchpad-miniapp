---
description: GO/NO-GO check before any deployment. Never deploys anything.
---

This command only inspects. It must not run `scripts/launch-production.sh`, `npm run deploy:*` without `--dry-run`,
or `graduate --execute`, and must not ask for or print any secret value.

1. Run `/verify`. Any failure → NO-GO.
2. `docs/SECURITY.md` has no open CRITICAL/HIGH → otherwise NO-GO.
3. Ask the founder to run locally (values stay on their machine) and report only PASS/FAIL:
   - testnet: `node scripts/validate-env.ts deploy-testnet`
   - mainnet: `node scripts/validate-env.ts deploy-mainnet` and
     `env -u DEPLOY_MNEMONIC node scripts/validate-env.ts production --network`
   - `cd contracts && npm run deploy:<network> -- --dry-run` and confirm the printed deployer address is theirs.
4. For mainnet additionally require, with evidence in `docs/VERIFICATION.md`:
   - the testnet gate passed (factory, create, buy, sell, fee split, refunds recorded in `docs/STATUS.md`);
   - the founder has written "MAINNET GO-LIVE APPROVED" in the project;
   - ADR-005 (liquidity manager, LP lock) is decided.
5. Output `GO` or `NO-GO` with the failing items. For missing secrets use exactly:
   "Human action required: Enter <VARIABLE> into <LOCAL FILE / VERCEL SECRET FIELD>. Do not send the value to me.
   Tell me only when the value has been configured."
