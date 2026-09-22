import { Address, beginCell, Cell, Dictionary, toNano } from '@ton/core';
import { sha256_sync } from '@ton/crypto';

// Mirrors of contracts/contracts/messages.tact. If these drift, the curve
// maths tests fail, which is the point.
export const TOTAL_SUPPLY_NANO = 10n ** 18n;
export const VIRTUAL_TON = toNano('30');
export const VIRTUAL_TOKENS = TOTAL_SUPPLY_NANO;
export const LAUNCH_FEE = toNano('0.05');
export const GRADUATION_TARGET = toNano('1500');
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;
export const BPS = 10000n;
export const MIN_TRADE = toNano('0.01');
export const MAX_INITIAL_BUY = toNano('100');
export const CREATE_GAS = toNano('0.15');
export const BUY_GAS = toNano('0.1');
export const MIGRATE_GAS = toNano('0.15');
export const MINTER_MIN_STORAGE = toNano('0.05');
export const BURN_MIN_VALUE = toNano('0.07');
export const SELL_PAYLOAD_OP = 0x53454c4c;

export const OP = {
    createToken: 0x4c500001,
    buy: 0x4c500003,
    migrate: 0x4c500004,
    jettonBurn: 0x595f07bc,
    jettonTransfer: 0x0f8a7ea5,
    transferInternal: 0x178d4519,
    burnNotification: 0x7bdd97de,
};

export const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export function feeSplit(amount: bigint) {
    const fee = ceilDiv(amount * TRADE_FEE_BPS, BPS);
    const creatorFee = (fee * CREATOR_FEE_BPS) / BPS;
    return { fee, creatorFee, platformFee: fee - creatorFee };
}

export type Curve = { virtualTon: bigint; virtualTokens: bigint };

export function expectedBuy(c: Curve, tonAmount: bigint) {
    const f = feeSplit(tonAmount);
    const tonAfterFee = tonAmount - f.fee;
    const newVirtualTon = c.virtualTon + tonAfterFee;
    const newVirtualTokens = ceilDiv(c.virtualTon * c.virtualTokens, newVirtualTon);
    return { ...f, tonAfterFee, tokensOut: c.virtualTokens - newVirtualTokens };
}

export function expectedSell(c: Curve, tokenAmount: bigint) {
    const newVirtualTokens = c.virtualTokens + tokenAmount;
    const newVirtualTon = ceilDiv(c.virtualTon * c.virtualTokens, newVirtualTokens);
    const gross = c.virtualTon - newVirtualTon;
    const f = feeSplit(gross);
    return { ...f, gross, tonOut: gross - f.fee };
}

/** TEP-64 on-chain metadata, as the Create page builds it. */
export function buildOnchainContent(meta: Record<string, string>): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    for (const [key, value] of Object.entries(meta)) {
        const k = BigInt('0x' + sha256_sync(key).toString('hex'));
        dict.set(k, beginCell().storeUint(0, 8).storeStringTail(value).endCell());
    }
    return beginCell().storeUint(0, 8).storeDict(dict).endCell();
}

/** Burn body exactly as a TON Connect wallet would send it for a curve sell. */
export function buildSellBody(amount: bigint, minTonOut: bigint, responseDestination: Address, queryId = 0n): Cell {
    return beginCell()
        .storeUint(OP.jettonBurn, 32)
        .storeUint(queryId, 64)
        .storeCoins(amount)
        .storeAddress(responseDestination)
        .storeBit(true)
        .storeRef(beginCell().storeUint(SELL_PAYLOAD_OP, 32).storeCoins(minTonOut).endCell())
        .endCell();
}

/** Smallest TON amount whose post-fee value is exactly `target`. */
export function tonForNetAmount(target: bigint): bigint {
    // x - ceil(x * 200 / 10000) == target; search around the analytic answer.
    let x = (target * BPS) / (BPS - TRADE_FEE_BPS) - 5n;
    for (let i = 0; i < 20; i++, x++) {
        if (x - feeSplit(x).fee === target) return x;
    }
    throw new Error(`no exact TON amount nets ${target}`);
}
