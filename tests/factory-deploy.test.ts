import { Address, Cell, contractAddress, loadStateInit, toNano, TupleBuilder, TupleReader, type TupleItem } from '@ton/core';
import { describe, expect, it, vi } from 'vitest';
import { LaunchpadFactory, type FactoryInfo } from '../src/contracts/LaunchpadFactory';
import {
  checkRouterInfo,
  DEPLOY_VALUE,
  factoryInfoProblem,
  MAINNET_FACTORY,
  MIN_DEPLOYER_BALANCE,
  planFactoryDeploy,
} from '../src/lib/factoryDeploy';
import { checkMainnetDex, fetchRouterInfo, mainnetReader, RouterApiUnreachable, spacedQueue } from '../src/lib/factoryDeployChain';

const OWNER = Address.parse('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI');
const OTHER = Address.parse('EQD__________________________________________0vo');
const expected = {
  router: Address.parse(MAINNET_FACTORY.stonRouter),
  ptonMaster: Address.parse(MAINNET_FACTORY.ptonMaster),
  ptonWallet: Address.parse(MAINNET_FACTORY.ptonWallet),
};
const treasury = Address.parse(MAINNET_FACTORY.treasury);
const plan = () => planFactoryDeploy({ owner: OWNER, treasury, router: expected.router, ptonWallet: expected.ptonWallet });

const routerBody = (over: Record<string, unknown> = {}) => ({
  router: {
    address: MAINNET_FACTORY.stonRouter,
    major_version: 2,
    minor_version: 2,
    router_type: 'ConstantProduct',
    pool_creation_enabled: true,
    pton_master_address: MAINNET_FACTORY.ptonMaster,
    pton_wallet_address: MAINNET_FACTORY.ptonWallet,
    ...over,
  },
});

describe('the wallet-approved factory deploy sends what the deploy script sends', () => {
  it('pins the configuration the founder gave and the mainnet checks resolved', () => {
    expect(MAINNET_FACTORY).toEqual({
      treasury: 'UQBNwH67i7p23n2LYgEJtEEWp9p44HlqoDzZHBXm2mcUKyF3',
      stonRouter: 'EQDx--jUU9PUtHltPYZX7wdzIi0SPY3KZ8nvOs0iZvQJd6Ql',
      ptonMaster: 'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
      ptonWallet: 'EQDwOyDlewGw8MkeXgZ_oOmPTIhJIlaJwhJmf4ffIPKv-294',
    });
    expect(DEPLOY_VALUE).toBe(toNano('0.1'));
    expect(MIN_DEPLOYER_BALANCE).toBe(toNano('0.2'));
  });

  it('plans the factory of the compiled contract, owned by the wallet, which is also the liquidity manager', async () => {
    const p = await plan();
    const abi = await LaunchpadFactory.fromInit(OWNER, treasury, OWNER, { $$type: 'DexConfig', router: expected.router, ptonWallet: expected.ptonWallet });
    expect(p.factory.equals(abi.address)).toBe(true);
    expect(p.liquidityManager.equals(OWNER)).toBe(true);

    // The one message: 0.1 TON, bounceable, to the factory, carrying exactly its state init, no body.
    expect(p.message).toEqual({
      address: abi.address.toString({ bounceable: true, testOnly: false }),
      amount: '100000000',
      stateInit: expect.any(String),
    });
    expect(p.message.address.startsWith('EQ')).toBe(true);
    const init = loadStateInit(Cell.fromBase64(p.message.stateInit).beginParse());
    expect(init.code!.equals(abi.init!.code)).toBe(true);
    expect(init.data!.equals(abi.init!.data)).toBe(true);
    expect(contractAddress(0, init).equals(p.factory)).toBe(true);
  });

  it('gives another wallet another factory', async () => {
    const other = await planFactoryDeploy({ owner: OTHER, treasury, router: expected.router, ptonWallet: expected.ptonWallet });
    expect(other.factory.equals((await plan()).factory)).toBe(false);
  });
});

