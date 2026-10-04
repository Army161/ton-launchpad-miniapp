/**
 * Environment validation rules. Pure functions: they return findings and never
 * include a variable's value in a message, so output is safe to paste anywhere.
 * The canonical variable list lives in docs/ENVIRONMENT.md.
 */
import { Address } from '@ton/core';
import { mnemonicValidate } from '@ton/crypto';

export type Profile = 'deploy-testnet' | 'deploy-mainnet' | 'production';
export type Finding = { name: string; ok: boolean; message: string };
export type Env = Record<string, string | undefined>;

const PLACEHOLDER = /REPLACE|PASTE|YOUR_?|YourBot|yourapp|yourshortname|PENDING|CHANGE[-_]?ME|example|xxxx|word1/i;

const pass = (name: string, message = 'ok'): Finding => ({ name, ok: true, message });
const fail = (name: string, message: string): Finding => ({ name, ok: false, message });

export function checkTonAddress(name: string, value: string | undefined, network: 'mainnet' | 'testnet'): Finding {
  if (!value) return fail(name, 'missing');
  if (PLACEHOLDER.test(value)) return fail(name, 'still a placeholder');
  try {
    const parsed = Address.parseFriendly(value);
    if (network === 'mainnet' && parsed.isTestOnly) return fail(name, 'is a testnet-only address (0Q…/kQ…) but the network is mainnet');
    if (parsed.address.workChain !== 0) return fail(name, 'must be a basechain (workchain 0) address');
    return pass(name, 'valid TON address');
  } catch {
    try {
      Address.parseRaw(value);
      return pass(name, 'valid raw TON address');
    } catch {
      return fail(name, 'not a valid TON address');
    }
  }
}

export async function checkMnemonic(name: string, value: string | undefined): Promise<Finding> {
  if (!value) return fail(name, 'missing');
  const words = value.trim().split(/\s+/);
  if (words.length !== 24) return fail(name, `must be 24 words (has ${words.length})`);
  if (PLACEHOLDER.test(value)) return fail(name, 'still a placeholder');
  return (await mnemonicValidate(words)) ? pass(name, '24 words, valid TON mnemonic') : fail(name, 'not a valid TON mnemonic');
}

export function checkBotToken(name: string, value: string | undefined): Finding {
  if (!value) return fail(name, 'missing');
  return /^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(value) ? pass(name, 'BotFather token format') : fail(name, 'does not look like a BotFather token (digits:secret)');
}

export function checkJwtSecret(name: string, value: string | undefined): Finding {
  if (!value) return fail(name, 'missing');
  if (!/^[0-9a-f]{64,}$/i.test(value)) return fail(name, 'must be at least 64 hex characters (openssl rand -hex 32)');
  if (/^(.)\1+$/.test(value) || new Set(value.toLowerCase()).size < 10) return fail(name, 'is not random enough');
  return pass(name, `${value.length * 4}-bit hex secret`);
}

export function checkReturnUrl(name: string, value: string | undefined): Finding {
  if (!value) return fail(name, 'missing');
  if (PLACEHOLDER.test(value)) return fail(name, 'still a placeholder bot/app name');
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 't.me') return fail(name, 'must be https://t.me/<bot>/<app>');
    const [bot, app] = u.pathname.split('/').filter(Boolean);
    if (!bot || !/bot$/i.test(bot) || !app) return fail(name, 'must name the bot (ending in "bot") and the Mini App short name');
    return pass(name, 'Telegram Mini App link');
  } catch {
    return fail(name, 'not a URL');
  }
}

export function checkHttpsUrl(name: string, value: string | undefined): Finding {
  if (!value) return fail(name, 'missing');
  try {
    return new URL(value).protocol === 'https:' ? pass(name, 'https URL') : fail(name, 'must use https');
  } catch {
    return fail(name, 'not a URL');
  }
}

/** VITE_* values are shipped to every browser: flag anything that looks secret. */
export function checkPublicVars(env: Env): Finding[] {
  const out: Finding[] = [];
  for (const [k, v] of Object.entries(env)) {
    if (!k.startsWith('VITE_') || !v) continue;
    if (/KEY|SECRET|TOKEN|MNEMONIC|PASSWORD/i.test(k)) out.push(fail(k, 'secret-looking name in a public VITE_ variable'));
    else if (/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(v) || /^[0-9a-f]{64}$/i.test(v) || v.trim().split(/\s+/).length >= 12)
      out.push(fail(k, 'value looks like a secret; public VITE_ variables must not hold secrets'));
  }
  return out;
}

