/**
 * Validates configuration before a deploy. Prints PASS/FAIL per variable and
 * never prints a value. Exits non-zero if anything fails (fail closed).
 *
 *   set -a && source .env.production && set +a
 *   node scripts/validate-env.ts production [--network]
 *   node scripts/validate-env.ts deploy-testnet
 *   node scripts/validate-env.ts deploy-mainnet
 */
import { checkManifest, validate, type Profile } from './env/rules.ts';

const PROFILES: Profile[] = ['deploy-testnet', 'deploy-mainnet', 'production'];

async function main() {
  const profile = process.argv[2] as Profile;
  if (!PROFILES.includes(profile)) {
    console.error(`Usage: node scripts/validate-env.ts <${PROFILES.join('|')}> [--network]`);
    process.exit(2);
  }
  const findings = await validate(profile, process.env);
  if (process.argv.includes('--network') && process.env.VITE_MANIFEST_URL) {
    findings.push(...(await checkManifest(process.env.VITE_MANIFEST_URL)));
  }
  for (const f of findings) console.log(`${f.ok ? 'PASS' : 'FAIL'}  ${f.name.padEnd(28)} ${f.message}`);
  const failed = findings.filter((f) => !f.ok).length;
  console.log(failed === 0 ? `\n${profile}: GO` : `\n${profile}: NO-GO (${failed} failing)`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
