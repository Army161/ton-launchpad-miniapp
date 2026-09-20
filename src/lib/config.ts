const origin =
  typeof window !== 'undefined' ? window.location.origin : 'https://ton-launchpad-miniapp.vercel.app';

export const CONFIG = {
  manifestUrl: import.meta.env.VITE_MANIFEST_URL ?? `${origin}/tonconnect-manifest.json`,
  twaReturnUrl:
    import.meta.env.VITE_TWA_RETURN_URL ?? 'https://t.me/TONLaunchpadBot/app',
  factoryAddress: import.meta.env.VITE_FACTORY_ADDRESS ?? '',
  tonApiBase: import.meta.env.VITE_TONAPI_BASE ?? 'https://tonapi.io',
  network: (import.meta.env.VITE_NETWORK ?? 'mainnet') as 'mainnet' | 'testnet',
  launchFee: 0.05,
  graduationTarget: 1500,
  tradeFeePercent: 2,
  creatorFeeShare: 60,
  platformFeeShare: 40,
} as const;

export function isConfigured(): boolean {
  return Boolean(CONFIG.factoryAddress && CONFIG.factoryAddress !== 'PENDING_DEPLOY');
}
