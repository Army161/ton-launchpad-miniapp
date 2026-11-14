import { beginCell, Cell } from '@ton/core';
import { libraryRefs } from '../scripts/fork-graduation';

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
