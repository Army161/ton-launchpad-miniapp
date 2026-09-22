/**
 * Graduation keeper. For a graduated launchpad token:
 *   1. sends the permissionless Migrate, which moves the curve's TON and the
 *      remaining supply to the liquidity manager wallet;
 *   2. seeds a STON.fi v2 TON/jetton pool from that wallet.
 *
 *   npm run graduate -- <testnet|mainnet> <jettonAddress> [--ton=<amount>] [--execute]
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
import { friendly, openWallet, parseNetwork, waitFor } from './lib/wallet';

const MIGRATE_GAS = toNano('0.15');
/** TON kept back in the keeper wallet for the STON.fi message fees. */
const KEEPER_GAS_RESERVE = toNano('1');

async function main() {
    const network = parseNetwork(process.argv[2]);
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
}

main().catch((e) => {
    console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
});
