/**
 * Testnet trade check (runbook steps 5-7) without the app: launch a token on
 * the deployed testnet factory, buy, sell half, try a sell with too little TON
 * and a buy with a stale quote (both must refund), then sell the rest.
 * Testnet only; costs about 0.3 TON of faucet TON, most of it returned.
 *
 *   npm run check:trades -- --env-file ../.env.testnet [--factory <address>]
 *
 * Needs DEPLOY_MNEMONIC. The factory comes from --factory, FACTORY_ADDRESS or
 * deployed.testnet.json.
 */
import { Address, beginCell, toNano, type Transaction } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';
import { LaunchpadFactory, storeCreateToken } from '../build/Launchpad_LaunchpadFactory';
import { LaunchpadJetton, storeBuy } from '../build/Launchpad_LaunchpadJetton';
import { JettonWallet } from '../build/Launchpad_JettonWallet';
import { loadEnvFileArg } from './lib/env';
import { friendly, openWallet, waitFor } from './lib/wallet';

const LAUNCH_FEE = toNano('0.05');
const CREATE_GAS = toNano('0.15');
const BUY_GAS = toNano('0.1');
const SELL_VALUE = toNano('0.1');
const SELL_PAYLOAD_OP = 0x53454c4c;
const BUY_TON = toNano('0.2');

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

export function sellBody(amount: bigint, minTonOut: bigint, response: Address) {
    return beginCell()
        .storeUint(0x595f07bc, 32)
        .storeUint(0, 64)
        .storeCoins(amount)
        .storeAddress(response)
        .storeBit(true)
        .storeRef(beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(minTonOut).endCell())
        .endCell();
}

/** Values of internal messages a set of transactions sent to `to`. */
export function sentTo(txs: Transaction[], to: Address): bigint[] {
    const out: bigint[] = [];
    for (const t of txs) {
        for (const m of t.outMessages.values()) {
            if (m.info.type === 'internal' && m.info.dest.equals(to)) out.push(m.info.value.coins);
        }
    }
    return out;
}

/** The factory that deploy.ts recorded in `file` (deployed.<network>.json), if the file exists. */
export function deployedFactory(file: string): Address | undefined {
    if (!fs.existsSync(file)) return undefined;
    return Address.parse((JSON.parse(fs.readFileSync(file, 'utf8')) as { factoryAddress: string }).factoryAddress);
}

function factoryAddress(): Address {
    const v = arg('--factory') ?? process.env.FACTORY_ADDRESS;
    if (v) return Address.parse(v);
    const f = deployedFactory(path.join(__dirname, '..', 'deployed.testnet.json'));
    if (f) return f;
    throw new Error('No factory: pass --factory, set FACTORY_ADDRESS or run npm run deploy:testnet first.');
}

