/**
 * The testnet rehearsal build (scripts/build-rehearsal.mjs) graduates at 1.5 TON
 * and still migrates to STON.fi in one Migrate. Skipped when the build is absent.
 */
import { Blockchain } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import '@ton/test-utils';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, '..', 'build-rehearsal', 'out');
const built = fs.existsSync(path.join(OUT, 'Launchpad_LaunchpadFactory.ts'));

(built ? describe : describe.skip)('rehearsal build', () => {
    it('graduates at 1.5 TON and seeds STON.fi with one Migrate', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LaunchpadFactory } = require(path.join(OUT, 'Launchpad_LaunchpadFactory'));
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LaunchpadJetton } = require(path.join(OUT, 'Launchpad_LaunchpadJetton'));
        const chain = await Blockchain.create();
        const [owner, treasury, router, pton] = await Promise.all(['o', 't', 'r', 'p'].map((n) => chain.treasury(n)));
        const factory = chain.openContract(await LaunchpadFactory.fromInit(owner.address, treasury.address, owner.address, {
            $$type: 'DexConfig', router: router.address, ptonWallet: pton.address,
        }));
        await factory.send(owner.getSender(), { value: toNano('0.1') }, null);
        expect((await factory.getGetFactoryInfo()).graduationTarget).toBe(toNano('1.5'));
        await factory.send(owner.getSender(), { value: toNano('0.25') },
            { $$type: 'CreateToken', queryId: 0n, salt: 1n, content: beginCell().storeUint(0, 8).endCell(), initialBuyTon: 0n });
        const jetton = chain.openContract(await LaunchpadJetton.fromInit(factory.address, owner.address, 1n));
        const gross = (toNano('1.5') * 10000n) / 9800n + toNano('0.01');
        await jetton.send(owner.getSender(), { value: gross + toNano('0.1') }, { $$type: 'Buy', queryId: 0n, tonAmount: gross, minTokensOut: 0n, referrer: null });
        expect((await jetton.getGetCurveState()).graduated).toBe(true);
        const res = await jetton.send(owner.getSender(), { value: toNano('0.1') }, { $$type: 'Migrate', queryId: 0n });
        expect(res.transactions).toHaveTransaction({ from: jetton.address, to: pton.address, success: true });
        expect((await jetton.getGetCurveState()).migrated).toBe(true);
    });
});
