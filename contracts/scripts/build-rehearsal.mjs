// Builds a testnet-only copy of the contracts whose graduation target is
// REHEARSAL_TARGET_TON (default 1.5 TON) instead of 1,500 TON, so the on-chain
// STON.fi graduation (ADR-009) can be proven with faucet TON. Output goes to
// build-rehearsal/ (git-ignored); the mainnet build in build/ is untouched.
//
//   npm run build:rehearsal
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'build-rehearsal');
const target = process.env.REHEARSAL_TARGET_TON ?? '1.5';
if (!/^\d+(\.\d+)?$/.test(target) || Number(target) < 1 || Number(target) >= 1500) {
  throw new Error('REHEARSAL_TARGET_TON must be a number from 1 to below 1500');
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'contracts'), join(out, 'src'), { recursive: true });

const messages = join(out, 'src', 'messages.tact');
const original = 'const GRADUATION_TARGET: Int = ton("1500");';
const src = readFileSync(messages, 'utf8');
if (!src.includes(original)) throw new Error('GRADUATION_TARGET line not found; update build-rehearsal.mjs');
writeFileSync(messages, src.replace(original, `const GRADUATION_TARGET: Int = ton("${target}"); // REHEARSAL BUILD, testnet only`));

writeFileSync(join(out, 'tact.config.json'), JSON.stringify({
  projects: [{ name: 'Launchpad', path: 'src/launchpad.tact', output: 'out', options: { debug: false, external: false } }],
}, null, 2));
execFileSync(process.execPath, [join(root, 'node_modules/@tact-lang/compiler/bin/tact.js'), '--config', join(out, 'tact.config.json')], { stdio: 'inherit' });
console.log(`Rehearsal build ready in build-rehearsal/out (graduation target ${target} TON). Testnet only.`);
