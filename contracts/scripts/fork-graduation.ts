/**
 * Graduation rehearsal against a local fork of TON mainnet (no TON spent).
 *
 * STON.fi's published testnet v2 router does not run on testnet (every call
 * aborts with exit 9, see docs/VERIFICATION.md), so the last leg of the
 * public-testnet rehearsal, pool creation, cannot be observed there. This
 * script runs the whole graduation in @ton/sandbox while reading the real
 * mainnet STON.fi router, pTON and their libraries from a mainnet lite API on
 * demand. Nothing is signed or sent to any network.
 *
 *   npm run rehearse:fork [-- --router <mainnet v2 router>]
 *
 * Uses the rehearsal build (graduation target REHEARSAL_TARGET_TON, default 1.5).
 * Optional: STON_ROUTER_ADDRESS (otherwise the STON.fi API picks a mainnet
 * constant-product v2 router with pool creation enabled), TON_V4_ENDPOINT
 * (default https://mainnet-v4.tonhubapi.com), TONCENTER_API_KEY.
 */
import { Address, beginCell, Cell, CellType, Dictionary, toNano } from '@ton/core';
import { Blockchain, RemoteBlockchainStorage, wrapTonClient4ForRemote, type SandboxContract, type SendMessageResult } from '@ton/sandbox';
import { JettonMaster, TonClient4 } from '@ton/ton';
import { StonApiClient } from '@ston-fi/api';
import * as fs from 'fs';
import * as path from 'path';
import { resolveDex } from './lib/dex';
import { loadEnvFileArg } from './lib/env';
import { client as tonClient } from './lib/wallet';

type FactoryModule = typeof import('../build/Launchpad_LaunchpadFactory');
type JettonModule = typeof import('../build/Launchpad_LaunchpadJetton');

const OUT = path.join(__dirname, '..', 'build-rehearsal', 'out');
const ZERO = new Address(0, Buffer.alloc(32));

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Hashes of every library cell reachable from these cells. */
export function libraryRefs(roots: (Cell | null | undefined)[]): Buffer[] {
    const seen = new Set<string>();
    const found = new Map<string, Buffer>();
    const stack = roots.filter((c): c is Cell => !!c);
    while (stack.length) {
        const c = stack.pop()!;
        const key = c.hash().toString('hex');
        if (seen.has(key)) continue;
        seen.add(key);
        if (c.type === CellType.Library) {
            const s = c.beginParse(true);
            s.loadUint(8);
            const h = s.loadBuffer(32);
            found.set(h.toString('hex'), h);
        }
        stack.push(...c.refs);
    }
    return [...found.values()];
}

async function fetchLibrary(hash: Buffer): Promise<Cell> {
    const hex = hash.toString('hex');
    const tonapi = await fetch(`https://tonapi.io/v2/blockchain/libraries/${hex}`).catch(() => null);
    if (tonapi?.ok) {
        const j = (await tonapi.json()) as { boc?: string };
        if (j.boc) return Cell.fromBoc(Buffer.from(j.boc, /^[0-9a-f]+$/i.test(j.boc) ? 'hex' : 'base64'))[0];
    }
    const key = process.env.TONCENTER_API_KEY ? `&api_key=${process.env.TONCENTER_API_KEY}` : '';
    const tc = await fetch(`https://toncenter.com/api/v2/getLibraries?libraries=${hex}${key}`);
    const j = (await tc.json()) as { result?: { result?: { hash: string; data: string }[] } };
    const item = j.result?.result?.find((r) => Buffer.from(r.hash, 'base64').toString('hex') === hex) ?? j.result?.result?.[0];
    if (!item) throw new Error(`Library ${hex} not found on mainnet`);
    return Cell.fromBoc(Buffer.from(item.data, 'base64'))[0];
}

