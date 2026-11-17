import { Address } from '@ton/core';
import { sellBody } from '../scripts/trade-check';
import { buildSellBody } from './helpers';

describe('testnet trade check', () => {
    it('builds the same sell body as the app and the sandbox tests', () => {
        const to = new Address(0, Buffer.alloc(32, 7));
        expect(sellBody(123n, 4n, to).equals(buildSellBody(123n, 4n, to))).toBe(true);
    });
});
