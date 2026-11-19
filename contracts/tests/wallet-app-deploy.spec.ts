/**
 * The factory deploy as a wallet app sends it (docs/EXECUTION.md, "Factory deploy from a wallet app"): one internal
 * message of 0.1 TON to the factory's address, with the state init as TON Connect
 * carries it (a base64 BOC) and an empty body. scripts/deploy.ts sends the same
 * message from a mnemonic wallet; here the deployer is also the liquidity manager,
 * which is that script's default.
 */
import { Blockchain } from '@ton/sandbox';
import { beginCell, Cell, contractAddress, loadStateInit, storeStateInit, toNano } from '@ton/core';
import '@ton/test-utils';
import { LaunchpadFactory } from '../build/Launchpad_LaunchpadFactory';

describe('factory deploy from a wallet app', () => {
    it('deploys the factory from 0.1 TON, the state init from a base64 BOC and an empty body', async () => {
        const blockchain = await Blockchain.create();
        const owner = await blockchain.treasury('owner');
        const treasury = await blockchain.treasury('treasury');
        const router = await blockchain.treasury('router');
        const ptonWallet = await blockchain.treasury('pton-wallet');

        const planned = await LaunchpadFactory.fromInit(owner.address, treasury.address, owner.address, {
            $$type: 'DexConfig', router: router.address, ptonWallet: ptonWallet.address,
        });
        const carried = beginCell().store(storeStateInit(planned.init!)).endCell().toBoc().toString('base64');
        const init = loadStateInit(Cell.fromBase64(carried).beginParse());
        expect(contractAddress(0, init)).toEqualAddress(planned.address);

        const res = await owner.send({ to: planned.address, value: toNano('0.1'), init, bounce: true });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: planned.address, deploy: true, success: true });
        // Nothing comes back: the empty receiver keeps the TON for storage.
        expect(res.transactions).not.toHaveTransaction({ from: planned.address });

        const info = await blockchain.openContract(planned).getGetFactoryInfo();
        expect(info.owner).toEqualAddress(owner.address);
        expect(info.treasury).toEqualAddress(treasury.address);
        expect(info.liquidityManager).toEqualAddress(owner.address);
        expect(info.dex.router).toEqualAddress(router.address);
        expect(info.dex.ptonWallet).toEqualAddress(ptonWallet.address);
        expect(info.tradeFeeBps).toBe(200n);
        expect(info.creatorFeeBps).toBe(6000n);
        expect(info.launchCount).toBe(0n);
    });

    it('a second approval of the same message deploys nothing new and changes nothing', async () => {
        const blockchain = await Blockchain.create();
        const owner = await blockchain.treasury('owner');
        const treasury = await blockchain.treasury('treasury');
        const planned = await LaunchpadFactory.fromInit(owner.address, treasury.address, owner.address, {
            $$type: 'DexConfig', router: treasury.address, ptonWallet: treasury.address,
        });
        await owner.send({ to: planned.address, value: toNano('0.1'), init: planned.init!, bounce: true });
        const again = await owner.send({ to: planned.address, value: toNano('0.1'), init: planned.init!, bounce: true });
        expect(again.transactions).toHaveTransaction({ from: owner.address, to: planned.address, deploy: false, success: true });
        const info = await blockchain.openContract(planned).getGetFactoryInfo();
        expect(info.owner).toEqualAddress(owner.address);
        expect(info.launchCount).toBe(0n);
    });
});
