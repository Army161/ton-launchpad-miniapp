#!/usr/bin/env bash
# TON Launchpad — mainnet launch. Irreversible: spends real TON.
#
# Preconditions (see docs/LAUNCH.md):
#   - testnet gate passed (docs/VERIFICATION.md)
#   - founder wrote "MAINNET GO-LIVE APPROVED"
#   - .env.production filled locally (never committed)
#
#   set -a && source .env.production && set +a
#   MAINNET_GO_LIVE_APPROVED=yes ./scripts/launch-production.sh
#
# Safe to re-run: the factory deploy detects an existing deployment, and
# Vercel variables are overwritten with --force instead of duplicated.
# Secrets are passed to the Vercel CLI on stdin, never on the command line,
# and are never echoed. Do not add `set -x` to this file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

step() { printf '\n==> %s\n' "$1"; }
die() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }

[[ "${MAINNET_GO_LIVE_APPROVED:-}" == "yes" ]] || die 'Locked. Needs the testnet gate and the founder'"'"'s "MAINNET GO-LIVE APPROVED", then MAINNET_GO_LIVE_APPROVED=yes.'

step "1/5 Validate deploy configuration"
node scripts/validate-env.ts deploy-mainnet

step "2/5 Build and test contracts"
(cd contracts && npm ci --legacy-peer-deps && npm run build && npm test)

step "3/5 Deploy or verify the factory on mainnet"
(cd contracts && npm run deploy:mainnet)
FACTORY="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('contracts/deployed.mainnet.json','utf8')).factoryAddress)")"
[[ -n "$FACTORY" ]] || die "Factory address missing from contracts/deployed.mainnet.json"
echo "Factory: $FACTORY"
export FACTORY_ADDRESS="$FACTORY" VITE_FACTORY_ADDRESS="$FACTORY" VITE_NETWORK=mainnet

step "4/5 Validate the production runtime configuration"
# The runtime must not see the deploy mnemonic.
env -u DEPLOY_MNEMONIC node scripts/validate-env.ts production --network

step "5/5 Configure Vercel and deploy"
if ! command -v vercel >/dev/null 2>&1; then
  cat <<EOF
Vercel CLI not found. In https://vercel.com/dashboard → project → Settings →
Environment Variables (Production), set:
  FACTORY_ADDRESS=$FACTORY
  VITE_FACTORY_ADDRESS=$FACTORY
  VITE_NETWORK=mainnet
  PLATFORM_TREASURY_ADDRESS, TELEGRAM_BOT_TOKEN, JWT_SECRET,
  VITE_MANIFEST_URL, VITE_TWA_RETURN_URL (and TONCENTER_API_KEY if you have one)
Never add DEPLOY_MNEMONIC to Vercel. Then redeploy production.
EOF
  exit 0
fi

set_var() {
  local name="$1" value="${!1:-}"
  [[ -n "$value" ]] || { echo "  skip $name (not set)"; return 0; }
  printf '%s' "$value" | vercel env add "$name" production --force >/dev/null
  echo "  set  $name"
}
for name in FACTORY_ADDRESS VITE_FACTORY_ADDRESS VITE_NETWORK PLATFORM_TREASURY_ADDRESS \
            TELEGRAM_BOT_TOKEN JWT_SECRET VITE_MANIFEST_URL VITE_TWA_RETURN_URL TONCENTER_API_KEY; do
  set_var "$name"
done

vercel deploy --prod

PROD_URL="${VERCEL_PROD_URL:-https://ton-launchpad-miniapp.vercel.app}"
cat <<EOF

Launch steps done. Factory: $FACTORY
Next (manual, see docs/LAUNCH.md):
  - BotFather: point the Mini App and menu button at $PROD_URL
  - Run the production checks: /production-check
  - Smoke test in Telegram with the smallest amounts
EOF
