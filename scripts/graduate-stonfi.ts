/**
 * Off-chain keeper: graduate a bonding curve token to STON.fi when cap is reached.
 * Run periodically via cron or GitHub Actions.
 *
 * Usage: FACTORY_ADDRESS=EQ... npx ts-node scripts/graduate-stonfi.ts <curveAddress>
 */
import { TonClient, Address } from '@ton/ton';

const STON_ROUTER_MAINNET = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt';

async function main() {
  const curveAddr = process.argv[2];
  if (!curveAddr) {
    console.error('Usage: graduate-stonfi.ts <curveAddress>');
    process.exit(1);
  }

  const endpoint =
    process.env.VITE_NETWORK === 'testnet'
      ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
      : 'https://toncenter.com/api/v2/jsonRPC';

  const client = new TonClient({ endpoint, apiKey: process.env.TONCENTER_API_KEY });

  console.log('Checking curve:', curveAddr);
  console.log('STON.fi router:', STON_ROUTER_MAINNET);
  console.log('TODO: call Graduate opcode + STON.fi pool creation via keeper wallet');
  console.log('See docs/SMARTCONTRACT.md for graduation flow');
}

main().catch(console.error);
