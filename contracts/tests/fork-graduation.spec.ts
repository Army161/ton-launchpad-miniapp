import { Address, beginCell, Cell, toNano } from '@ton/core';
import { libraryRefs, refusalVerdict, REFUND_GAS_ALLOWANCE, toncenterRemote } from '../scripts/fork-graduation';

function libCell(hash: Buffer): Cell {
    const bits = beginCell().storeUint(2, 8).storeBuffer(hash).endCell().bits;
    return new Cell({ exotic: true, bits, refs: [] });
}

describe('fork rehearsal library scan', () => {
    it('finds library cells nested anywhere, once each', () => {
        const a = Buffer.alloc(32, 1);
        const b = Buffer.alloc(32, 2);
        const root = beginCell().storeRef(libCell(a)).storeRef(beginCell().storeRef(libCell(b)).storeRef(libCell(a)).endCell()).endCell();
        const found = libraryRefs([root, null]).map((h) => h.toString('hex')).sort();
        expect(found).toEqual([a.toString('hex'), b.toString('hex')]);
    });

    it('returns nothing for ordinary cells', () => {
        expect(libraryRefs([beginCell().storeUint(7, 8).endCell()])).toEqual([]);
    });
});

describe('fork rehearsal toncenter reader', () => {
    const addr = new Address(0, Buffer.alloc(32, 3));
    const reply = (status: number, body: unknown) => ({ ok: status === 200, status, json: async () => body });

    it('maps an active account and the last block', async () => {
        const code = beginCell().storeUint(1, 8).endCell();
        const data = beginCell().storeUint(2, 8).endCell();
        const urls: string[] = [];
        const remote = toncenterRemote('https://x/api/v2', 'k', async (url) => {
            urls.push(url);
            if (url.includes('getMasterchainInfo')) return reply(200, { ok: true, result: { last: { seqno: 42 } } });
            return reply(200, {
                ok: true,
                result: { balance: '5', code: code.toBoc().toString('base64'), data: data.toBoc().toString('base64'), state: 'active', last_transaction_id: { lt: '9', hash: 'aA==' } },
            });
        });
        expect(await remote.getLastBlockSeqno()).toBe(42);
        const acc = await remote.getAccount(42, addr);
        expect(acc.balance).toBe(5n);
        expect(acc.lastTransaction).toEqual({ lt: 9n, hash: Buffer.from('aA==', 'base64') });
        expect(acc.state.type).toBe('active');
        if (acc.state.type === 'active') {
            expect(acc.state.state.code!.equals(code)).toBe(true);
            expect(acc.state.state.data!.equals(data)).toBe(true);
        }
        expect(urls[1]).toContain('api_key=k');
    });

    it('maps a never-used address to uninit with no last transaction', async () => {
        const remote = toncenterRemote('https://x/api/v2', undefined, async () =>
            reply(200, { ok: true, result: { balance: '0', code: '', data: '', state: 'uninitialized', last_transaction_id: { lt: '0', hash: '' } } }),
        );
        expect(await remote.getAccount(1, addr)).toEqual({ state: { type: 'uninit' }, balance: 0n, lastTransaction: undefined });
    });

    it('throws on a toncenter error', async () => {
        const remote = toncenterRemote('https://x/api/v2', undefined, async () => reply(500, { ok: false, error: 'boom' }));
        await expect(remote.getLastBlockSeqno()).rejects.toThrow('boom');
    });
});

describe('fork rehearsal refusal verdict', () => {
    const base = {
        tonLiquidity: toNano('0.85'),
        tokenLiquidity: 1_000_000n,
        poolActive: false,
        managerJettons: 1_000_000n,
        managerTonGain: toNano('0.8'),
        managerPtonHeld: 0n,
    };

    it('passes when there is no pool and the liquidity manager holds the tokens and the TON', () => {
        const v = refusalVerdict(base);
        expect(v.ok).toBe(true);
        expect(v.lines.every((l) => l.endsWith('PASS'))).toBe(true);
    });

    it('fails when a pool was created anyway', () => {
        expect(refusalVerdict({ ...base, poolActive: true }).ok).toBe(false);
    });

    it('fails when any curve token is missing from the liquidity manager', () => {
        expect(refusalVerdict({ ...base, managerJettons: 999_999n }).ok).toBe(false);
        expect(refusalVerdict({ ...base, managerJettons: 0n }).ok).toBe(false);
    });

    it('allows STON.fi gas up to the allowance and no more', () => {
        expect(refusalVerdict({ ...base, managerTonGain: base.tonLiquidity - REFUND_GAS_ALLOWANCE }).ok).toBe(true);
        expect(refusalVerdict({ ...base, managerTonGain: base.tonLiquidity - REFUND_GAS_ALLOWANCE - 1n }).ok).toBe(false);
    });

    it('counts TON that came back as pTON and says so', () => {
        const v = refusalVerdict({ ...base, managerTonGain: 0n, managerPtonHeld: toNano('0.8') });
        expect(v.ok).toBe(true);
        expect(v.lines.some((l) => l.startsWith('NOTE') && l.includes('pTON'))).toBe(true);
    });
});