async function main() {
    loadEnvFileArg();
    const network = 'testnet' as const;
    const wallet = await openWallet(network, 'DEPLOY_MNEMONIC');
    const c = wallet.client;
    const factory = c.open(LaunchpadFactory.fromAddress(factoryAddress()));
    const info = await factory.getGetFactoryInfo();
    const salt = BigInt(Date.now());
    const jetton = c.open(await LaunchpadJetton.fromInit(factory.address, wallet.address, salt));
    const results: string[] = [];
    const check = (label: string, ok: boolean, detail = '') => {
        results.push(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `: ${detail}` : ''}`);
        console.log(results[results.length - 1]);
        if (!ok) throw new Error(`${label} failed`);
    };
    const step = async (messages: Parameters<typeof wallet.send>[0]) => {
        const seqno = await wallet.send(messages);
        if (!(await wallet.waitSeqnoPast(seqno))) throw new Error('Wallet seqno did not advance');
    };
    const curve = () => jetton.getGetCurveState();
    const myWallet = async () => c.open(JettonWallet.fromAddress(await jetton.getGetWalletAddress(wallet.address)));
    const myBalance = async () => {
        const w = await myWallet();
        return (await c.isContractDeployed(w.address)) ? (await w.getGetWalletData()).balance : 0n;
    };
    const settle = () => new Promise((r) => setTimeout(r, 12_000));

    console.log(`Wallet:  ${friendly(wallet.address, network)} (${Number(await wallet.balance()) / 1e9} TON)`);
    console.log(`Factory: ${friendly(factory.address, network)} (fee ${info.tradeFeeBps} bps, creator fee ${info.creatorFeeBps} bps)`);
    console.log(`Token:   ${friendly(jetton.address, network)}`);

    // 1. Launch
    await step([{
        to: factory.address, value: LAUNCH_FEE + CREATE_GAS + toNano('0.05'),
        body: beginCell().store(storeCreateToken({ $$type: 'CreateToken', queryId: 0n, salt, content: beginCell().storeUint(0, 8).endCell(), initialBuyTon: 0n })).endCell(),
    }]);
    check('launch', await waitFor(async () => (await curve()).initialized));

    // 2. Buy 0.2 TON and check the fee split on-chain.
    const q = await jetton.getQuoteBuy(BUY_TON);
    const raisedBefore = (await curve()).realTonRaised;
    await step([{ to: jetton.address, value: BUY_TON + BUY_GAS, body: beginCell().store(storeBuy({ $$type: 'Buy', queryId: 1n, tonAmount: BUY_TON, minTokensOut: 0n, referrer: null })).endCell() }]);
    check('buy', await waitFor(async () => (await myBalance()) === q.tokensOut), `${q.tokensOut} tokens`);
    const raised = (await curve()).realTonRaised - raisedBefore;
    check('curve keeps 98%', raised === BUY_TON - q.fee, `${Number(raised) / 1e9} TON`);
    await settle();
    const txs = await c.getTransactions(jetton.address, { limit: 10 });
    const paid = sentTo(txs, wallet.address);
    const st = await curve();
    const fees = paid.filter((v) => v === q.creatorFee || v === q.platformFee);
    check('creator 1.2% and treasury 0.8% paid', fees.includes(q.creatorFee) && fees.includes(q.platformFee) && st.treasury.equals(wallet.address),
        `creator ${Number(q.creatorFee) / 1e9}, treasury ${Number(q.platformFee) / 1e9} TON`);

    // 3. Sell half.
    const half = q.tokensOut / 2n;
    const qs = await jetton.getQuoteSell(half);
    const tonBefore = await wallet.balance();
    await step([{ to: (await myWallet()).address, value: SELL_VALUE, body: sellBody(half, 0n, wallet.address) }]);
    check('sell half', await waitFor(async () => (await myBalance()) === q.tokensOut - half));
    await settle();
    const gained = (await wallet.balance()) - tonBefore;
    check('seller received TON', gained > 0n, `net +${Number(gained) / 1e9} TON (quote ${Number(qs.tonOut) / 1e9})`);

    // 4. Sell with too little TON attached: tokens must come back.
    const rest = await myBalance();
    await step([{ to: (await myWallet()).address, value: toNano('0.04'), body: sellBody(rest, 0n, wallet.address) }]);
    await settle();
    check('underfunded sell refunds tokens', await waitFor(async () => (await myBalance()) === rest), `${rest} tokens kept`);

    // 5. Buy with a stale quote: rejected, TON refunded, supply unchanged.
    const supply = (await curve()).totalSupply;
    const stale = await jetton.getQuoteBuy(toNano('0.05'));
    const before = await wallet.balance();
    await step([{ to: jetton.address, value: toNano('0.05') + BUY_GAS, body: beginCell().store(storeBuy({ $$type: 'Buy', queryId: 2n, tonAmount: toNano('0.05'), minTokensOut: stale.tokensOut + 1n, referrer: null })).endCell() }]);
    await settle();
    const lost = before - (await wallet.balance());
    check('stale-quote buy refunded', (await curve()).totalSupply === supply && lost < toNano('0.03'), `cost ${Number(lost) / 1e9} TON in gas`);

    // 6. Sell the rest.
    await step([{ to: (await myWallet()).address, value: SELL_VALUE, body: sellBody(rest, 0n, wallet.address) }]);
    check('sell rest', await waitFor(async () => (await myBalance()) === 0n));
    check('supply back to zero', (await curve()).totalSupply === 0n);

    console.log(`\nAll ${results.length} checks passed. Token ${friendly(jetton.address, network)}; see https://testnet.tonviewer.com/${jetton.address.toString({ testOnly: true })}`);
}

if (require.main === module) {
    main().catch((e) => {
        console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
    });
}