async function main() {
    loadEnvFileArg();
    if (!fs.existsSync(path.join(OUT, 'Launchpad_LaunchpadFactory.ts'))) throw new Error('Run `npm run build:rehearsal` first.');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LaunchpadFactory, storeCreateToken } = require(path.join(OUT, 'Launchpad_LaunchpadFactory')) as FactoryModule;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LaunchpadJetton, storeBuy, storeMigrate } = require(path.join(OUT, 'Launchpad_LaunchpadJetton')) as JettonModule;

    // 1. Pick and check the mainnet router exactly as the mainnet deploy does.
    let routerArg = arg('--router') ?? process.env.STON_ROUTER_ADDRESS;
    const api = new StonApiClient(process.env.STONFI_API_URL ? { baseURL: process.env.STONFI_API_URL } : undefined);
    if (!routerArg) {
        const routers = await api.getRouters();
        const pick = routers.find((r) => r.majorVersion === 2 && /constant/i.test(r.routerType) && r.poolCreationEnabled);
        if (!pick) throw new Error('STON.fi API lists no constant-product v2 router with pool creation enabled.');
        routerArg = pick.address;
    }
    const reader = tonClient('mainnet');
    const { router, ptonWallet, ptonMaster, source } = await resolveDex(reader, 'mainnet', {
        ...process.env, STON_ROUTER_ADDRESS: routerArg, STON_PTON_WALLET_ADDRESS: '',
    });
    console.log(`Mainnet router:  ${router.toString()} (${source})`);
    console.log(`pTON master / router pTON wallet: ${ptonMaster.toString()} / ${ptonWallet.toString()}`);

    // 2. Local chain that reads missing accounts from mainnet.
    const v4 = new TonClient4({ endpoint: process.env.TON_V4_ENDPOINT || 'https://mainnet-v4.tonhubapi.com', timeout: 30_000 });
    const chain = await Blockchain.create({ storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(v4)) });
    chain.now = Math.floor(Date.now() / 1000);

    const libs = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
    const loadLibs = async (addresses: Address[]) => {
        const roots: Cell[] = [];
        for (const a of addresses) {
            const acc = (await chain.getContract(a)).accountState;
            if (acc?.type === 'active') roots.push(...[acc.state.code, acc.state.data].filter((c): c is Cell => !!c));
        }
        let pending = libraryRefs(roots).filter((h) => !libs.has(h));
        while (pending.length) {
            const next: Cell[] = [];
            for (const h of pending) {
                const lib = await fetchLibrary(h);
                if (!lib.hash().equals(h)) throw new Error(`Library ${h.toString('hex')} came back with a different hash`);
                libs.set(h, lib);
                next.push(lib);
            }
            pending = libraryRefs(next).filter((h) => !libs.has(h));
        }
        chain.libs = libs.size ? beginCell().storeDictDirect(libs).endCell() : undefined;
    };
    await loadLibs([router, ptonMaster, ptonWallet]);
    console.log(`Mainnet libraries loaded: ${libs.size}`);

    const deployer = await chain.treasury('deployer', { balance: toNano('100') });
    const factory: SandboxContract<InstanceType<FactoryModule['LaunchpadFactory']>> = chain.openContract(
        await LaunchpadFactory.fromInit(deployer.address, deployer.address, deployer.address, { $$type: 'DexConfig', router, ptonWallet }),
    );
    const fail = (label: string, r: SendMessageResult): never => {
        for (const t of r.transactions) {
            const d = t.description as { computePhase?: { type: string; exitCode?: number }; aborted?: boolean };
            if (d.aborted) console.log(`  aborted at ${String(t.inMessage?.info.dest ?? '?')} exit ${d.computePhase?.type === 'vm' ? d.computePhase.exitCode : d.computePhase?.type}`);
        }
        throw new Error(`${label} failed`);
    };

    let r = await deployer.send({ to: factory.address, value: toNano('0.1'), init: factory.init, bounce: false });
    if (!(await chain.getContract(factory.address)).accountState) fail('1. Deploy factory', r);
    const target = (await factory.getGetFactoryInfo()).graduationTarget;
    if (target >= toNano('1500')) throw new Error('Rehearsal build expected; this factory has the mainnet target.');
    console.log(`1. Factory deployed (graduation target ${Number(target) / 1e9} TON): PASS`);

    const salt = 1n;
    const jetton = chain.openContract(await LaunchpadJetton.fromInit(factory.address, deployer.address, salt));
    r = await deployer.send({
        to: factory.address, value: toNano('0.25'),
        body: beginCell().store(storeCreateToken({ $$type: 'CreateToken', queryId: 0n, salt, content: beginCell().storeUint(0, 8).endCell(), initialBuyTon: 0n })).endCell(),
    });
    if (!(await jetton.getGetCurveState()).initialized) fail('2. Launch token', r);
    console.log('2. Token launched: PASS');

    const gross = (target * 10000n) / 9800n + toNano('0.01');
    r = await deployer.send({
        to: jetton.address, value: gross + toNano('0.1'),
        body: beginCell().store(storeBuy({ $$type: 'Buy', queryId: 0n, tonAmount: gross, minTokensOut: 0n, referrer: null })).endCell(),
    });
    if (!(await jetton.getGetCurveState()).graduated) fail('3. Buy to graduation', r);
    console.log(`3. Bought ${Number(gross) / 1e9} TON, graduated: PASS`);

    r = await deployer.send({
        to: jetton.address, value: toNano('0.1'),
        body: beginCell().store(storeMigrate({ $$type: 'Migrate', queryId: 0n })).endCell(),
    });
    if (!(await jetton.getGetCurveState()).migrated) fail('4. Migrate', r);
    const aborted = r.transactions.filter((t) => (t.description as { aborted?: boolean }).aborted);
    console.log(`4. Migrated: PASS (${r.transactions.length} transactions, ${aborted.length} aborted)`);

    const routerJettonWallet = await jetton.getGetWalletAddress(router);
    const routerContract = await chain.getContract(router);
    const res = await routerContract.get('get_pool_address', [
        { type: 'slice', cell: beginCell().storeAddress(routerJettonWallet).endCell() },
        { type: 'slice', cell: beginCell().storeAddress(ptonWallet).endCell() },
    ]);
    const pool = res.stackReader.readAddress();
    const poolState = (await chain.getContract(pool)).accountState;
    if (poolState?.type !== 'active') fail(`5. STON.fi pool ${pool.toString()} not created`, r);
    const lp = chain.openContract(JettonMaster.create(pool));
    const lpData = await lp.getJettonData();
    const zeroLp = await lp.getWalletAddress(ZERO);
    const zeroState = (await chain.getContract(zeroLp)).accountState;
    console.log(`5. Pool ${pool.toString()} active, LP supply ${lpData.totalSupply}: PASS`);
    console.log(`6. Zero-address LP wallet ${zeroLp.toString()} ${zeroState?.type === 'active' ? 'exists: PASS' : 'missing: FAIL'}`);
    if (zeroState?.type !== 'active') process.exit(1);
    console.log('PASS: graduation creates the STON.fi pool on the real mainnet router code and burns the LP.');
}

if (require.main === module) {
    main().catch((e) => {
        console.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
    });
}