export async function validate(profile: Profile, env: Env): Promise<Finding[]> {
  const findings: Finding[] = [];
  const network = profile === 'deploy-testnet' ? 'testnet' : 'mainnet';

  findings.push(checkTonAddress('PLATFORM_TREASURY_ADDRESS', env.PLATFORM_TREASURY_ADDRESS, network));
  if (env.LIQUIDITY_MANAGER_ADDRESS) findings.push(checkTonAddress('LIQUIDITY_MANAGER_ADDRESS', env.LIQUIDITY_MANAGER_ADDRESS, network));

  if (profile === 'deploy-testnet' || profile === 'deploy-mainnet') {
    findings.push(await checkMnemonic('DEPLOY_MNEMONIC', env.DEPLOY_MNEMONIC));
    if (profile === 'deploy-mainnet' && env.MAINNET_GO_LIVE_APPROVED !== 'yes') {
      findings.push(fail('MAINNET_GO_LIVE_APPROVED', 'must be "yes" after the founder approves go-live'));
    }
  }

  if (profile === 'production') {
    findings.push(checkBotToken('TELEGRAM_BOT_TOKEN', env.TELEGRAM_BOT_TOKEN));
    findings.push(checkJwtSecret('JWT_SECRET', env.JWT_SECRET));
    findings.push(checkTonAddress('FACTORY_ADDRESS', env.FACTORY_ADDRESS, 'mainnet'));
    findings.push(checkTonAddress('VITE_FACTORY_ADDRESS', env.VITE_FACTORY_ADDRESS, 'mainnet'));
    if (env.FACTORY_ADDRESS && env.VITE_FACTORY_ADDRESS) {
      let same = false;
      try {
        same = Address.parse(env.FACTORY_ADDRESS).equals(Address.parse(env.VITE_FACTORY_ADDRESS));
      } catch {
        /* reported above */
      }
      findings.push(same ? pass('FACTORY_ADDRESS', 'matches VITE_FACTORY_ADDRESS') : fail('FACTORY_ADDRESS', 'differs from VITE_FACTORY_ADDRESS'));
    }
    findings.push(checkReturnUrl('VITE_TWA_RETURN_URL', env.VITE_TWA_RETURN_URL));
    findings.push(checkHttpsUrl('VITE_MANIFEST_URL', env.VITE_MANIFEST_URL));
    findings.push(env.VITE_NETWORK === 'mainnet' ? pass('VITE_NETWORK', 'mainnet') : fail('VITE_NETWORK', 'must be "mainnet" for production'));
    if (env.DEPLOY_MNEMONIC) findings.push(fail('DEPLOY_MNEMONIC', 'must not be set in the production runtime; keep it local'));
    findings.push(...checkPublicVars(env));
  }
  return findings;
}

/** Fetches the TON Connect manifest and the URLs it points at. */
export async function checkManifest(url: string, fetchImpl: typeof fetch = fetch): Promise<Finding[]> {
  const out: Finding[] = [];
  try {
    const res = await fetchImpl(url, { redirect: 'follow' });
    if (!res.ok) return [fail('manifest', `HTTP ${res.status}`)];
    const m = (await res.json()) as Record<string, unknown>;
    for (const key of ['url', 'name', 'iconUrl']) {
      if (typeof m[key] !== 'string' || !m[key]) out.push(fail(`manifest.${key}`, 'missing'));
    }
    for (const key of ['url', 'iconUrl', 'termsOfUseUrl', 'privacyPolicyUrl']) {
      const v = m[key];
      if (typeof v !== 'string') continue;
      if (!v.startsWith('https://')) {
        out.push(fail(`manifest.${key}`, 'must be https'));
        continue;
      }
      const r = await fetchImpl(v, { method: 'GET', redirect: 'follow' }).catch(() => null);
      out.push(r?.ok ? pass(`manifest.${key}`, 'reachable') : fail(`manifest.${key}`, `not reachable (${r?.status ?? 'network error'})`));
    }
    if (out.every((f) => f.ok)) out.unshift(pass('manifest', 'valid JSON'));
  } catch {
    out.push(fail('manifest', 'unreachable or not JSON'));
  }
  return out;
}
