import { Address, beginCell, storeStateInit, toNano } from '@ton/core';
import { LaunchpadFactory, type FactoryInfo } from '../contracts/LaunchpadFactory';

// The mainnet factory deploy as one wallet-approved transaction (docs/EXECUTION.md, "Factory deploy from a wallet app"). It sends what
// contracts/scripts/deploy.ts sends, but the owner's wallet app signs it, so no mnemonic is ever put in a file.

/**
 * The founder's mainnet configuration. The treasury is the address he gave on 2026-11-17. The router and its pTON
 * master and wallet are the ones the mainnet checks of 2026-11-14 resolved (STON.fi API and the pTON master on-chain)
 * and the mainnet-fork graduation ran against (docs/VERIFICATION.md). The page checks them again before it sends.
 */
export const MAINNET_FACTORY = {
  treasury: 'UQBNwH67i7p23n2LYgEJtEEWp9p44HlqoDzZHBXm2mcUKyF3',
  stonRouter: 'EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql',
  ptonMaster: 'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
  ptonWallet: 'EQDwOyDlewGw8MkeXgZ_oOmPTIhJIlaJwhJmf4ffIPKv-294',
} as const;

/** Same amounts as contracts/scripts/deploy.ts. */
export const DEPLOY_VALUE = toNano('0.1');
export const MIN_DEPLOYER_BALANCE = toNano('0.2');

export type FactoryPlan = {
  owner: Address;
  treasury: Address;
  liquidityManager: Address;
  router: Address;
  ptonWallet: Address;
  factory: Address;
  /** The one TON Connect message: 0.1 TON to the factory's address with its state init and an empty body. */
  message: { address: string; amount: string; stateInit: string };
};

/**
 * The factory a wallet deploys: it is the owner and, as the founder chose on 2026-11-18, the liquidity manager too
 * (the default of the deploy script). The address follows from these values, so another wallet gets another factory.
 */
export async function planFactoryDeploy(p: {
  owner: Address;
  treasury: Address;
  router: Address;
  ptonWallet: Address;
}): Promise<FactoryPlan> {
  const liquidityManager = p.owner;
  const factory = await LaunchpadFactory.fromInit(p.owner, p.treasury, liquidityManager, {
    $$type: 'DexConfig',
    router: p.router,
    ptonWallet: p.ptonWallet,
  });
  if (!factory.init) throw new Error('The factory has no state init.');
  return {
    owner: p.owner,
    treasury: p.treasury,
    liquidityManager,
    router: p.router,
    ptonWallet: p.ptonWallet,
    factory: factory.address,
    message: {
      // Bounceable, as the script sends it: if the deploy fails the TON comes back.
      address: factory.address.toString({ bounceable: true, testOnly: false }),
      amount: DEPLOY_VALUE.toString(),
      stateInit: beginCell().store(storeStateInit(factory.init)).endCell().toBoc().toString('base64'),
    },
  };
}

/** What is wrong with a deployed factory's own report, or null. The checks of the deploy script, and the owner. */
export function factoryInfoProblem(info: FactoryInfo, plan: FactoryPlan): string | null {
  if (!info.owner.equals(plan.owner)) return 'The factory reports another owner.';
  if (!info.treasury.equals(plan.treasury)) return 'The factory reports another treasury.';
  if (!info.liquidityManager.equals(plan.liquidityManager)) return 'The factory reports another liquidity manager.';
  if (!info.dex.router.equals(plan.router) || !info.dex.ptonWallet.equals(plan.ptonWallet)) {
    return 'The factory reports another STON.fi router or pTON wallet.';
  }
  if (info.tradeFeeBps !== 200n || info.creatorFeeBps !== 6000n) return 'The factory reports unexpected fee parameters.';
  return null;
}

type Fields = Record<string, unknown>;
const field = (o: Fields, snake: string, camel: string) => o[snake] ?? o[camel];

/**
 * Checks STON.fi's own description of the router (GET /v1/routers/{address}), as the deploy script does on mainnet:
 * a v2 constant-product router with pool creation on, whose pTON master and wallet are the expected ones.
 * Returns a short description; throws with the reason when something differs.
 */
export function checkRouterInfo(body: unknown, expected: { router: Address; ptonMaster: Address; ptonWallet: Address }): string {
  const info = (body as { router?: unknown } | null)?.router;
  if (!info || typeof info !== 'object') throw new Error('STON.fi did not describe the router.');
  const r = info as Fields;
  const address = (v: unknown, what: string) => {
    try {
      return Address.parse(String(v));
    } catch {
      throw new Error(`STON.fi gave no valid ${what}.`);
    }
  };
  if (!address(r.address, 'router address').equals(expected.router)) throw new Error('STON.fi described another router.');
  const major = field(r, 'major_version', 'majorVersion');
  const minor = field(r, 'minor_version', 'minorVersion');
  const type = String(field(r, 'router_type', 'routerType') ?? '');
  if (major !== 2) throw new Error(`Router is v${String(major)}; graduation needs a STON.fi v2 router.`);
  if (!/constant/i.test(type)) throw new Error(`Router type is ${type || 'unknown'}; it must be constant product.`);
  if (field(r, 'pool_creation_enabled', 'poolCreationEnabled') !== true) throw new Error('This router does not allow pool creation.');
  if (!address(field(r, 'pton_master_address', 'ptonMasterAddress'), 'pTON master').equals(expected.ptonMaster)) {
    throw new Error('STON.fi names another pTON master for this router.');
  }
  if (!address(field(r, 'pton_wallet_address', 'ptonWalletAddress'), 'pTON wallet').equals(expected.ptonWallet)) {
    throw new Error('STON.fi names another pTON wallet for this router.');
  }
  return `v${String(major)}.${String(minor ?? '?')}, ${type}`;
}
