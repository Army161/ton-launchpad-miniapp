/**
 * Graduation keeper. For a graduated launchpad token:
 *   1. sends the permissionless Migrate, which moves the curve's TON and the
 *      remaining supply to the liquidity manager wallet;
 *   2. seeds a STON.fi v2 TON/jetton pool from that wallet.
 *
 *   npm run graduate -- <testnet|mainnet> <jettonAddress> [--ton=<amount>] [--execute]
 *   npm run graduate -- <testnet|mainnet> --lock-lp --pool=<poolAddress> [--execute]
 *
 * --lock-lp sends every LP token the keeper holds for that pool to the zero
 * address, which locks the liquidity permanently (irreversible).
 *
 * The TON side of the pool is the curve reserve moved by Migrate. If Migrate
 * already ran in an earlier invocation, pass it with --ton=<amount>.
 *
 * Without --execute it only prints the plan. The liquidity manager must be the
 * wallet behind KEEPER_MNEMONIC (default: DEPLOY_MNEMONIC, which is also the
 * default liquidity manager chosen at factory deploy).
 */
import { Address, beginCell, toNano } from '@ton/core';
import { StonApiClient } from '@ston-fi/api';
import { dexFactory } from '@ston-fi/sdk';
import { LaunchpadJetton, storeMigrate } from '../build/Launchpad_LaunchpadJetton';
import { JettonWallet } from '../build/Launchpad_JettonWallet';
import { JettonMaster, JettonWallet as TonJettonWallet } from '@ton/ton';
import { friendly, openWallet, parseNetwork, waitFor, type Network } from './lib/wallet';

const MIGRATE_GAS = toNano('0.15');
/** TON kept back in the keeper wallet for the STON.fi message fees. */
const KEEPER_GAS_RESERVE = toNano('1');

const ZERO_ADDRESS = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');

async function lockLp(network: Network, execute: boolean) {
    const poolArg = process.argv.find((a) => a.startsWith('--pool='));
    if (!poolArg) throw new Error('--lock-lp needs --pool=<poolAddress>');
    const pool = Address.parse(poolArg.slice(7));
    const keeper = await openWallet(network, process.env.KEEPER_MNEMONIC ? 'KEEPER_MNEMONIC' : 'DEPLOY_MNEMONIC');
    const lpWalletAddress = await keeper.client.open(JettonMaster.create(pool)).getWalletAddress(keeper.address);
    const lpBalance = await keeper.client.open(TonJettonWallet.create(lpWalletAddress)).getBalance();
    console.log(`Pool:        ${friendly(pool, network)}`);
    console.log(`LP held:     ${lpBalance} units in ${friendly(lpWalletAddress, network)}`);
    if (lpBalance === 0n) throw new Error('Keeper holds no LP tokens for this pool.');
    console.log(`Plan:        transfer all LP to ${ZERO_ADDRESS.toString()} (permanent lock)`);
    if (!execute) {
        console.log('Dry run: re-run with --execute to send.');
        return;
    }
    const body = beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(lpBalance)
        .storeAddress(ZERO_ADDRESS)
        .storeAddress(keeper.address)
        .storeBit(false)
        .storeCoins(0)
        .storeBit(false)
        .endCell();
    const seqno = await keeper.send([{ to: lpWalletAddress, value: toNano('0.05'), body }]);
    await keeper.waitSeqnoPast(seqno);
    console.log('LP transfer sent. Confirm on the explorer that the keeper LP balance is 0.');
}

