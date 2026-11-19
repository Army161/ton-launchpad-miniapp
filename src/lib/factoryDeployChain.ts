import { Address, beginCell, type ContractProvider } from '@ton/core';
import { TonClient } from '@ton/ton';
import { LaunchpadFactory, type FactoryInfo } from '../contracts/LaunchpadFactory';
import { checkRouterInfo } from './factoryDeploy';

// Mainnet reads for the factory deploy page, straight from the browser: toncenter for the chain and the STON.fi API
// for the router. The page works on any deployment, with or without the server's variables.

const TONCENTER_MAINNET = 'https://toncenter.com/api/v2/jsonRPC';
const STONFI_API = 'https://api.ston.fi';
/** toncenter allows about one request a second without a key. */
const GAP_MS = 1100;
const RETRIES = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs calls one at a time, GAP_MS apart, and tries a failed one again a few times (rate limits pass). */
export function spacedQueue(gapMs = GAP_MS, retries = RETRIES, wait: (ms: number) => Promise<unknown> = sleep) {
  let tail: Promise<unknown> = Promise.resolve();
  return function run<T>(call: () => Promise<T>): Promise<T> {
    const result = tail.then(async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await call();
        } catch (err) {
          if (attempt >= retries) throw err;
          await wait(gapMs * 2 ** attempt);
        } finally {
          await wait(gapMs);
        }
      }
    });
    tail = result.catch(() => undefined);
    return result;
  };
}

export type MainnetReader = {
  balance(address: Address): Promise<bigint>;
  isDeployed(address: Address): Promise<boolean>;
  /** The pTON wallet the master holds for an owner (`get_wallet_address`). */
  ptonWalletOf(ptonMaster: Address, owner: Address): Promise<Address>;
  factoryInfo(factory: Address): Promise<FactoryInfo>;
};

export function mainnetReader(client: Pick<TonClient, 'getBalance' | 'isContractDeployed' | 'runMethod'> = new TonClient({ endpoint: TONCENTER_MAINNET })): MainnetReader {
  const run = spacedQueue();
  return {
    balance: (address) => run(() => client.getBalance(address)),
    isDeployed: (address) => run(() => client.isContractDeployed(address)),
    ptonWalletOf: async (ptonMaster, owner) => {
      const res = await run(() =>
        client.runMethod(ptonMaster, 'get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }]),
      );
      return res.stack.readAddress();
    },
    factoryInfo: (factory) => {
      const provider = {
        get: async (name: string, args: Parameters<TonClient['runMethod']>[2]) => ({
          stack: (await run(() => client.runMethod(factory, name, args))).stack,
        }),
      } as unknown as ContractProvider;
      return LaunchpadFactory.fromAddress(factory).getGetFactoryInfo(provider);
    },
  };
}

/** The STON.fi API gave no answer (network error, rate limit or server error): not the same as a wrong answer. */
export class RouterApiUnreachable extends Error {}

export async function fetchRouterInfo(router: Address, fetchFn: typeof fetch = fetch): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(`${STONFI_API}/v1/routers/${router.toString()}`, { headers: { accept: 'application/json' } });
  } catch (err) {
    throw new RouterApiUnreachable(err instanceof Error ? err.message : 'network error');
  }
  if (res.status === 429 || res.status >= 500) throw new RouterApiUnreachable(`HTTP ${res.status}`);
  if (!res.ok) throw new Error(`STON.fi does not know this router (HTTP ${res.status}).`);
  return res.json();
}

export type DexCheck = { router: Address; ptonWallet: Address; source: string; apiChecked: boolean };

/**
 * Confirms the pinned router and pTON wallet before a deploy. Always: the router is an active contract and the pTON
 * master, asked on-chain, maps it to the pinned pTON wallet (a wrong wallet would lose the TON leg of a graduation).
 * And STON.fi's API must describe the router as the deploy script requires. Only when that API gives no answer at all
 * does the deploy go on without it: the router's version and type cannot change, and both were checked through the
 * same API on 2026-11-14. An answer that differs always stops the deploy.
 */
export async function checkMainnetDex(
  reader: Pick<MainnetReader, 'isDeployed' | 'ptonWalletOf'>,
  expected: { router: Address; ptonMaster: Address; ptonWallet: Address },
  routerInfo: () => Promise<unknown> = () => fetchRouterInfo(expected.router),
): Promise<DexCheck> {
  if (!(await reader.isDeployed(expected.router))) throw new Error('The STON.fi router is not an active contract on mainnet.');
  const onChain = await reader.ptonWalletOf(expected.ptonMaster, expected.router);
  if (!onChain.equals(expected.ptonWallet)) throw new Error("The pTON master names another pTON wallet for this router.");

  let body: unknown;
  try {
    body = await routerInfo();
  } catch (err) {
    if (!(err instanceof RouterApiUnreachable)) throw err;
    return {
      router: expected.router,
      ptonWallet: onChain,
      source: 'pTON master on-chain; STON.fi API gave no answer now, last checked 2026-11-14',
      apiChecked: false,
    };
  }
  const described = checkRouterInfo(body, expected);
  return { router: expected.router, ptonWallet: onChain, source: `STON.fi API: ${described}; pTON master on-chain`, apiChecked: true };
}
