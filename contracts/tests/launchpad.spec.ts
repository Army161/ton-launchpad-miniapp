/**
 * Launchpad contract tests. Everything here runs the compiled contracts in the
 * TON sandbox: no maths is checked without the chain agreeing.
 */
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, toNano } from '@ton/core';
import '@ton/test-utils';
import { findTransaction } from '@ton/test-utils';
import { LaunchpadFactory, LaunchpadFactory_errors_backward as FE } from '../build/Launchpad_LaunchpadFactory';
import { LaunchpadJetton, LaunchpadJetton_errors_backward as JE } from '../build/Launchpad_LaunchpadJetton';
import { JettonWallet, JettonWallet_errors_backward as WE } from '../build/Launchpad_JettonWallet';
import {
    BUY_GAS,
    buildOnchainContent,
    buildSellBody,
    CREATE_GAS,
    expectedBuy,
    expectedSell,
    feeSplit,
    GRADUATION_TARGET,
    LAUNCH_FEE,
    MAX_INITIAL_BUY,
    MIGRATE_GAS,
    MIN_TRADE,
    MINTER_MIN_STORAGE,
    OP,
    SELL_PAYLOAD_OP,
    tonForNetAmount,
    TOTAL_SUPPLY_NANO,
    VIRTUAL_TOKENS,
    VIRTUAL_TON,
} from './helpers';

const CONTENT = buildOnchainContent({ name: 'Super Doge', symbol: 'SDOGE', decimals: '9', image: 'https://example.com/d.png' });
const SELL_VALUE = toNano('0.1');

