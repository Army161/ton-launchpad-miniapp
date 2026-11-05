/**
 * Deploy LaunchpadFactory.
 *
 *   npm run deploy:testnet -- [--dry-run]
 *   MAINNET_GO_LIVE_APPROVED=yes npm run deploy:mainnet -- [--dry-run]
 *
 * Reads (never prints) DEPLOY_MNEMONIC. Needs PLATFORM_TREASURY_ADDRESS and
 * STON_ROUTER_ADDRESS (a STON.fi v2 constant-product router for this network).
 * The router's pTON wallet is read from the STON.fi API (STONFI_API_URL for
 * testnet) and checked on-chain against the pTON master; STON_PTON_WALLET_ADDRESS
 * overrides it. Graduation seeds that router's pool directly (ADR-009).
 * LIQUIDITY_MANAGER_ADDRESS (default: the deployer wallet) only receives
 * liquidity if STON.fi refunds a provision.
 *
 * Safe to re-run: the factory address is deterministic, so an existing
 * deployment is detected and reused instead of deployed twice.
 */
import { Address, beginCell, toNano } from '@ton/core';
import { StonApiClient } from '@ston-fi/api';
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

    const router = requireAddress('STON_ROUTER_ADDRESS');
    const api = new StonApiClient(process.env.STONFI_API_URL ? { baseURL: process.env.STONFI_API_URL } : undefined);
    const routerInfo = await api.getRouter(router.toString());
    if (routerInfo.majorVersion !== 2) throw new Error(`Router is v${routerInfo.majorVersion}; graduation needs a STON.fi v2 router.`);
    if (!/constant/i.test(routerInfo.routerType)) throw new Error(`Router type is ${routerInfo.routerType}; use a constant-product router.`);
    if (!routerInfo.poolCreationEnabled) throw new Error('This router does not allow pool creation.');
    const ptonWallet = process.env.STON_PTON_WALLET_ADDRESS
        ? requireAddress('STON_PTON_WALLET_ADDRESS')
        : Address.parse(routerInfo.ptonWalletAddress);
    // The pTON master must agree that this is the router's pTON wallet, or the TON leg would be lost.
    const pton = await wallet.client.runMethod(Address.parse(routerInfo.ptonMasterAddress), 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(router).endCell() },
    ]);
    if (!pton.stack.readAddress().equals(ptonWallet)) {
        throw new Error('pTON wallet does not match the pTON master\'s wallet for this router.');
    }

    const factory = await LaunchpadFactory.fromInit(wallet.address, treasury, liquidityManager, {
        $$type: 'DexConfig', router, ptonWallet,
    });
    const opened = wallet.client.open(factory);

    console.log(`Network:            ${network}`);
    console.log(`Deployer (${wallet.version}):    ${friendly(wallet.address, network)}`);
    console.log(`Platform treasury:  ${friendly(treasury, network)}`);
    console.log(`Liquidity manager:  ${friendly(liquidityManager, network)} (refund fallback only)`);
    console.log(`STON.fi router:     ${friendly(router, network)} (v${routerInfo.majorVersion}.${routerInfo.minorVersion}, ${routerInfo.routerType})`);
    console.log(`Router pTON wallet: ${friendly(ptonWallet, network)}`);
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
    if (!info.treasury.equals(treasury) || !info.liquidityManager.equals(liquidityManager)
        || !info.dex.router.equals(router) || !info.dex.ptonWallet.equals(ptonWallet)) {
        throw new Error('Deployed factory reports a different treasury, liquidity manager or DEX than configured.');
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
        stonRouter: friendly(router, network),
        stonPtonWallet: friendly(ptonWallet, network),
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
