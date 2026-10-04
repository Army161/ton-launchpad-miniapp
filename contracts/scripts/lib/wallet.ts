/**
 * Shared helpers for the operator scripts. Secrets are read from the
 * environment and never printed.
 */
import { mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import {
    Address,
    internal,
    SendMode,
    TonClient,
    WalletContractV4,
    WalletContractV5R1,
    type Cell,
    type StateInit,
} from '@ton/ton';

export type Network = 'mainnet' | 'testnet';

export function parseNetwork(value: string | undefined): Network {
    if (value === 'mainnet' || value === 'testnet') return value;
    throw new Error(`Network must be "mainnet" or "testnet" (got "${value ?? ''}")`);
}

export function client(network: Network): TonClient {
    return new TonClient({
        endpoint:
            network === 'mainnet'
                ? 'https://toncenter.com/api/v2/jsonRPC'
                : 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TONCENTER_API_KEY || undefined,
    });
}

export function friendly(a: Address, network: Network): string {
    return a.toString({ bounceable: true, testOnly: network === 'testnet' });
}

export function requireAddress(name: string): Address {
    const raw = process.env[name];
    if (!raw) throw new Error(`${name} is not set`);
    try {
        return Address.parse(raw);
    } catch {
        throw new Error(`${name} is not a valid TON address`);
    }
}

/**
 * Opens the operator wallet from a mnemonic env var. Tonkeeper and Telegram
 * Wallet create W5 (v5r1) wallets by default; set <PREFIX>_WALLET_VERSION=v4
 * for older ones. The printed address must match the wallet you funded.
 */
export async function openWallet(network: Network, mnemonicEnv = 'DEPLOY_MNEMONIC') {
    const words = (process.env[mnemonicEnv] ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) throw new Error(`${mnemonicEnv} is not set`);
    if (words.length !== 24) throw new Error(`${mnemonicEnv} must have 24 words (has ${words.length})`);
    if (!(await mnemonicValidate(words))) throw new Error(`${mnemonicEnv} is not a valid TON mnemonic`);

    const keyPair = await mnemonicToPrivateKey(words);
    words.fill('');
    const version = process.env[`${mnemonicEnv.replace(/_MNEMONIC$/, '')}_WALLET_VERSION`] ?? 'v5r1';
    const wallet =
        version === 'v4'
            ? WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey })
            : WalletContractV5R1.create({
                  publicKey: keyPair.publicKey,
                  walletId: {
                      networkGlobalId: network === 'mainnet' ? -239 : -3,
                      context: { workchain: 0, walletVersion: 'v5r1', subwalletNumber: 0 },
                  },
              });

    const c = client(network);
    const opened = c.open(wallet);

    async function send(messages: { to: Address; value: bigint; body?: Cell; init?: StateInit }[]) {
        const seqno = await opened.getSeqno();
        await opened.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
            messages: messages.map((m) => internal({ to: m.to, value: m.value, body: m.body, init: m.init, bounce: true })),
        });
        return seqno;
    }

    async function waitSeqnoPast(seqno: number, timeoutMs = 90_000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            await sleep(3000);
            if ((await opened.getSeqno()) > seqno) return true;
        }
        return false;
    }

    return { address: wallet.address, version, client: c, balance: () => c.getBalance(wallet.address), send, waitSeqnoPast };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(check: () => Promise<boolean>, timeoutMs = 120_000, stepMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            if (await check()) return true;
        } catch {
            // Toncenter is eventually consistent; keep polling.
        }
        await sleep(stepMs);
    }
    return false;
}
