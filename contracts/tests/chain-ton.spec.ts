import { mnemonicNew } from '@ton/crypto';
import { Address, Cell, loadMessage, type TonClient } from '@ton/ton';
import { mnemonicSigner, requestQueue, type TonChain } from '../scripts/lib/chain-ton';

describe('mnemonicSigner transfer', () => {
    it('sends the deployment check and the BOC as separate queued requests, and retries a refused BOC', async () => {
        const words = await mnemonicNew(24);
        process.env.TEST_SIGNER_MNEMONIC = words.join(' ');
        const calls: string[] = [];
        let seqno = 0;
        let sendAttempts = 0;
        const sent: Buffer[] = [];
        const client = {
            open: () => ({ getSeqno: async () => (calls.push('seqno'), seqno) }),
            isContractDeployed: async () => (calls.push('deployed'), false),
            sendFile: async (boc: Buffer) => {
                calls.push('send');
                sendAttempts++;
                if (sendAttempts === 1) throw Object.assign(new Error('Too many requests'), { response: { status: 429 } });
                sent.push(boc);
                seqno = 1;
            },
        } as unknown as TonClient;
        const run = requestQueue(0, 6, async () => undefined);
        const chain = { network: 'testnet', client, run, balance: async () => 0n } as unknown as TonChain;
        try {
            const signer = await mnemonicSigner(chain, 'TEST_SIGNER_MNEMONIC');
            await signer.send([{ to: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'), value: 1n }]);
            expect(calls.slice(0, 4)).toEqual(['seqno', 'deployed', 'send', 'send']);
            expect(sent).toHaveLength(1);
            const msg = loadMessage(Cell.fromBoc(sent[0])[0].beginParse());
            expect(msg.info.type).toBe('external-in');
            expect(msg.init).toBeTruthy(); // undeployed wallet: StateInit attached
            expect(msg.info.dest?.toString()).toBe(signer.address.toString());
        } finally {
            delete process.env.TEST_SIGNER_MNEMONIC;
        }
    }, 30_000);
});