describe('Launchpad', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let treasury: SandboxContract<TreasuryContract>;
    let liquidityManager: SandboxContract<TreasuryContract>;
    let creator: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let mallory: SandboxContract<TreasuryContract>;
    let factory: SandboxContract<LaunchpadFactory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        treasury = await blockchain.treasury('treasury');
        liquidityManager = await blockchain.treasury('liquidity');
        creator = await blockchain.treasury('creator');
        alice = await blockchain.treasury('alice', { balance: toNano('10000') });
        bob = await blockchain.treasury('bob', { balance: toNano('10000') });
        mallory = await blockchain.treasury('mallory');

        factory = blockchain.openContract(
            await LaunchpadFactory.fromInit(owner.address, treasury.address, liquidityManager.address),
        );
        const deploy = await factory.send(owner.getSender(), { value: toNano('0.1') }, null);
        expect(deploy.transactions).toHaveTransaction({ to: factory.address, deploy: true, success: true });
    });

    async function launch(salt = 1n, initialBuyTon = 0n, by = creator, value?: bigint) {
        const res = await factory.send(
            by.getSender(),
            { value: value ?? LAUNCH_FEE + initialBuyTon + CREATE_GAS },
            { $$type: 'CreateToken', queryId: 7n, salt, content: CONTENT, initialBuyTon },
        );
        const jetton = blockchain.openContract(await LaunchpadJetton.fromInit(factory.address, by.address, salt));
        return { res, jetton };
    }

    async function buy(
        jetton: SandboxContract<LaunchpadJetton>,
        who: SandboxContract<TreasuryContract>,
        tonAmount: bigint,
        minTokensOut = 0n,
        gas = BUY_GAS,
    ) {
        return jetton.send(
            who.getSender(),
            { value: tonAmount + gas },
            { $$type: 'Buy', queryId: 1n, tonAmount, minTokensOut },
        );
    }

    async function walletOf(jetton: SandboxContract<LaunchpadJetton>, who: Address) {
        return blockchain.openContract(JettonWallet.fromAddress(await jetton.getGetWalletAddress(who)));
    }

    async function balanceOf(jetton: SandboxContract<LaunchpadJetton>, who: Address) {
        const w = await walletOf(jetton, who);
        const state = await blockchain.getContract(w.address);
        if (state.accountState?.type !== 'active') return 0n;
        return (await w.getGetWalletData()).balance;
    }

    async function sell(
        jetton: SandboxContract<LaunchpadJetton>,
        who: SandboxContract<TreasuryContract>,
        amount: bigint,
        minTonOut = 0n,
        value = SELL_VALUE,
    ) {
        const w = await walletOf(jetton, who.address);
        return who.send({ to: w.address, value, body: buildSellBody(amount, minTonOut, who.address) });
    }

    async function curve(jetton: SandboxContract<LaunchpadJetton>) {
        return jetton.getGetCurveState();
    }

    async function tonBalance(addr: Address) {
        return (await blockchain.getContract(addr)).balance;
    }

    /** The reserve invariant every state must satisfy. */
    async function expectSolvent(jetton: SandboxContract<LaunchpadJetton>) {
        const s = await curve(jetton);
        expect(s.virtualTon - VIRTUAL_TON).toBe(s.realTonRaised);
        expect(s.virtualTokens + s.totalSupply).toBe(VIRTUAL_TOKENS);
        // Storage fees can nibble the storage buffer, never the reserve.
        expect(await tonBalance(jetton.address)).toBeGreaterThanOrEqual(s.realTonRaised + MINTER_MIN_STORAGE - toNano('0.001'));
    }

    // ── Factory ────────────────────────────────────────────────────────────
    describe('factory', () => {
        it('reports the locked V1 economics', async () => {
            const info = await factory.getGetFactoryInfo();
            expect(info.owner.equals(owner.address)).toBe(true);
            expect(info.treasury.equals(treasury.address)).toBe(true);
            expect(info.liquidityManager.equals(liquidityManager.address)).toBe(true);
            expect(info.launchFee).toBe(LAUNCH_FEE);
            expect(info.graduationTarget).toBe(GRADUATION_TARGET);
            expect(info.tradeFeeBps).toBe(200n);
            expect(info.creatorFeeBps).toBe(6000n);
            expect(info.launchCount).toBe(0n);
        });

        it('creates a token at the address the client can compute', async () => {
            const { res, jetton } = await launch(42n);
            expect(await factory.getGetJettonAddress(creator.address, 42n)).toEqualAddress(jetton.address);
            expect(res.transactions).toHaveTransaction({ from: factory.address, to: jetton.address, deploy: true, success: true });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: treasury.address, value: LAUNCH_FEE });

            const s = await curve(jetton);
            expect(s.initialized).toBe(true);
            expect(s.creator).toEqualAddress(creator.address);
            expect(s.factory).toEqualAddress(factory.address);
            expect(s.treasury).toEqualAddress(treasury.address);
            expect(s.liquidityManager).toEqualAddress(liquidityManager.address);
            expect(s.totalSupply).toBe(0n);
            expect(s.realTonRaised).toBe(0n);

            const data = await jetton.getGetJettonData();
            expect(data.content.equals(CONTENT)).toBe(true);
            expect(data.mintable).toBe(true);
            expect(data.adminAddress).toBeNull();
            expect((await factory.getGetFactoryInfo()).launchCount).toBe(1n);
            await expectSolvent(jetton);
        });

        it('refunds the creator everything except the launch fee and gas', async () => {
            const before = await tonBalance(creator.address);
            await launch(1n, 0n, creator, toNano('5'));
            const spent = before - (await tonBalance(creator.address));
            expect(spent).toBeGreaterThan(LAUNCH_FEE + MINTER_MIN_STORAGE);
            expect(spent).toBeLessThan(LAUNCH_FEE + MINTER_MIN_STORAGE + toNano('0.05'));
        });

        it('rejects a launch without enough TON', async () => {
            const { res, jetton } = await launch(1n, 0n, creator, LAUNCH_FEE + CREATE_GAS - 1n);
            expect(res.transactions).toHaveTransaction({ to: factory.address, success: false });
            expect((await blockchain.getContract(jetton.address)).accountState?.type).not.toBe('active');
        });

        it('rejects an initial buy above the cap or below the minimum trade', async () => {
            const tooBig = await launch(1n, MAX_INITIAL_BUY + 1n);
            expect(tooBig.res.transactions).toHaveTransaction({ to: factory.address, success: false });
            const tooSmall = await launch(2n, MIN_TRADE - 1n);
            expect(tooSmall.res.transactions).toHaveTransaction({ to: factory.address, success: false });
        });

        it('mints the initial buy to the creator', async () => {
            const initial = toNano('10');
            const { jetton } = await launch(1n, initial);
            const q = expectedBuy({ virtualTon: VIRTUAL_TON, virtualTokens: VIRTUAL_TOKENS }, initial);
            expect(await balanceOf(jetton, creator.address)).toBe(q.tokensOut);
            expect((await curve(jetton)).realTonRaised).toBe(q.tonAfterFee);
            await expectSolvent(jetton);
        });

        it('refunds a duplicate launch and leaves the token untouched', async () => {
            const { jetton } = await launch(5n, toNano('1'));
            const before = await curve(jetton);
            const creatorBefore = await tonBalance(creator.address);
            const { res } = await launch(5n, toNano('1'));
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: creator.address, success: true });
            const after = await curve(jetton);
            expect(after.totalSupply).toBe(before.totalSupply);
            expect(after.realTonRaised).toBe(before.realTonRaised);
            // Only gas was spent on the refused launch.
            expect(creatorBefore - (await tonBalance(creator.address))).toBeLessThan(toNano('0.05'));
        });

        it('only accepts JettonSetup from the factory', async () => {
            const jetton = blockchain.openContract(await LaunchpadJetton.fromInit(factory.address, mallory.address, 1n));
            const res = await jetton.send(
                mallory.getSender(),
                { value: toNano('1') },
                {
                    $$type: 'JettonSetup',
                    queryId: 0n,
                    treasury: mallory.address,
                    liquidityManager: mallory.address,
                    content: CONTENT,
                    launchFee: 0n,
                    initialBuyTon: 0n,
                },
            );
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Only factory'] });
        });

        it('lets only the owner withdraw stray factory TON', async () => {
            await owner.send({ to: factory.address, value: toNano('3') });
            const denied = await factory.send(mallory.getSender(), { value: toNano('0.05') }, { $$type: 'FactoryWithdraw', queryId: 0n });
            expect(denied.transactions).toHaveTransaction({ to: factory.address, success: false, exitCode: FE['Only owner'] });
            const ok = await factory.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'FactoryWithdraw', queryId: 0n });
            expect(ok.transactions).toHaveTransaction({ from: factory.address, to: owner.address, value: (v) => v! > toNano('2.9') });
        });
    });

    // ── Buying ─────────────────────────────────────────────────────────────
    describe('buy', () => {
        it('mints exactly the quoted amount and pays 2% split 60/40', async () => {
            const { jetton } = await launch();
            const tonAmount = toNano('1');
            const quote = await jetton.getQuoteBuy(tonAmount);
            const q = expectedBuy({ virtualTon: VIRTUAL_TON, virtualTokens: VIRTUAL_TOKENS }, tonAmount);
            expect(quote.tokensOut).toBe(q.tokensOut);
            expect(quote.fee).toBe(toNano('0.02'));
            expect(quote.creatorFee).toBe(toNano('0.012'));
            expect(quote.platformFee).toBe(toNano('0.008'));

            const res = await buy(jetton, alice, tonAmount);
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: creator.address, value: toNano('0.012') });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: treasury.address, value: toNano('0.008') });
            expect(await balanceOf(jetton, alice.address)).toBe(q.tokensOut);

            const s = await curve(jetton);
            expect(s.realTonRaised).toBe(toNano('0.98'));
            expect(s.totalSupply).toBe(q.tokensOut);
            expect(s.totalCreatorFees).toBe(toNano('0.012'));
            expect(s.totalPlatformFees).toBe(toNano('0.008'));
            expect(s.tradeCount).toBe(1n);
            expect((await jetton.getGetJettonData()).totalSupply).toBe(q.tokensOut);
            await expectSolvent(jetton);
        });

        it('keeps the reserve instead of refunding the whole contract balance', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('50'));
            const reserveBefore = await tonBalance(jetton.address);
            await buy(jetton, bob, toNano('1'));
            expect(await tonBalance(jetton.address)).toBeGreaterThan(reserveBefore);
            await expectSolvent(jetton);
        });

        it('returns unused gas to the buyer', async () => {
            const { jetton } = await launch();
            const before = await tonBalance(alice.address);
            await buy(jetton, alice, toNano('1'), 0n, toNano('2'));
            const spent = before - (await tonBalance(alice.address));
            expect(spent).toBeGreaterThan(toNano('1'));
            expect(spent).toBeLessThan(toNano('1') + toNano('0.06'));
        });

        it('rejects the trade and refunds when slippage is exceeded', async () => {
            const { jetton } = await launch();
            const q = await jetton.getQuoteBuy(toNano('1'));
            const before = await tonBalance(alice.address);
            const res = await buy(jetton, alice, toNano('1'), q.tokensOut + 1n);
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Slippage exceeded'] });
            expect(before - (await tonBalance(alice.address))).toBeLessThan(toNano('0.02'));
            expect((await curve(jetton)).totalSupply).toBe(0n);
        });

        it('rejects zero, dust and under-funded buys', async () => {
            const { jetton } = await launch();
            const zero = await buy(jetton, alice, 0n);
            expect(zero.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Trade too small'] });
            const dust = await buy(jetton, alice, MIN_TRADE - 1n);
            expect(dust.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Trade too small'] });
            const underfunded = await buy(jetton, alice, toNano('1'), 0n, BUY_GAS - 1n);
            expect(underfunded.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Insufficient TON attached'] });
            // Claims more TON than attached.
            const lying = await jetton.send(alice.getSender(), { value: toNano('0.2') }, { $$type: 'Buy', queryId: 0n, tonAmount: toNano('100'), minTokensOut: 0n });
            expect(lying.transactions).toHaveTransaction({ to: jetton.address, success: false });
            expect((await curve(jetton)).totalSupply).toBe(0n);
        });

        it('rejects a malformed buy message', async () => {
            const { jetton } = await launch();
            const res = await alice.send({
                to: jetton.address,
                value: toNano('1'),
                body: beginCell().storeUint(OP.buy, 32).storeUint(0, 64).endCell(),
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false });
        });

        it('rejects buys on a token the factory never set up', async () => {
            const jetton = blockchain.openContract(await LaunchpadJetton.fromInit(factory.address, mallory.address, 9n));
            // Anyone can deploy the code at that address, but it stays inert.
            await mallory.send({ to: jetton.address, value: toNano('0.5'), init: jetton.init, body: beginCell().storeUint(OP.migrate, 32).storeUint(0, 64).endCell() });
            const res = await buy(jetton, alice, toNano('1'));
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Not initialized'] });
        });
    });

    // ── Selling ────────────────────────────────────────────────────────────
    describe('sell', () => {
        it('a bought token can be sold back for the quoted TON (not a honeypot)', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('10'));
            const held = await balanceOf(jetton, alice.address);
            const s = await curve(jetton);
            const quote = await jetton.getQuoteSell(held);
            const q = expectedSell(s, held);
            expect(quote.tonOut).toBe(q.tonOut);

            const res = await sell(jetton, alice, held, quote.tonOut);
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: alice.address, value: (v) => v! >= q.tonOut });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: creator.address, value: q.creatorFee });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: treasury.address, value: q.platformFee });
            expect(await balanceOf(jetton, alice.address)).toBe(0n);
            expect((await curve(jetton)).totalSupply).toBe(0n);
            await expectSolvent(jetton);
        });

        it('pays the seller net TON: a round trip costs about 4% plus gas', async () => {
            const { jetton } = await launch();
            const before = await tonBalance(alice.address);
            await buy(jetton, alice, toNano('10'));
            await sell(jetton, alice, await balanceOf(jetton, alice.address));
            const lost = before - (await tonBalance(alice.address));
            expect(lost).toBeGreaterThan(toNano('0.39'));
            expect(lost).toBeLessThan(toNano('0.52'));
        });

        it('restores the jettons when sell slippage is exceeded', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('5'));
            const held = await balanceOf(jetton, alice.address);
            const q = await jetton.getQuoteSell(held);
            const res = await sell(jetton, alice, held, q.tonOut + 1n);
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Slippage exceeded'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
            expect((await curve(jetton)).totalSupply).toBe(held);
        });

        it('refuses to sell more than the wallet holds', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const held = await balanceOf(jetton, alice.address);
            const res = await sell(jetton, alice, held + 1n);
            expect(res.transactions).toHaveTransaction({ success: false, exitCode: WE['Insufficient jetton balance'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });

        it('refuses a sell that cannot pay its gas', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const held = await balanceOf(jetton, alice.address);
            const res = await sell(jetton, alice, held, 0n, toNano('0.03'));
            expect(res.transactions).toHaveTransaction({ success: false, exitCode: WE['Insufficient TON attached'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });

        it('rejects a plain burn while the curve is open and gives the jettons back', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const held = await balanceOf(jetton, alice.address);
            const w = await walletOf(jetton, alice.address);
            const res = await w.send(alice.getSender(), { value: SELL_VALUE }, {
                $$type: 'JettonBurn', queryId: 0n, amount: held, responseDestination: alice.address, customPayload: null,
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Sell through the curve'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });

        it('rejects an unknown burn payload', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const held = await balanceOf(jetton, alice.address);
            const w = await walletOf(jetton, alice.address);
            const res = await w.send(alice.getSender(), { value: SELL_VALUE }, {
                $$type: 'JettonBurn', queryId: 0n, amount: held, responseDestination: alice.address,
                customPayload: beginCell().storeUint(0xdeadbeef, 32).storeCoins(0).endCell(),
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Unknown burn payload'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });
    });

    // ── Access control ─────────────────────────────────────────────────────
    describe('access control', () => {
        it('a forged burn notification cannot withdraw TON', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('100'));
            const reserve = (await curve(jetton)).realTonRaised;
            const res = await jetton.send(mallory.getSender(), { value: toNano('0.2') }, {
                $$type: 'JettonBurnNotification', queryId: 0n, amount: 10n ** 17n, sender: mallory.address,
                responseDestination: mallory.address,
                customPayload: beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(0).endCell(),
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Invalid sender'] });
            expect((await curve(jetton)).realTonRaised).toBe(reserve);
            await expectSolvent(jetton);
        });

        it('a forged burn notification naming a real holder still fails', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('10'));
            const res = await jetton.send(mallory.getSender(), { value: toNano('0.2') }, {
                $$type: 'JettonBurnNotification', queryId: 0n, amount: 1n, sender: alice.address,
                responseDestination: mallory.address,
                customPayload: beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(0).endCell(),
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Invalid sender'] });
        });

        it('nobody can mint by sending an internal transfer to a wallet', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const w = await walletOf(jetton, alice.address);
            const held = await balanceOf(jetton, alice.address);
            const res = await w.send(mallory.getSender(), { value: toNano('0.2') }, {
                $$type: 'JettonTransferInternal', queryId: 0n, amount: 10n ** 15n, sender: mallory.address,
                responseDestination: mallory.address, forwardTonAmount: 0n, forwardPayload: beginCell().storeBit(false).asSlice(),
            });
            expect(res.transactions).toHaveTransaction({ to: w.address, success: false, exitCode: WE['Invalid sender'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });

        it("nobody can move or burn someone else's jettons", async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const w = await walletOf(jetton, alice.address);
            const held = await balanceOf(jetton, alice.address);
            const transfer = await w.send(mallory.getSender(), { value: toNano('0.2') }, {
                $$type: 'JettonTransfer', queryId: 0n, amount: held, destination: mallory.address, responseDestination: mallory.address,
                customPayload: null, forwardTonAmount: 0n, forwardPayload: beginCell().storeBit(false).asSlice(),
            });
            expect(transfer.transactions).toHaveTransaction({ to: w.address, success: false, exitCode: WE['Invalid sender'] });
            const burn = await mallory.send({ to: w.address, value: SELL_VALUE, body: buildSellBody(held, 0n, mallory.address) });
            expect(burn.transactions).toHaveTransaction({ to: w.address, success: false, exitCode: WE['Invalid sender'] });
            expect(await balanceOf(jetton, alice.address)).toBe(held);
        });

        it('nobody can force graduation or migration early', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('100'));
            const res = await jetton.send(mallory.getSender(), { value: MIGRATE_GAS }, { $$type: 'Migrate', queryId: 0n });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Not graduated'] });
            expect((await curve(jetton)).graduated).toBe(false);
        });

        it('the treasury and liquidity manager are fixed at launch', async () => {
            const { jetton } = await launch();
            // No message type exists that changes them; a second setup is refunded.
            await launch(1n);
            const s = await curve(jetton);
            expect(s.treasury).toEqualAddress(treasury.address);
            expect(s.liquidityManager).toEqualAddress(liquidityManager.address);
        });
    });

    // ── Fee maths ──────────────────────────────────────────────────────────
    describe('fees', () => {
        const cases = ['0.01', '0.012345678', '0.333333333', '1', '7.77', '99.999999999', '1000'];
        it.each(cases)('buy of %s TON pays ceil(2%%) split 60/40 exactly', async (amount) => {
            const { jetton } = await launch();
            const tonAmount = toNano(amount);
            const f = feeSplit(tonAmount);
            expect(f.creatorFee + f.platformFee).toBe(f.fee);
            expect(f.fee * 10000n).toBeGreaterThanOrEqual(tonAmount * 200n);
            expect(f.fee * 10000n - tonAmount * 200n).toBeLessThan(10000n);

            const res = await buy(jetton, alice, tonAmount);
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: creator.address, value: f.creatorFee });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: treasury.address, value: f.platformFee });
            const s = await curve(jetton);
            expect(s.totalCreatorFees).toBe(f.creatorFee);
            expect(s.totalPlatformFees).toBe(f.platformFee);
            expect(s.realTonRaised).toBe(tonAmount - f.fee);
        });

        it('fees are never zero on the smallest allowed trade', async () => {
            const f = feeSplit(MIN_TRADE);
            expect(f.creatorFee).toBeGreaterThan(0n);
            expect(f.platformFee).toBeGreaterThan(0n);
        });

        it('repeated random trades never leak value and totals add up', async () => {
            const { jetton } = await launch();
            let rng = 12345;
            const rand = () => ((rng = (rng * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
            let creatorSum = 0n;
            let platformSum = 0n;
            for (let i = 0; i < 40; i++) {
                const trader = i % 2 === 0 ? alice : bob;
                const held = await balanceOf(jetton, trader.address);
                if (held > 0n && rand() < 0.45) {
                    const amount = (held * BigInt(Math.floor(rand() * 1000) + 1)) / 1000n;
                    const q = expectedSell(await curve(jetton), amount);
                    await sell(jetton, trader, amount);
                    creatorSum += q.creatorFee;
                    platformSum += q.platformFee;
                } else {
                    const tonAmount = MIN_TRADE + BigInt(Math.floor(rand() * 20e9));
                    const f = feeSplit(tonAmount);
                    await buy(jetton, trader, tonAmount);
                    creatorSum += f.creatorFee;
                    platformSum += f.platformFee;
                }
                await expectSolvent(jetton);
            }
            const s = await curve(jetton);
            expect(s.totalCreatorFees).toBe(creatorSum);
            expect(s.totalPlatformFees).toBe(platformSum);

            // Everyone exits: the reserve covers every holder.
            for (const trader of [alice, bob]) {
                const held = await balanceOf(jetton, trader.address);
                if (held > 0n) await sell(jetton, trader, held);
                expect(await balanceOf(jetton, trader.address)).toBe(0n);
            }
            const end = await curve(jetton);
            expect(end.totalSupply).toBe(0n);
            // Rounding leaves dust in the pool, never a deficit.
            expect(end.realTonRaised).toBeGreaterThanOrEqual(0n);
            expect(end.realTonRaised).toBeLessThan(1000n);
            await expectSolvent(jetton);
        });
    });

    // ── Transfers ──────────────────────────────────────────────────────────
    describe('jetton transfers', () => {
        it('holders can transfer and the recipient can sell', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('10'));
            const held = await balanceOf(jetton, alice.address);
            const w = await walletOf(jetton, alice.address);
            const res = await w.send(alice.getSender(), { value: toNano('0.2') }, {
                $$type: 'JettonTransfer', queryId: 3n, amount: held / 2n, destination: bob.address, responseDestination: alice.address,
                customPayload: null, forwardTonAmount: toNano('0.01'), forwardPayload: beginCell().storeBit(false).asSlice(),
            });
            expect(res.transactions).toHaveTransaction({ to: bob.address, op: 0x7362d09c });
            expect(await balanceOf(jetton, bob.address)).toBe(held / 2n);
            await sell(jetton, bob, held / 2n);
            expect(await balanceOf(jetton, bob.address)).toBe(0n);
            await expectSolvent(jetton);
        });

        it('wallet data and TEP-89 discovery agree with the minter', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('1'));
            const w = await walletOf(jetton, alice.address);
            const data = await w.getGetWalletData();
            expect(data.owner).toEqualAddress(alice.address);
            expect(data.minter).toEqualAddress(jetton.address);
            expect((await jetton.getGetJettonData()).walletCode.equals(data.code)).toBe(true);

            const res = await jetton.send(bob.getSender(), { value: toNano('0.05') }, {
                $$type: 'ProvideWalletAddress', queryId: 0n, ownerAddress: alice.address, includeAddress: true,
            });
            const reply = findTransaction(res.transactions, { from: jetton.address, to: bob.address, op: 0xd1735400 });
            expect(reply).toBeDefined();
            const body = reply!.inMessage!.body.beginParse();
            body.skip(32 + 64);
            expect(body.loadAddress()).toEqualAddress(w.address);
        });
    });

    // ── Graduation ─────────────────────────────────────────────────────────
    describe('graduation', () => {
        async function raiseTo(jetton: SandboxContract<LaunchpadJetton>, netTarget: bigint) {
            const s = await curve(jetton);
            const need = netTarget - s.realTonRaised;
            const res = await buy(jetton, alice, tonForNetAmount(need));
            return res;
        }

        it('does not graduate one nanoton below the target', async () => {
            const { jetton } = await launch();
            await raiseTo(jetton, GRADUATION_TARGET - 1n).catch(async () => {
                // If no gross amount nets exactly target-1, land just below instead.
                await buy(jetton, alice, tonForNetAmount(GRADUATION_TARGET - 50n) - 1n);
            });
            const s = await curve(jetton);
            expect(s.realTonRaised).toBeLessThan(GRADUATION_TARGET);
            expect(s.graduated).toBe(false);
            expect(s.progressBps).toBe(9999n);
            const res = await buy(jetton, bob, toNano('0.01'));
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: true });
        });

        it('graduates exactly at the target, once, and closes the curve', async () => {
            const { jetton } = await launch();
            await buy(jetton, bob, toNano('5'));
            const res = await raiseTo(jetton, GRADUATION_TARGET);
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: true });
            const s = await curve(jetton);
            expect(s.realTonRaised).toBe(GRADUATION_TARGET);
            expect(s.graduated).toBe(true);
            expect(s.progressBps).toBe(10000n);
            await expectSolvent(jetton);

            const late = await buy(jetton, alice, toNano('1'));
            expect(late.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Curve graduated'] });

            const held = await balanceOf(jetton, bob.address);
            const lateSell = await sell(jetton, bob, held);
            expect(lateSell.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Curve graduated'] });
            expect(await balanceOf(jetton, bob.address)).toBe(held);
        });

        it('graduates when a buy overshoots the target', async () => {
            const { jetton } = await launch();
            await buy(jetton, alice, toNano('2000'));
            const s = await curve(jetton);
            expect(s.graduated).toBe(true);
            expect(s.realTonRaised).toBeGreaterThan(GRADUATION_TARGET);
            expect(s.totalSupply).toBeLessThan(TOTAL_SUPPLY_NANO);
            await expectSolvent(jetton);
        });

        it('migrates liquidity exactly once to the fixed liquidity manager', async () => {
            const { jetton } = await launch();
            await raiseTo(jetton, GRADUATION_TARGET);
            const before = await curve(jetton);
            const lmBefore = await tonBalance(liquidityManager.address);

            // Permissionless trigger: a random account can start it, funds go to the manager.
            const res = await jetton.send(mallory.getSender(), { value: MIGRATE_GAS }, { $$type: 'Migrate', queryId: 0n });
            expect(res.transactions).toHaveTransaction({ from: jetton.address, to: liquidityManager.address, value: (v) => v! >= before.realTonRaised });
            expect(await tonBalance(liquidityManager.address) - lmBefore).toBeGreaterThanOrEqual(before.realTonRaised);
            expect(await balanceOf(jetton, liquidityManager.address)).toBe(before.virtualTokens);

            const after = await curve(jetton);
            expect(after.migrated).toBe(true);
            expect(after.realTonRaised).toBe(0n);
            expect(after.totalSupply).toBe(TOTAL_SUPPLY_NANO);
            expect((await jetton.getGetJettonData()).mintable).toBe(false);
            expect(await tonBalance(jetton.address)).toBeLessThanOrEqual(MINTER_MIN_STORAGE + toNano('0.01'));

            const again = await jetton.send(mallory.getSender(), { value: MIGRATE_GAS }, { $$type: 'Migrate', queryId: 0n });
            expect(again.transactions).toHaveTransaction({ to: jetton.address, success: false, exitCode: JE['Already migrated'] });
        });

        it('allows plain burns after graduation', async () => {
            const { jetton } = await launch();
            await buy(jetton, bob, toNano('1'));
            await raiseTo(jetton, GRADUATION_TARGET);
            const held = await balanceOf(jetton, bob.address);
            const supply = (await curve(jetton)).totalSupply;
            const w = await walletOf(jetton, bob.address);
            const res = await w.send(bob.getSender(), { value: SELL_VALUE }, {
                $$type: 'JettonBurn', queryId: 0n, amount: held, responseDestination: bob.address, customPayload: null,
            });
            expect(res.transactions).toHaveTransaction({ to: jetton.address, success: true });
            expect(await balanceOf(jetton, bob.address)).toBe(0n);
            expect((await curve(jetton)).totalSupply).toBe(supply - held);
        });
    });

    // ── Gas report (informational, keeps UI constants honest) ─────────────
    it('gas: buy and sell fit inside the attached budgets', async () => {
        const { jetton } = await launch();
        const aliceBefore = await tonBalance(alice.address);
        await buy(jetton, alice, toNano('1'));
        const buyCost = aliceBefore - (await tonBalance(alice.address)) - toNano('1');
        const held = await balanceOf(jetton, alice.address);
        const beforeSell = await tonBalance(alice.address);
        const q = await jetton.getQuoteSell(held);
        await sell(jetton, alice, held);
        const sellCost = beforeSell + q.tonOut - (await tonBalance(alice.address));
        expect(buyCost).toBeLessThan(BUY_GAS);
        expect(sellCost).toBeLessThan(SELL_VALUE);
        console.log(`gas: buy ≈ ${Number(buyCost) / 1e9} TON, sell ≈ ${Number(sellCost) / 1e9} TON`);
    });
});

