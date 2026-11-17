import { Address } from '@ton/core';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { deployedFactory, sellBody } from '../scripts/trade-check';
import { buildSellBody } from './helpers';

describe('testnet trade check', () => {
    it('builds the same sell body as the app and the sandbox tests', () => {
        const to = new Address(0, Buffer.alloc(32, 7));
        expect(sellBody(123n, 4n, to).equals(buildSellBody(123n, 4n, to))).toBe(true);
    });

    it('reads the factory that deploy.ts records', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trade-check-'));
        const factory = 'kQBHQEBnG5xWWNNCZr6C81vZv1jJij3KyJkiTJjtMXXwhRnx';
        const file = path.join(dir, 'deployed.testnet.json');
        fs.writeFileSync(file, JSON.stringify({ network: 'testnet', factoryAddress: factory }));
        expect(deployedFactory(file)?.equals(Address.parse(factory))).toBe(true);
        expect(deployedFactory(path.join(dir, 'missing.json'))).toBeUndefined();
    });
});