async function main() {
    const network = parseNetwork(process.argv[2]);
    if (process.argv.includes('--lock-lp')) {
        const execute = process.argv.includes('--execute');
        if (network === 'mainnet' && execute && process.env.MAINNET_GO_LIVE_APPROVED !== 'yes') {
            throw new Error('Mainnet execution needs MAINNET_GO_LIVE_APPROVED=yes.');
        }
        return lockLp(network, execute);
    }
    const jettonAddress = Address.parse(process.argv[3] ?? '');
    const execute = process.argv.includes('--execute');
    if (network === 'mainnet' && execute && process.env.MAINNET_GO_LIVE_APPROVED !== 'yes') {
        throw new Error('Mainnet execution needs MAINNET_GO_LIVE_APPROVED=yes.');
    }

    const keeper = await openWallet(network, process.env.KEEPER_MNEMONIC ? 'KEEPER_MNEMONIC' : 'DEPLOY_MNEMONIC');
    const jetton = keeper.client.open(LaunchpadJetton.fromAddress(jettonAddress));
    let state = await jetton.getGetCurveState();

    console.log(`Token:              ${friendly(jettonAddress, network)}`);
    console.log(`Raised:             ${Number(state.realTonRaised) / 1e9} TON of ${Number(state.graduationTarget) / 1e9}`);
    console.log(`Liquidity manager:  ${friendly(state.liquidityManager, network)}`);
    console.log(`Keeper wallet:      ${friendly(keeper.address, network)}`);

    if (!state.graduated) {
        console.log('Not graduated yet; nothing to do.');
        return;
    }
    if (!state.liquidityManager.equals(keeper.address)) {
        throw new Error('This keeper wallet is not the token\'s liquidity manager; it cannot seed the pool.');
    }

    const tonArg = process.argv.find((a) => a.startsWith('--ton='));
    let tonUnits = tonArg ? toNano(tonArg.slice(6)) : state.migrated ? 0n : state.realTonRaised;
    if (tonUnits === 0n) throw new Error('Already migrated: pass the pool TON amount with --ton=<amount>.');

    // ── 1. Migrate ──────────────────────────────────────────────────────────
    if (!state.migrated) {
        console.log(`Step 1: Migrate (${Number(state.realTonRaised) / 1e9} TON, ${Number(state.virtualTokens) / 1e9} tokens → liquidity manager)`);
        if (!execute) {
            console.log('Dry run: re-run with --execute to send.');
            return;
        }
        const seqno = await keeper.send([
            { to: jettonAddress, value: MIGRATE_GAS, body: beginCell().store(storeMigrate({ $$type: 'Migrate', queryId: 0n })).endCell() },
        ]);
        await keeper.waitSeqnoPast(seqno);
        if (!(await waitFor(async () => (await jetton.getGetCurveState()).migrated))) {
            throw new Error('Migrate not visible yet; re-run to continue.');
        }
        state = await jetton.getGetCurveState();
    }

    // ── 2. Seed STON.fi ─────────────────────────────────────────────────────
    const lmWallet = keeper.client.open(JettonWallet.fromAddress(await jetton.getGetWalletAddress(keeper.address)));
    const jettonUnits = (await lmWallet.getGetWalletData()).balance;
    const spendable = (await keeper.balance()) - KEEPER_GAS_RESERVE;
    if (tonUnits > spendable) tonUnits = spendable;
    if (jettonUnits <= 0n || tonUnits <= 0n) throw new Error('Liquidity manager holds no liquidity to provide.');

    const api = new StonApiClient(process.env.STONFI_API_URL ? { baseURL: process.env.STONFI_API_URL } : undefined);
    const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const sim = await api.simulateLiquidityProvision({
        provisionType: 'Initial',
        tokenA: TON_ADDRESS,
        tokenB: jettonAddress.toString(),
        tokenAUnits: tonUnits.toString(),
        tokenBUnits: jettonUnits.toString(),
        slippageTolerance: '0.01',
        walletAddress: keeper.address.toString(),
    });
    console.log(`Step 2: STON.fi pool ${sim.poolAddress} via router ${sim.routerAddress}`);
    console.log(`        providing ${Number(tonUnits) / 1e9} TON + ${Number(jettonUnits) / 1e9} tokens, est. LP ${sim.estimatedLpUnits}`);
    if (!sim.router.poolCreationEnabled) throw new Error('STON.fi router does not allow pool creation right now.');
    if (!execute) {
        console.log('Dry run: re-run with --execute to send.');
        return;
    }

    const { Router, pTON } = dexFactory(sim.router);
    const router = keeper.client.open(Router.create(sim.router.address));
    const proxyTon = pTON.create(sim.router.ptonMasterAddress);
    const tonSide = await router.getProvideLiquidityTonTxParams({
        userWalletAddress: keeper.address,
        proxyTon,
        otherTokenAddress: jettonAddress,
        sendAmount: tonUnits,
        minLpOut: '1',
    });
    const jettonSide = await router.getProvideLiquidityJettonTxParams({
        userWalletAddress: keeper.address,
        sendTokenAddress: jettonAddress,
        otherTokenAddress: proxyTon.address,
        sendAmount: jettonUnits,
        minLpOut: '1',
    });
    const seqno = await keeper.send([
        { to: tonSide.to, value: tonSide.value, body: tonSide.body ?? undefined },
        { to: jettonSide.to, value: jettonSide.value, body: jettonSide.body ?? undefined },
    ]);
    await keeper.waitSeqnoPast(seqno);
    console.log(`Liquidity sent. Check the pool: https://${network === 'testnet' ? 'testnet.' : ''}tonviewer.com/${sim.poolAddress}`);
    console.log(`Then lock the LP: npm run graduate -- ${network} --lock-lp --pool=${sim.poolAddress} --execute`);
}

main().catch((e) => {
    console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
});
