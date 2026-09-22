---
description: Security review of the current diff or the whole repo against docs/SECURITY.md
---

Review `$ARGUMENTS` (default: `git diff main...HEAD`) for:

1. **Contracts** — who may send each message; can any path pay out more than `realTonRaised` allows, mint without
   payment, or be triggered by a forged sender (sell burns must come from `initOf JettonWallet(sender, minter)`);
   is `nativeReserve` taken before every send; do bounces restore state; do sandbox tests cover each new path.
2. **Secrets** — nothing secret in `VITE_*`, logs, docs, test fixtures or git history (`git log -p -S <name>`);
   `.env.*` still ignored; no `set -x` near secrets in scripts.
3. **API** — auth required where state or cost is involved; initData/JWT compares stay constant-time; inputs bounded;
   errors do not echo internals.
4. **Operator scripts** — mainnet actions still require `MAINNET_GO_LIVE_APPROVED=yes`; nothing changes the treasury
   or liquidity manager without the founder.
5. **Dependencies** — `npm audit --omit=dev` at the root and `npm audit` in `contracts/`.

Report findings as a table (severity, finding, file:line, fix) and add new ones to `docs/SECURITY.md`. Any CRITICAL or
HIGH blocks launch until fixed and re-tested.
