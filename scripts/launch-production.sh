#!/usr/bin/env bash
# TON Launchpad — one-shot production launch script
# Run from repo root. Requires env vars (see docs/LAUNCH.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== TON Launchpad Production Launch ==="

# ── 1. Validate required env ─────────────────────────────────────────────────
MISSING=()
[[ -z "${PLATFORM_TREASURY_ADDRESS:-}" ]] && MISSING+=("PLATFORM_TREASURY_ADDRESS")
[[ -z "${DEPLOY_MNEMONIC:-}" ]] && MISSING+=("DEPLOY_MNEMONIC")
[[ -z "${TELEGRAM_BOT_TOKEN:-}" ]] && MISSING+=("TELEGRAM_BOT_TOKEN")
[[ -z "${JWT_SECRET:-}" ]] && MISSING+=("JWT_SECRET")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${MISSING[@]}"
  echo ""
  echo "Copy .env.example to .env.production and fill values, then:"
  echo "  set -a && source .env.production && set +a && ./scripts/launch-production.sh"
  exit 1
fi

# ── 2. Build & test contracts ────────────────────────────────────────────────
echo "→ Building contracts..."
cd contracts
npm ci --legacy-peer-deps
npm run build
npm test
cd "$ROOT"

# ── 3. Deploy factory to mainnet ─────────────────────────────────────────────
echo "→ Deploying LaunchpadFactory to mainnet..."
cd contracts
npm run deploy:mainnet
FACTORY=$(node -e "console.log(JSON.parse(require('fs').readFileSync('deployed.json','utf8')).factoryAddress)")
cd "$ROOT"
echo "   Factory: $FACTORY"

# ── 4. Set Vercel env vars (requires vercel CLI + login) ─────────────────────
if command -v vercel >/dev/null 2>&1; then
  echo "→ Setting Vercel environment variables..."
  vercel env add VITE_FACTORY_ADDRESS production <<< "$FACTORY" 2>/dev/null || vercel env rm VITE_FACTORY_ADDRESS production -y && vercel env add VITE_FACTORY_ADDRESS production <<< "$FACTORY"
  vercel env add FACTORY_ADDRESS production <<< "$FACTORY" 2>/dev/null || true
  vercel env add PLATFORM_TREASURY_ADDRESS production <<< "$PLATFORM_TREASURY_ADDRESS" 2>/dev/null || true
  vercel env add TELEGRAM_BOT_TOKEN production <<< "$TELEGRAM_BOT_TOKEN" 2>/dev/null || true
  vercel env add JWT_SECRET production <<< "$JWT_SECRET" 2>/dev/null || true
  [[ -n "${VITE_TWA_RETURN_URL:-}" ]] && vercel env add VITE_TWA_RETURN_URL production <<< "$VITE_TWA_RETURN_URL" 2>/dev/null || true
  [[ -n "${VITE_MANIFEST_URL:-}" ]] && vercel env add VITE_MANIFEST_URL production <<< "$VITE_MANIFEST_URL" 2>/dev/null || true
  vercel env add VITE_NETWORK production <<< "mainnet" 2>/dev/null || true

  echo "→ Deploying to Vercel production..."
  vercel deploy --prod
else
  echo "WARN: vercel CLI not found. Set env vars manually in Vercel Dashboard:"
  echo "  VITE_FACTORY_ADDRESS=$FACTORY"
  echo "  FACTORY_ADDRESS=$FACTORY"
  echo "  PLATFORM_TREASURY_ADDRESS=$PLATFORM_TREASURY_ADDRESS"
  echo "  TELEGRAM_BOT_TOKEN=***"
  echo "  JWT_SECRET=***"
  echo "  VITE_NETWORK=mainnet"
fi

# ── 5. BotFather reminder ────────────────────────────────────────────────────
PROD_URL="${VERCEL_PROD_URL:-https://ton-launchpad-miniapp.vercel.app}"
echo ""
echo "=== Launch complete ==="
echo "Factory:  $FACTORY"
echo "App URL:  $PROD_URL"
echo ""
echo "BotFather steps (manual):"
echo "  1. Open @BotFather → /myapps → your app → Edit link"
echo "  2. Set URL: $PROD_URL"
echo "  3. /setmenubutton → your bot → URL: $PROD_URL"
echo ""
echo "Update public/tonconnect-manifest.json url/iconUrl to $PROD_URL if using custom domain."
