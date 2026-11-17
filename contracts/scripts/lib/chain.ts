/**
 * The small surface the operator scenarios need from a chain. Two adapters
 * implement it: `chain-ton.ts` (toncenter, for testnet and mainnet) and the
 * sandbox adapter in `tests/` (so the exact code that runs the testnet gate
 * and the graduation rehearsal is also exercised in CI against the compiled
 * contracts).
 *
 * Scenario code must only talk to the chain through these two interfaces.
 */
import type { Address, Cell, Contract, OpenedContract, StateInit, TupleItem, TupleReader } from '@ton/core';

export type ChainNetwork = 'mainnet' | 'testnet' | 'sandbox';
export type AccountStatus = 'active' | 'uninit' | 'frozen' | 'nonexist';

export type OutMessage = {
    to: Address;
    value: bigint;
    body?: Cell;
    init?: StateInit;
    /** Default true. */
    bounce?: boolean;
};

export interface Chain {
    readonly network: ChainNetwork;
    /** TON balance in nanotons; 0n for an account that does not exist. */
    balance(address: Address): Promise<bigint>;
    status(address: Address): Promise<AccountStatus>;
    /** Runs a get-method. Rejects when the account is not active or the method exits with an error. */
    get(address: Address, method: string, args?: TupleItem[]): Promise<TupleReader>;
    /** Opens a typed wrapper (Tact-generated or @ston-fi/sdk) for its getters. */
    open<T extends Contract>(contract: T): OpenedContract<T>;
    /**
     * Resolves once `check` returns true. A real network polls until `timeoutMs`
     * (messages take several seconds per hop); the sandbox calls it once. Rejects
     * with `label` in the message when the condition never holds.
     */
    until(label: string, check: () => Promise<boolean>, timeoutMs?: number): Promise<void>;
}

export interface Signer {
    readonly address: Address;
    /**
     * Sends these internal messages from the signer's wallet in one transaction and
     * resolves when the wallet has processed it. Effects further down the message
     * chain may still be in flight on a real network: follow with `chain.until`.
     */
    send(messages: OutMessage[]): Promise<void>;
}

/** One line of scenario evidence: what was checked and what was observed. */
export type Check = { name: string; ok: boolean; detail: string };

export class ScenarioFailure extends Error {
    readonly checks: Check[];
    constructor(message: string, checks: Check[]) {
        super(message);
        this.name = 'ScenarioFailure';
        this.checks = checks;
    }
}
