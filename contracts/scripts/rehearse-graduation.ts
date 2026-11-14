/**
 * Testnet rehearsal of on-chain graduation (ADR-009) with faucet TON.
 * Uses the rehearsal build (graduation target 1.5 TON, `npm run build:rehearsal`),
 * which is a different contract from the mainnet build and must never be used
 * for real tokens.
 *
 *   npm run rehearse:graduation -- [--execute]
 *
 * Needs DEPLOY_MNEMONIC (a testnet wallet with ~3 TON), PLATFORM_TREASURY_ADDRESS,
 * STON_ROUTER_ADDRESS (testnet v2 router) and STON_PTON_MASTER_ADDRESS (testnet
 * pTON v2 master; STON.fi has no testnet API). --env-file <file> loads them. Steps: deploy rehearsal factory, launch a token,
 * buy past the target, send Migrate, then check the STON.fi pool exists and its
 * LP sits with the zero address.
 */
import { Address, beginCell, toNano } from '@ton/core';
import { JettonMaster } from '@ton/ton';
import * as fs from 'fs';
import * as path from 'path';
import { resolveDex } from './lib/dex';
import { loadEnvFileArg } from './lib/env';
import { friendly, openWallet, requireAddress, waitFor } from './lib/wallet';

type FactoryModule = typeof import('../build/Launchpad_LaunchpadFactory');
type JettonModule = typeof import('../build/Launchpad_LaunchpadJetton');

const OUT = path.join(__dirname, '..', 'build-rehearsal', 'out');
const ZERO = new Address(0, Buffer.alloc(32));

async function main() {
    loadEnvFileArg();
    const execute = process.argv.includes('--execute');
    if (!fs.existsSync(path.join(OUT, 'Launchpad_LaunchpadFactory.ts'))) {
        throw new Error('Run `npm run build:rehearsal` first.');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LaunchpadFactory, storeCreateToken } = require(path.join(OUT, 'Launchpad_LaunchpadFactory')) as FactoryModule;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LaunchpadJetton, storeBuy, storeMigrate } = require(path.join(OUT, 'Launchpad_LaunchpadJetton')) as JettonModule;

    const network = 'testnet' as const;
    const wallet = await openWallet(network, 'DEPLOY_MNEMONIC');
    const treasury = requireAddress('PLATFORM_TREASURY_ADDRESS');
    const { router, ptonWallet } = await resolveDex(wallet.client, network);

    const factory = wallet.client.open(await LaunchpadFactory.fromInit(wallet.address, treasury, wallet.address, {
        $$type: 'DexConfig', router, ptonWallet,
    }));
    const salt = BigInt(Date.now());
    const jetton = wallet.client.open(await LaunchpadJetton.fromInit(factory.address, wallet.address, salt));
    const info = await factory.getGetFactoryInfo().catch(() => null);
    const target = info?.graduationTarget ?? null;

    console.log(`Wallet:          ${friendly(wallet.address, network)} (${Number(await wallet.balance()) / 1e9} TON)`);
    console.log(`Rehearsal factory: ${friendly(factory.address, network)} ${info ? '(deployed)' : '(not deployed)'}`);
    console.log(`Router / pTON:   ${friendly(router, network)} / ${friendly(ptonWallet, network)}`);
    console.log(`Token:           ${friendly(jetton.address, network)}`);
    if (!execute) {
        console.log('Dry run: re-run with --execute to deploy, launch, graduate and migrate.');
        return;
    }

    const step = async (label: string, messages: Parameters<typeof wallet.send>[0], done: () => Promise<boolean>) => {
        console.log(label);
        const seqno = await wallet.send(messages);
        await wallet.waitSeqnoPast(seqno);
        if (!(await waitFor(done))) throw new Error(`${label}: not visible on-chain yet; check the explorer.`);
    };

    if (!info) {
        await step('1. Deploying rehearsal factory', [{ to: factory.address, value: toNano('0.1'), init: factory.init! }],
            () => wallet.client.isContractDeployed(factory.address));
    }
    const graduationTarget = target ?? (await factory.getGetFactoryInfo()).graduationTarget;
    if (graduationTarget >= toNano('1500')) throw new Error('This factory has the mainnet target; refusing to rehearse.');

    await step('2. Launching token', [{
        to: factory.address, value: toNano('0.25'),
        body: beginCell().store(storeCreateToken({ $$type: 'CreateToken', queryId: 0n, salt, content: beginCell().storeUint(0, 8).endCell(), initialBuyTon: 0n })).endCell(),
    }], async () => (await jetton.getGetCurveState()).initialized);

    const gross = (graduationTarget * 10000n) / 9800n + toNano('0.01');
    await step(`3. Buying ${Number(gross) / 1e9} TON to graduate`, [{
        to: jetton.address, value: gross + toNano('0.1'),
        body: beginCell().store(storeBuy({ $$type: 'Buy', queryId: 0n, tonAmount: gross, minTokensOut: 0n, referrer: null })).endCell(),
    }], async () => (await jetton.getGetCurveState()).graduated);

    await step('4. Sending Migrate', [{
        to: jetton.address, value: toNano('0.1'),
        body: beginCell().store(storeMigrate({ $$type: 'Migrate', queryId: 0n })).endCell(),
    }], async () => (await jetton.getGetCurveState()).migrated);

    console.log('5. Checking the STON.fi pool');
    const routerJettonWallet = await jetton.getGetWalletAddress(router);
    const res = await wallet.client.runMethod(router, 'get_pool_address', [
        { type: 'slice', cell: beginCell().storeAddress(routerJettonWallet).endCell() },
        { type: 'slice', cell: beginCell().storeAddress(ptonWallet).endCell() },
    ]);
    const pool = res.stack.readAddress();
    const deployed = await waitFor(() => wallet.client.isContractDeployed(pool), 180_000);
    if (!deployed) throw new Error(`Pool ${friendly(pool, network)} not deployed; check whether STON.fi refunded the liquidity manager.`);
    const lpMaster = wallet.client.open(JettonMaster.create(pool));
    const lpData = await lpMaster.getJettonData();
    const zeroLpWallet = await lpMaster.getWalletAddress(ZERO);
    console.log(`Pool:            https://testnet.tonviewer.com/${friendly(pool, network)}`);
    console.log(`LP supply:       ${lpData.totalSupply}`);
    console.log(`Zero-address LP: https://testnet.tonviewer.com/${friendly(zeroLpWallet, network)}`);
    console.log('PASS if the pool shows both reserves and the zero-address LP wallet holds the LP. Record both in docs/VERIFICATION.md.');
}

main().catch((e) => {
    console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
});
