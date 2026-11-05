// Copies the generated Tact wrappers the web app needs into src/contracts so
// the app resolves @ton/core from its own node_modules. Run by `npm run build`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = join(here, '..', 'build');
const outDir = join(here, '..', '..', 'src', 'contracts');
const wrappers = ['LaunchpadFactory', 'LaunchpadJetton', 'JettonWallet'];

mkdirSync(outDir, { recursive: true });
for (const name of wrappers) {
  const src = readFileSync(join(buildDir, `Launchpad_${name}.ts`), 'utf8');
  const header = '// @ts-nocheck\n// GENERATED from contracts/build by contracts/scripts/sync-wrappers.mjs. Do not edit.\n';
  writeFileSync(join(outDir, `${name}.ts`), header + src);
}
console.log(`Synced ${wrappers.length} wrappers to src/contracts`);