describe('the deployed factory is checked as the deploy script checks it', () => {
  const info = async (over: Partial<FactoryInfo> = {}): Promise<FactoryInfo> => ({
    $$type: 'FactoryInfo',
    owner: OWNER,
    treasury,
    liquidityManager: OWNER,
    dex: { $$type: 'DexConfig', router: expected.router, ptonWallet: expected.ptonWallet },
    launchCount: 0n,
    launchFee: toNano('0.05'),
    graduationTarget: toNano('1500'),
    tradeFeeBps: 200n,
    creatorFeeBps: 6000n,
    referrerFeeBps: 2000n,
    ...over,
  });

  it('accepts the planned factory and names what differs', async () => {
    const p = await plan();
    expect(factoryInfoProblem(await info(), p)).toBeNull();
    expect(factoryInfoProblem(await info({ owner: OTHER }), p)).toMatch(/owner/);
    expect(factoryInfoProblem(await info({ treasury: OTHER }), p)).toMatch(/treasury/);
    expect(factoryInfoProblem(await info({ liquidityManager: OTHER }), p)).toMatch(/liquidity manager/);
    expect(factoryInfoProblem(await info({ dex: { $$type: 'DexConfig', router: OTHER, ptonWallet: expected.ptonWallet } }), p)).toMatch(/router/);
    expect(factoryInfoProblem(await info({ dex: { $$type: 'DexConfig', router: expected.router, ptonWallet: OTHER } }), p)).toMatch(/pTON/);
    expect(factoryInfoProblem(await info({ tradeFeeBps: 300n }), p)).toMatch(/fee/);
    expect(factoryInfoProblem(await info({ creatorFeeBps: 5000n }), p)).toMatch(/fee/);
  });

  it('reads the factory report through toncenter get methods', async () => {
    const p = await plan();
    const reported = await info({ launchCount: 3n });
    // A get method returns the fields of the struct flat on the stack, the DEX pair included.
    const stack = new TupleBuilder();
    for (const a of [reported.owner, reported.treasury, reported.liquidityManager, reported.dex.router, reported.dex.ptonWallet]) stack.writeAddress(a);
    for (const n of [reported.launchCount, reported.launchFee, reported.graduationTarget, reported.tradeFeeBps, reported.creatorFeeBps, reported.referrerFeeBps]) stack.writeNumber(n);
    const runMethod = vi.fn(async (_address: Address, _name: string, _args?: TupleItem[]) => ({
      gas_used: 0,
      stack: new TupleReader(stack.build()),
    }));
    const reader = mainnetReader({ runMethod, getBalance: vi.fn(), isContractDeployed: vi.fn() } as never);
    vi.useFakeTimers();
    try {
      const pending = reader.factoryInfo(p.factory);
      await vi.runAllTimersAsync();
      const got = await pending;
      expect(factoryInfoProblem(got, p)).toBeNull();
      expect(got.launchCount).toBe(3n);
      expect(runMethod).toHaveBeenCalledTimes(1);
      expect(runMethod.mock.calls[0][0].equals(p.factory)).toBe(true);
      expect(runMethod.mock.calls[0][1]).toBe('get_factory_info');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the router is checked before the deploy', () => {
  it('accepts STON.fi describing the pinned v2 constant-product router, in either spelling of the fields', () => {
    expect(checkRouterInfo(routerBody(), expected)).toBe('v2.2, ConstantProduct');
    expect(
      checkRouterInfo(
        {
          router: {
            address: MAINNET_FACTORY.stonRouter,
            majorVersion: 2,
            minorVersion: 2,
            routerType: 'ConstantProduct',
            poolCreationEnabled: true,
            ptonMasterAddress: MAINNET_FACTORY.ptonMaster,
            ptonWalletAddress: MAINNET_FACTORY.ptonWallet,
          },
        },
        expected,
      ),
    ).toBe('v2.2, ConstantProduct');
  });

  it('refuses any answer that differs', () => {
    expect(() => checkRouterInfo({}, expected)).toThrow(/did not describe/);
    expect(() => checkRouterInfo(null, expected)).toThrow(/did not describe/);
    expect(() => checkRouterInfo(routerBody({ address: OTHER.toString() }), expected)).toThrow(/another router/);
    expect(() => checkRouterInfo(routerBody({ major_version: 1 }), expected)).toThrow(/v2 router/);
    expect(() => checkRouterInfo(routerBody({ router_type: 'Stableswap' }), expected)).toThrow(/constant product/);
    expect(() => checkRouterInfo(routerBody({ pool_creation_enabled: false }), expected)).toThrow(/pool creation/);
    expect(() => checkRouterInfo(routerBody({ pton_master_address: OTHER.toString() }), expected)).toThrow(/another pTON master/);
    expect(() => checkRouterInfo(routerBody({ pton_wallet_address: OTHER.toString() }), expected)).toThrow(/another pTON wallet/);
    expect(() => checkRouterInfo(routerBody({ pton_wallet_address: 'nonsense' }), expected)).toThrow(/no valid pTON wallet/);
  });

  const reader = (over: Partial<{ deployed: boolean; wallet: Address }> = {}) => ({
    isDeployed: vi.fn(async () => over.deployed ?? true),
    ptonWalletOf: vi.fn(async () => over.wallet ?? expected.ptonWallet),
  });

  it('passes when the pTON master on-chain and the STON.fi API both confirm', async () => {
    const r = reader();
    const dex = await checkMainnetDex(r, expected, async () => routerBody());
    expect(dex.apiChecked).toBe(true);
    expect(dex.ptonWallet.equals(expected.ptonWallet)).toBe(true);
    expect(dex.source).toMatch(/STON\.fi API: v2\.2, ConstantProduct; pTON master on-chain/);
    expect(r.ptonWalletOf.mock.calls[0].map(String)).toEqual([expected.ptonMaster.toString(), expected.router.toString()]);
  });

  it('stops when the router is not a contract, or the pTON master names another wallet, before asking the API', async () => {
    const api = vi.fn(async () => routerBody());
    await expect(checkMainnetDex(reader({ deployed: false }), expected, api)).rejects.toThrow(/not an active contract/);
    await expect(checkMainnetDex(reader({ wallet: OTHER }), expected, api)).rejects.toThrow(/pTON master names another/);
    expect(api).not.toHaveBeenCalled();
  });

  it('stops when the API answers differently, and goes on without it only when it gives no answer', async () => {
    await expect(checkMainnetDex(reader(), expected, async () => routerBody({ pool_creation_enabled: false }))).rejects.toThrow(/pool creation/);
    await expect(
      checkMainnetDex(reader(), expected, async () => {
        throw new Error('STON.fi does not know this router (HTTP 404).');
      }),
    ).rejects.toThrow(/does not know/);

    const dex = await checkMainnetDex(reader(), expected, async () => {
      throw new RouterApiUnreachable('HTTP 503');
    });
    expect(dex.apiChecked).toBe(false);
    expect(dex.ptonWallet.equals(expected.ptonWallet)).toBe(true);
    expect(dex.source).toMatch(/gave no answer/);
  });

  it('asks the STON.fi API for the router and tells no answer from a wrong one', async () => {
    const ok = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify(routerBody()), { status: 200 }));
    expect(await fetchRouterInfo(expected.router, ok as never)).toEqual(routerBody());
    expect(String(ok.mock.calls[0][0])).toBe(`https://api.ston.fi/v1/routers/${MAINNET_FACTORY.stonRouter}`);

    await expect(fetchRouterInfo(expected.router, (async () => { throw new TypeError('Failed to fetch'); }) as never)).rejects.toBeInstanceOf(RouterApiUnreachable);
    await expect(fetchRouterInfo(expected.router, (async () => new Response('', { status: 503 })) as never)).rejects.toBeInstanceOf(RouterApiUnreachable);
    await expect(fetchRouterInfo(expected.router, (async () => new Response('', { status: 429 })) as never)).rejects.toBeInstanceOf(RouterApiUnreachable);
    const notFound = fetchRouterInfo(expected.router, (async () => new Response('', { status: 404 })) as never);
    await expect(notFound).rejects.toThrow(/HTTP 404/);
    await expect(notFound).rejects.not.toBeInstanceOf(RouterApiUnreachable);
  });
});

describe('chain reads are spaced for toncenter without a key', () => {
  it('runs calls one at a time in order and waits between them', async () => {
    const waits: number[] = [];
    const run = spacedQueue(1000, 3, async (ms) => void waits.push(ms));
    const seen: string[] = [];
    const a = run(async () => { seen.push('a'); return 1; });
    const b = run(async () => { seen.push('b'); return 2; });
    expect(await Promise.all([a, b])).toEqual([1, 2]);
    expect(seen).toEqual(['a', 'b']);
    expect(waits).toEqual([1000, 1000]);
  });

  it('tries a failed call again, waiting longer each time, then gives up without blocking the next call', async () => {
    const waits: number[] = [];
    const run = spacedQueue(1000, 2, async (ms) => void waits.push(ms));
    let calls = 0;
    const flaky = run(async () => {
      if (++calls < 3) throw new Error('429');
      return 'ok';
    });
    expect(await flaky).toBe('ok');
    expect(calls).toBe(3);
    expect(waits).toEqual([1000, 1000, 2000, 1000, 1000]);

    const dead = run(async () => { throw new Error('down'); });
    const next = run(async () => 'next');
    await expect(dead).rejects.toThrow('down');
    expect(await next).toBe('next');
  });
});
