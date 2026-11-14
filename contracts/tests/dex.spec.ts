import { Address, beginCell, TupleReader } from '@ton/core';
import { resolveDex } from '../scripts/lib/dex';

const ROUTER = Address.parse('kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v');
const MASTER = Address.parse('kQACS30DNoUQ7NfApPvzh7eBmSZ9L4ygJ-lkNWtba8TQT-Px');
const WALLET = Address.parse('kQBbJjnahBMGbMUJwhAXLn8BiigcGXMJhSC0l7DBhdYABhG7');
const OTHER = new Address(0, Buffer.alloc(32, 7));

function fakeClient(deployed = true) {
    const calls: string[] = [];
    return {
        calls,
        isContractDeployed: async () => deployed,
        runMethod: async (addr: Address, method: string) => {
            calls.push(`${addr.toString()}:${method}`);
            return { gas_used: 0, stack: new TupleReader([{ type: 'slice', cell: beginCell().storeAddress(WALLET).endCell() }]) };
        },
    } as never;
}

const noApi = () => {
    throw new Error('API must not be called');
};

describe('resolveDex', () => {
    it('on testnet, asks the pTON master on-chain and never calls the STON.fi API', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString(), STON_PTON_MASTER_ADDRESS: MASTER.toString() };
        const dex = await resolveDex(fakeClient(), 'testnet', env, noApi);
        expect(dex.router.equals(ROUTER)).toBe(true);
        expect(dex.ptonWallet.equals(WALLET)).toBe(true);
        expect(dex.ptonMaster.equals(MASTER)).toBe(true);
    });

    it('on testnet, refuses to run without a pTON master', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString(), STON_PTON_WALLET_ADDRESS: WALLET.toString() };
        await expect(resolveDex(fakeClient(), 'testnet', env, noApi)).rejects.toThrow(/STON_PTON_MASTER_ADDRESS/);
    });

    it('refuses a configured pTON wallet the master does not confirm', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString(), STON_PTON_MASTER_ADDRESS: MASTER.toString(), STON_PTON_WALLET_ADDRESS: OTHER.toString() };
        await expect(resolveDex(fakeClient(), 'testnet', env, noApi)).rejects.toThrow(/does not match/);
    });

    it('refuses a router that is not deployed', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString(), STON_PTON_MASTER_ADDRESS: MASTER.toString() };
        await expect(resolveDex(fakeClient(false), 'testnet', env, noApi)).rejects.toThrow(/not an active contract/);
    });

    it('on mainnet, checks the router through the STON.fi API and confirms the wallet on-chain', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString() };
        const api = () => ({
            getRouter: async () => ({
                majorVersion: 2, minorVersion: 1, routerType: 'ConstantProduct', poolCreationEnabled: true,
                ptonMasterAddress: MASTER.toString(), ptonWalletAddress: WALLET.toString(),
            }),
        }) as never;
        const dex = await resolveDex(fakeClient(), 'mainnet', env, api);
        expect(dex.ptonWallet.equals(WALLET)).toBe(true);
        expect(dex.source).toMatch(/v2\.1/);
    });

    it('on mainnet, refuses a v1 router', async () => {
        const env = { STON_ROUTER_ADDRESS: ROUTER.toString() };
        const api = () => ({ getRouter: async () => ({ majorVersion: 1, routerType: 'ConstantProduct', poolCreationEnabled: true }) }) as never;
        await expect(resolveDex(fakeClient(), 'mainnet', env, api)).rejects.toThrow(/v1/);
    });
});
