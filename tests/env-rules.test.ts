import { mnemonicNew } from '@ton/crypto';
import { describe, expect, it } from 'vitest';
import { checkBotToken, checkJwtSecret, checkManifest, checkMnemonic, checkPublicVars, checkReturnUrl, checkTonAddress, validate } from '../scripts/env/rules';

const MAINNET_ADDR = 'UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI';
const TESTNET_ADDR = '0QCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqPvC';
const JWT = 'f3a9c2e81b7d4056a1e2c3d4b5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b';
const BOT = '7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1';

describe('env rules', () => {
  it('addresses', () => {
    expect(checkTonAddress('X', MAINNET_ADDR, 'mainnet').ok).toBe(true);
    expect(checkTonAddress('X', TESTNET_ADDR, 'mainnet').ok).toBe(false);
    expect(checkTonAddress('X', TESTNET_ADDR, 'testnet').ok).toBe(true);
    expect(checkTonAddress('X', 'UQ_PASTE_YOUR_TREASURY_HERE', 'mainnet').ok).toBe(false);
    expect(checkTonAddress('X', 'PENDING_DEPLOY', 'mainnet').ok).toBe(false);
    expect(checkTonAddress('X', undefined, 'mainnet').message).toBe('missing');
  });

  it('mnemonic', async () => {
    const words = (await mnemonicNew()).join(' ');
    expect((await checkMnemonic('M', words)).ok).toBe(true);
    expect((await checkMnemonic('M', 'word1 word2 word3')).ok).toBe(false);
    const wrong = words.split(' ');
    wrong[23] = wrong[0] === 'abandon' ? 'zoo' : 'abandon';
    expect((await checkMnemonic('M', wrong.join(' '))).ok).toBe(false);
  });

  it('bot token and JWT secret', () => {
    expect(checkBotToken('T', BOT).ok).toBe(true);
    expect(checkBotToken('T', 'PASTE_BOT_TOKEN_HERE').ok).toBe(false);
    expect(checkJwtSecret('J', JWT).ok).toBe(true);
    expect(checkJwtSecret('J', 'change-me-to-random-64-char-string').ok).toBe(false);
    expect(checkJwtSecret('J', '0'.repeat(64)).ok).toBe(false);
  });

  it('Telegram return URL', () => {
    expect(checkReturnUrl('U', 'https://t.me/TONLaunchpadBot/launch').ok).toBe(true);
    expect(checkReturnUrl('U', 'https://t.me/YourBot/yourapp').ok).toBe(false);
    expect(checkReturnUrl('U', 'http://t.me/SomeBot/app').ok).toBe(false);
    expect(checkReturnUrl('U', 'https://t.me/SomeBot').ok).toBe(false);
  });

  it('flags secrets in public VITE_ variables', () => {
    expect(checkPublicVars({ VITE_TONAPI_KEY: 'abc' }).length).toBe(1);
    expect(checkPublicVars({ VITE_FOO: BOT }).length).toBe(1);
    expect(checkPublicVars({ VITE_NETWORK: 'mainnet' }).length).toBe(0);
  });

  it('production profile passes a complete config and never echoes values', async () => {
    const env = {
      PLATFORM_TREASURY_ADDRESS: MAINNET_ADDR,
      TELEGRAM_BOT_TOKEN: BOT,
      JWT_SECRET: JWT,
      FACTORY_ADDRESS: MAINNET_ADDR,
      VITE_FACTORY_ADDRESS: MAINNET_ADDR,
      VITE_TWA_RETURN_URL: 'https://t.me/TONLaunchpadBot/launch',
      VITE_MANIFEST_URL: 'https://ton-launchpad-miniapp.vercel.app/tonconnect-manifest.json',
      VITE_NETWORK: 'mainnet',
    };
    const findings = await validate('production', env);
    expect(findings.filter((f) => !f.ok)).toEqual([]);
    const text = JSON.stringify(findings);
    expect(text).not.toContain(BOT);
    expect(text).not.toContain(JWT);
  });

  it('production profile fails closed on placeholders and a deploy mnemonic', async () => {
    const findings = await validate('production', { VITE_FACTORY_ADDRESS: 'PENDING_DEPLOY', DEPLOY_MNEMONIC: 'x', VITE_NETWORK: 'testnet' });
    const failed = findings.filter((f) => !f.ok).map((f) => f.name);
    expect(failed).toEqual(expect.arrayContaining(['VITE_FACTORY_ADDRESS', 'DEPLOY_MNEMONIC', 'VITE_NETWORK', 'TELEGRAM_BOT_TOKEN', 'JWT_SECRET']));
  });

  it('deploy-mainnet requires the go-live flag', async () => {
    const words = (await mnemonicNew()).join(' ');
    const base = { PLATFORM_TREASURY_ADDRESS: MAINNET_ADDR, DEPLOY_MNEMONIC: words };
    expect((await validate('deploy-mainnet', base)).some((f) => f.name === 'MAINNET_GO_LIVE_APPROVED' && !f.ok)).toBe(true);
    expect((await validate('deploy-mainnet', { ...base, MAINNET_GO_LIVE_APPROVED: 'yes' })).every((f) => f.ok)).toBe(true);
  });

  it('manifest check handles success, bad JSON and network failure', async () => {
    const manifest = { url: 'https://a.example', name: 'A', iconUrl: 'https://a.example/i.png', termsOfUseUrl: 'https://a.example/terms', privacyPolicyUrl: 'https://a.example/privacy' };
    const ok = (async (u: string) =>
      u.endsWith('manifest.json') ? new Response(JSON.stringify(manifest)) : new Response('ok')) as typeof fetch;
    expect((await checkManifest('https://a.example/manifest.json', ok)).every((f) => f.ok)).toBe(true);
    const bad = (async () => new Response('<html>')) as unknown as typeof fetch;
    expect((await checkManifest('https://a.example/manifest.json', bad))[0].ok).toBe(false);
    const down = (async () => { throw new Error('down'); }) as unknown as typeof fetch;
    expect((await checkManifest('https://a.example/manifest.json', down))[0].ok).toBe(false);
  });
});
