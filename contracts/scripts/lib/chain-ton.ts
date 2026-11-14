/**
 * `Chain` and `Signer` over toncenter, for testnet and mainnet.
 *
 * Toncenter is rate limited (about one request per second without
 * TONCENTER_API_KEY) and eventually consistent, so every read goes through one
 * queue that spaces requests out and retries transport errors. Contract errors
 * (a get-method that exits with a code) are never retried.
 *
 * Secrets are read from the environment and never printed.
 */
import { mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import { Address, beginCell, external, internal, SendMode, storeMessage, WalletContractV4, WalletContractV5R1, type TonClient } from '@ton/ton';
import type { Cell, Contract, OpenedContract, TupleItem } from '@ton/core';
import type { AccountStatus, Chain, OutMessage, Signer } from './chain';
import { rawClient as makeClient, sleep, type Network } from './wallet';
import { requestQueue } from './throttle';

export { isTransportError, requestQueue } from './throttle';

export type TonChain = Chain & { readonly network: Network; readonly client: TonClient; readonly run: ReturnType<typeof requestQueue> };

export function tonChain(network: Network, client: TonClient = makeClient(network)): TonChain {
    const run = requestQueue(process.env.TONCENTER_API_KEY ? 150 : 1100);

    return {
        network,
        client,
        run,
        balance: (address) => run(() => client.getBalance(address)),
        async status(address): Promise<AccountStatus> {
            const s = await run(() => client.getContractState(address));
            if (s.state === 'active') return 'active';
            if (s.state === 'frozen') return 'frozen';
            return s.balance > 0n ? 'uninit' : 'nonexist';
        },
        async get(address: Address, method: string, args: TupleItem[] = []) {
            return (await run(() => client.runMethod(address, method, args))).stack;
        },
        open<T extends Contract>(contract: T): OpenedContract<T> {
            const opened = client.open(contract);
            // Getters issue their own HTTP calls: route them through the same queue.
            return new Proxy(opened as object, {
                get(target, prop, receiver) {
                    const value = Reflect.get(target, prop, receiver) as unknown;
                    if (typeof value !== 'function' || typeof prop !== 'string') return value;
                    const fn = value as (...a: unknown[]) => unknown;
                    if (prop.startsWith('get')) return (...a: unknown[]) => run(async () => fn.apply(target, a));
                    if (prop.startsWith('send')) return (...a: unknown[]) => run(async () => fn.apply(target, a), false);
                    return fn.bind(target);
                },
            }) as OpenedContract<T>;
        },
        async until(label, check, timeoutMs = 180_000) {
            const start = Date.now();
            let lastError: unknown;
            for (;;) {
                try {
                    if (await check()) return;
                    lastError = undefined;
                } catch (e) {
                    lastError = e; // not visible yet, or a getter on a contract that is still deploying
                }
                if (Date.now() - start >= timeoutMs) break;
                await sleep(4000);
            }
            const why = lastError instanceof Error ? ` (last error: ${lastError.message})` : '';
            throw new Error(`${label}: not observed on ${network} within ${Math.round(timeoutMs / 1000)} s${why}`);
        },
    };
}

export type MnemonicSigner = Signer & {
    readonly version: 'v4' | 'v5r1';
    /** Sends the whole remaining balance to `to` (for emptying a one-time deploy wallet). */
    sweep(to: Address): Promise<void>;
};

/**
 * Opens a wallet from a 24-word mnemonic in `mnemonicEnv`. Tonkeeper and Telegram
 * Wallet create W5 (v5r1) wallets; set <PREFIX>_WALLET_VERSION=v4 for older ones.
 * `subwallet` derives further wallets from the same words (0 is the wallet the
 * apps show), which lets a scenario use separate creator and trader wallets.
 */
export async function mnemonicSigner(chain: TonChain, mnemonicEnv = 'DEPLOY_MNEMONIC', subwallet = 0): Promise<MnemonicSigner> {
    const words = (process.env[mnemonicEnv] ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) throw new Error(`${mnemonicEnv} is not set`);
    if (words.length !== 24) throw new Error(`${mnemonicEnv} must have 24 words (has ${words.length})`);
    if (!(await mnemonicValidate(words))) throw new Error(`${mnemonicEnv} is not a valid TON mnemonic`);
    const keyPair = await mnemonicToPrivateKey(words);
    words.fill('');

    const versionEnv = `${mnemonicEnv.replace(/_MNEMONIC$/, '')}_WALLET_VERSION`;
    const configured = (process.env[versionEnv] ?? '').trim();
    // Another version derives another address from the same words: never guess.
    if (configured && configured !== 'v4' && configured !== 'v5r1') throw new Error(`${versionEnv} must be v4 or v5r1`);
    const version: 'v4' | 'v5r1' = configured === 'v4' ? 'v4' : 'v5r1';
    const wallet =
        version === 'v4'
            ? WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey, walletId: 698983191 + subwallet })
            : WalletContractV5R1.create({
                  publicKey: keyPair.publicKey,
                  walletId: {
                      networkGlobalId: chain.network === 'mainnet' ? -239 : -3,
                      context: { workchain: 0, walletVersion: 'v5r1', subwalletNumber: subwallet },
                  },
              });
    const opened = chain.client.open(wallet);

    async function transfer(messages: OutMessage[], sendMode: SendMode) {
        const seqno = await chain.run(() => opened.getSeqno());
        const args = {
            seqno,
            secretKey: keyPair.secretKey,
            sendMode,
            // The SDK default (60 s) can lapse during queued, retried submission.
            timeout: Math.floor(Date.now() / 1000) + 300,
            messages: messages.map((m) => internal({ to: m.to, value: m.value, body: m.body, init: m.init, bounce: m.bounce ?? true })),
        };
        const body: Cell = wallet instanceof WalletContractV4 ? wallet.createTransfer(args) : wallet.createTransfer(args);
        let sendError: unknown;
        try {
            // Opening the wallet's own sendTransfer would make two requests back to back
            // (deployment check, then the BOC), which a rate limit can refuse every time.
            // Each goes through the queue on its own, so they are spaced like any other read.
            // Retrying is safe: every attempt carries the same signed seqno, so the wallet
            // accepts at most one of them.
            const deployed = await chain.run(() => chain.client.isContractDeployed(wallet.address));
            const ext = external({ to: wallet.address, init: deployed ? undefined : wallet.init, body });
            const boc = beginCell().store(storeMessage(ext)).endCell().toBoc();
            await chain.run(() => chain.client.sendFile(boc), true);
        } catch (e) {
            sendError = e; // the node may still have accepted it: the seqno decides
        }
        const start = Date.now();
        while (Date.now() - start < 120_000) {
            await sleep(3000);
            if ((await chain.run(() => opened.getSeqno())) > seqno) return;
        }
        const why = sendError instanceof Error ? `: ${sendError.message}` : '';
        throw new Error(`Wallet ${wallet.address.toString()} did not process the transfer (seqno stayed ${seqno})${why}`);
    }

    return {
        address: wallet.address,
        version,
        send: (messages) => transfer(messages, SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS),
        sweep: (to) => transfer([{ to, value: 0n, bounce: false }], SendMode.CARRY_ALL_REMAINING_BALANCE | SendMode.IGNORE_ERRORS),
    };
}
