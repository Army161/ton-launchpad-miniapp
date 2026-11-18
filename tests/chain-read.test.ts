import { Address, beginCell } from '@ton/core';
import type { TonClient } from '@ton/ton';
import { describe, expect, it } from 'vitest';
import { listLaunches, readHolderBalance, readLaunchpadToken, type ChainSession } from '../api/_lib/chain';
import { ChainUnavailableError } from '../api/_lib/toncenter';
import { LaunchpadJetton, type CurveState, type JettonData } from '../src/contracts/LaunchpadJetton';
import { buildOnchainContent } from '../src/lib/metadata';

const FACTORY = Address.parse('EQD__________________________________________0vo');
const CREATOR = Address.parse('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI');
const exitCode = (code: number) => new Error(`Unable to execute get method. Got exit_code: ${code}`);

// readLaunchpadToken keeps each token's jetton content in module memory, so every test launches its own token.
let nextSalt = 100n;
async function launched(salt = nextSalt++) {
  const address = (await LaunchpadJetton.fromInit(FACTORY, CREATOR, salt)).address;
  const state: CurveState = {
    $$type: 'CurveState',
    factory: FACTORY,
    creator: CREATOR,
    salt,
    treasury: CREATOR,
    liquidityManager: CREATOR,
    dex: { $$type: 'DexConfig', router: FACTORY, ptonWallet: FACTORY },
    initialized: true,
    virtualTon: 30_000_000_000n,
    virtualTokens: 10n ** 18n,
    realTonRaised: 0n,
    totalSupply: 0n,
    graduated: false,
    migrated: false,
    graduationTarget: 1_500_000_000_000n,
    totalCreatorFees: 0n,
    totalPlatformFees: 0n,
    tradeCount: 3n,
    progressBps: 0n,
    totalReferrerFees: 0n,
  };
  const data: JettonData = {
    $$type: 'JettonData',
    totalSupply: 0n,
    mintable: true,
    adminAddress: null,
    content: buildOnchainContent({ name: 'Super Doge', symbol: 'SDOGE', description: '', image: 'https://img.example/d.png' }),
    walletCode: beginCell().endCell(),
  };
  return { address, state, data };
}

type Getters = {
  curve?: () => Promise<CurveState>;
  jetton?: () => Promise<JettonData>;
  deployed?: () => Promise<boolean>;
  wallet?: () => Promise<{ balance: bigint }>;
  transactions?: () => Promise<unknown[]>;
};

/** A session over fake getters that answers each call once, the way the real session does after its retries. */
function fakeChain(getters: Getters) {
  const missing = () => Promise.reject(new Error('unexpected request'));
  const client = {
    open: () => ({
      getGetCurveState: getters.curve ?? missing,
      getGetJettonData: getters.jetton ?? missing,
      getGetWalletData: getters.wallet ?? missing,
    }),
    isContractDeployed: getters.deployed ?? missing,
    getTransactions: getters.transactions ?? missing,
  } as unknown as TonClient;
  let requests = 0;
  const session: ChainSession = {
    call: (fn) => {
      requests++;
      return fn(client);
    },
  };
  return { session, requests: () => requests };
}

