/**
 * Deploy LaunchpadFactory.
 *
 *   npm run deploy:testnet -- [--dry-run]
 *   MAINNET_GO_LIVE_APPROVED=yes npm run deploy:mainnet -- [--dry-run]
 *
 * Reads (never prints) DEPLOY_MNEMONIC. Needs PLATFORM_TREASURY_ADDRESS.
 * LIQUIDITY_MANAGER_ADDRESS defaults to the deployer wallet, which then runs
 * the graduation keeper (scripts/graduate.ts).
 *
 * Safe to re-run: the factory address is deterministic, so an existing
 * deployment is detected and reused instead of deployed twice.
 */
import { toNano } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';
import { LaunchpadFactory } from '../build/Launchpad_LaunchpadFactory';
import { friendly, openWallet, parseNetwork, requireAddress, waitFor } from './lib/wallet';

const DEPLOY_VALUE = toNano('0.1');
const MIN_DEPLOYER_BALANCE = toNano('0.2');

async function main() {
    const network = parseNetwork(process.argv[2]);
    const dryRun = process.argv.includes('--dry-run');

    if (network === 'mainnet' && !dryRun && process.env.MAINNET_GO_LIVE_APPROVED !== 'yes') {
        throw new Error(
            'Mainnet deploy is locked. It needs a passing testnet run and the founder\'s "MAINNET GO-LIVE APPROVED", ' +
                'then MAINNET_GO_LIVE_APPROVED=yes in the environment.',
        );
    }

    const treasury = requireAddress('PLATFORM_TREASURY_ADDRESS');
    const wallet = await openWallet(network, 'DEPLOY_MNEMONIC');
    const liquidityManager = process.env.LIQUIDITY_MANAGER_ADDRESS
        ? requireAddress('LIQUIDITY_MANAGER_ADDRESS')
        : wallet.address;

    const factory = await LaunchpadFactory.fromInit(wallet.address, treasury, liquidityManager);
    const opened = wallet.client.open(factory);

    console.log(`Network:            ${network}`);
    console.log(`Deployer (${wallet.version}):    ${friendly(wallet.address, network)}`);
    console.log(`Platform treasury:  ${friendly(treasury, network)}`);
    console.log(`Liquidity manager:  ${friendly(liquidityManager, network)}`);
    console.log(`Factory address:    ${friendly(factory.address, network)}`);

    const alreadyDeployed = await wallet.client.isContractDeployed(factory.address);
    if (alreadyDeployed) {
        console.log('Factory is already deployed at this address; nothing to send.');
    } else if (dryRun) {
        console.log('Dry run: nothing sent.');
        return;
    } else {
        const balance = await wallet.balance();
        if (balance < MIN_DEPLOYER_BALANCE) {
            throw new Error(`Deployer balance is ${Number(balance) / 1e9} TON; fund it with at least 0.2 TON first.`);
        }
        const seqno = await wallet.send([{ to: factory.address, value: DEPLOY_VALUE, init: factory.init! }]);
        console.log('Deploy transaction sent; waiting for the chain…');
        if (!(await wallet.waitSeqnoPast(seqno))) throw new Error('Wallet seqno did not advance; check the deployer on the explorer.');
        if (!(await waitFor(() => wallet.client.isContractDeployed(factory.address)))) {
            throw new Error('Factory not visible on-chain yet; re-run this command to check again (it will not redeploy).');
        }
    }

    const info = await opened.getGetFactoryInfo();
    if (!info.treasury.equals(treasury) || !info.liquidityManager.equals(liquidityManager)) {
        throw new Error('Deployed factory reports a different treasury or liquidity manager than configured.');
    }
    if (info.tradeFeeBps !== 200n || info.creatorFeeBps !== 6000n) {
        throw new Error('Deployed factory reports unexpected fee parameters.');
    }
    console.log(`Verified on-chain: fee ${info.tradeFeeBps} bps, creator share ${info.creatorFeeBps} bps, launches ${info.launchCount}`);

    const artifact = {
        network,
        factoryAddress: friendly(factory.address, network),
        platformTreasury: friendly(treasury, network),
        liquidityManager: friendly(liquidityManager, network),
        deployer: friendly(wallet.address, network),
        verifiedAt: new Date().toISOString(),
    };
    const outPath = path.join(__dirname, '..', `deployed.${network}.json`);
    fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2) + '\n');
    console.log(`Wrote ${path.basename(outPath)}. Set FACTORY_ADDRESS and VITE_FACTORY_ADDRESS to ${artifact.factoryAddress}`);
}

main().catch((e) => {
    console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
});
