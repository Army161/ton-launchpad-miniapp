import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { client } from '../scripts/lib/wallet';

const addr = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
const rateLimited = () => Object.assign(new Error('Request failed with status code 429'), { response: { status: 429 } });

describe('script toncenter client', () => {
    it('retries a 429 on direct reads', async () => {
        const base = new TonClient({ endpoint: 'http://127.0.0.1:1/jsonRPC' });
        let calls = 0;
        jest.spyOn(base, 'getContractState').mockImplementation(async () => {
            calls++;
            if (calls === 1) throw rateLimited();
            return { state: 'active' } as Awaited<ReturnType<TonClient['getContractState']>>;
        });
        const c = client('testnet', base, 0);
        await expect(c.isContractDeployed(addr)).resolves.toBe(true);
        expect(calls).toBe(2);
    }, 10_000);

    it('routes contracts opened on it through the queue', async () => {
        const base = new TonClient({ endpoint: 'http://127.0.0.1:1/jsonRPC' });
        let calls = 0;
        jest.spyOn(base, 'getContractState').mockImplementation(async () => {
            calls++;
            if (calls === 1) throw rateLimited();
            return { state: 'active', balance: 5n, code: null, data: null, lastTransaction: null, blockId: { workchain: 0, shard: '0', seqno: 0 }, timestampt: 0 } as unknown as Awaited<ReturnType<TonClient['getContractState']>>;
        });
        const c = client('testnet', base, 0);
        const opened = c.open({ address: addr, async getBalance(p: { getState(): Promise<{ balance: bigint }> }) { return (await p.getState()).balance; } });
        await expect(opened.getBalance()).resolves.toBe(5n);
        expect(calls).toBe(2);
    }, 10_000);

    it('does not retry contract errors', async () => {
        const base = new TonClient({ endpoint: 'http://127.0.0.1:1/jsonRPC' });
        const spy = jest.spyOn(base, 'runMethod').mockRejectedValue(new Error('Unable to execute get method. Got exit_code: 11'));
        const c = client('testnet', base, 0);
        await expect(c.runMethod(addr, 'get_x')).rejects.toThrow('exit_code: 11');
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
