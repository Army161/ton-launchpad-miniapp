---
description: Check the live production deployment without changing it
---

Read-only checks against `${VERCEL_PROD_URL:-https://ton-launchpad-miniapp.vercel.app}`:

```bash
URL=${VERCEL_PROD_URL:-https://ton-launchpad-miniapp.vercel.app}
curl -fsS "$URL/api/health"                         # factoryConfigured and telegramAuthConfigured must be true
curl -fsS "$URL/tonconnect-manifest.json"            # url, iconUrl, termsOfUseUrl, privacyPolicyUrl
for p in /terms /privacy /icon-180.png; do curl -fsS -o /dev/null -w "%{http_code} $p\n" "$URL$p"; done
curl -fsS "$URL/api/tokens" | head -c 400           # JSON with a tokens array
```

With production values loaded locally, also run `env -u DEPLOY_MNEMONIC node scripts/validate-env.ts production --network`.
Confirm the deployed factory address equals `contracts/deployed.mainnet.json` and that its `get_factory_info`
treasury is the founder's address (tonviewer.com). Record results in `docs/VERIFICATION.md` → "Live and on-chain gates".
Never print environment values; report presence and PASS/FAIL only.