describe('readLaunchpadToken', () => {
  it('reads a token our factory launched', async () => {
    const t = await launched();
    const chain = fakeChain({ curve: async () => t.state, jetton: async () => t.data });
    const view = await readLaunchpadToken(t.address, FACTORY, chain.session);
    expect(view).toMatchObject({ name: 'Super Doge', symbol: 'SDOGE', tradeCount: 3, virtualTon: '30000000000' });
    expect(chain.requests()).toBe(2);
  });

  it.each([
    ['exit code 11 (no such getter)', 11],
    ['exit code -13 (nothing deployed)', -13],
  ])('calls the address not ours on %s', async (_name, code) => {
    const t = await launched();
    const chain = fakeChain({ curve: () => Promise.reject(exitCode(code)) });
    await expect(readLaunchpadToken(t.address, FACTORY, chain.session)).resolves.toBeNull();
    expect(chain.requests()).toBe(1);
  });

  it('calls the address not ours for an uninitialized curve, another factory or an address the factory would not derive', async () => {
    const t = await launched();
    const uninitialized = fakeChain({ curve: async () => ({ ...t.state, initialized: false }) });
    await expect(readLaunchpadToken(t.address, FACTORY, uninitialized.session)).resolves.toBeNull();
    const otherFactory = fakeChain({ curve: async () => ({ ...t.state, factory: CREATOR }) });
    await expect(readLaunchpadToken(t.address, FACTORY, otherFactory.session)).resolves.toBeNull();
    const lookAlike = fakeChain({ curve: async () => ({ ...t.state, salt: 8n }) });
    await expect(readLaunchpadToken(t.address, FACTORY, lookAlike.session)).resolves.toBeNull();
  });

  it('calls a non-basechain address not ours without a request', async () => {
    const chain = fakeChain({});
    await expect(readLaunchpadToken(Address.parse(`-1:${'0'.repeat(64)}`), FACTORY, chain.session)).resolves.toBeNull();
    expect(chain.requests()).toBe(0);
  });

  it('reads the jetton content once per token, so a later read of the token is one request', async () => {
    const t = await launched();
    const chain = fakeChain({ curve: async () => t.state, jetton: async () => t.data });
    await readLaunchpadToken(t.address, FACTORY, chain.session);
    expect(chain.requests()).toBe(2);
    const later = fakeChain({ curve: async () => ({ ...t.state, tradeCount: 9n }) });
    await expect(readLaunchpadToken(t.address, FACTORY, later.session)).resolves.toMatchObject({ name: 'Super Doge', symbol: 'SDOGE', tradeCount: 9 });
    expect(later.requests()).toBe(1);
  });

  it('throws ChainUnavailableError when the chain cannot be read, never null', async () => {
    const t = await launched();
    const down = fakeChain({ curve: () => Promise.reject(new ChainUnavailableError('toncenter: HTTP 429 after 4 attempts')) });
    await expect(readLaunchpadToken(t.address, FACTORY, down.session)).rejects.toBeInstanceOf(ChainUnavailableError);
    const metadataDown = fakeChain({ curve: async () => t.state, jetton: () => Promise.reject(new ChainUnavailableError('toncenter: HTTP 503 after 4 attempts')) });
    await expect(readLaunchpadToken(t.address, FACTORY, metadataDown.session)).rejects.toBeInstanceOf(ChainUnavailableError);
    // Nothing was kept from the failed read: the next read asks for the content again.
    const recovered = fakeChain({ curve: async () => t.state, jetton: async () => t.data });
    await expect(readLaunchpadToken(t.address, FACTORY, recovered.session)).resolves.toMatchObject({ name: 'Super Doge' });
    expect(recovered.requests()).toBe(2);
  });

  it('passes other errors through instead of calling the token unknown', async () => {
    const t = await launched();
    const err = Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } });
    const chain = fakeChain({ curve: () => Promise.reject(err) });
    await expect(readLaunchpadToken(t.address, FACTORY, chain.session)).rejects.toBe(err);
  });
});

describe('readHolderBalance', () => {
  it('reads 0 for a wallet that is not deployed, without asking for its data', async () => {
    const t = await launched();
    const chain = fakeChain({ deployed: async () => false });
    await expect(readHolderBalance(t.address, CREATOR, FACTORY, chain.session)).resolves.toBe(0n);
    expect(chain.requests()).toBe(1);
  });

  it('reads the balance of a deployed wallet, and throws ChainUnavailableError when it cannot', async () => {
    const t = await launched();
    const chain = fakeChain({ deployed: async () => true, wallet: async () => ({ balance: 42n }) });
    await expect(readHolderBalance(t.address, CREATOR, FACTORY, chain.session)).resolves.toBe(42n);
    const down = fakeChain({ deployed: () => Promise.reject(new ChainUnavailableError('toncenter: ETIMEDOUT after 4 attempts')) });
    await expect(readHolderBalance(t.address, CREATOR, FACTORY, down.session)).rejects.toBeInstanceOf(ChainUnavailableError);
  });
});

describe('listLaunches', () => {
  const internal = (dest: Address, op: number) => ({ info: { type: 'internal', dest }, body: beginCell().storeUint(op, 32).endCell() });
  const tx = (now: number, ...messages: unknown[]) => ({ now, outMessages: { values: () => messages } });

  it('lists the jettons the factory set up, newest first, once each, with the time of the setup', async () => {
    const [a, b] = [await launched(), await launched()];
    const other = Address.parse(`0:${'1'.repeat(64)}`);
    const chain = fakeChain({
      transactions: async () => [
        tx(1_700_000_300, internal(b.address, 0x4c500002)),
        tx(1_700_000_200, internal(other, 0x0f8a7ea5), internal(a.address, 0x4c500002)),
        tx(1_700_000_100, internal(b.address, 0x4c500002)),
        tx(1_700_000_000, { info: { type: 'external-out' }, body: beginCell().endCell() }),
      ],
    });
    const launches = await listLaunches(FACTORY, 100, chain.session);
    expect(launches.map((l) => [l.address.toRawString(), l.at])).toEqual([
      [b.address.toRawString(), 1_700_000_300_000],
      [a.address.toRawString(), 1_700_000_200_000],
    ]);
    expect(chain.requests()).toBe(1);
  });
});
