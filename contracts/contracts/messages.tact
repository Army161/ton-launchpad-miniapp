// ─── Shared constants ────────────────────────────────────────────────────────
// Economics are locked for V1 (see docs/SPEC.md). Change only with a recorded
// decision in docs/DECISIONS.md.

const TOKEN_DECIMALS: Int = 9;
const TOTAL_SUPPLY_NANO: Int = 1_000_000_000_000_000_000; // 1B tokens × 10^9

const LAUNCH_FEE: Int = ton("0.05");
const GRADUATION_TARGET: Int = ton("1500");
const TRADE_FEE_BPS: Int = 200;       // 2% of every trade
const CREATOR_FEE_BPS: Int = 6000;    // 60% of the trade fee → creator
const BPS: Int = 10000;               // platform receives the remaining 40%

const VIRTUAL_TON: Int = ton("30");               // virtual TON reserve of the curve
const VIRTUAL_TOKENS: Int = TOTAL_SUPPLY_NANO;    // virtual token reserve of the curve

const MIN_TRADE: Int = ton("0.01");
const MAX_INITIAL_BUY: Int = ton("100");

// Gas budgets. Unused gas is always returned to the caller.
const CREATE_GAS: Int = ton("0.15");      // factory → jetton deploy + setup + first mint
const BUY_GAS: Int = ton("0.1");          // curve → fee sends + wallet deploy + mint
const SELL_GAS: Int = ton("0.05");        // curve → fee sends + payout
const MIGRATE_GAS: Int = ton("0.15");     // curve → LP mint + liquidity send
const MINTER_MIN_STORAGE: Int = ton("0.05");

const WALLET_MIN_STORAGE: Int = ton("0.01");
const WALLET_GAS: Int = ton("0.015");
const BURN_MIN_VALUE: Int = ton("0.07");  // wallet refuses a burn that cannot pay for the sell

// Tag at the start of the burn custom payload that marks a curve sell.
const SELL_PAYLOAD_OP: Int = 0x53454c4c; // "SELL"

// ─── TEP-74 jetton messages ──────────────────────────────────────────────────

message(0x0f8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x178d4519) JettonTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0x595f07bc) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address?;
    customPayload: Cell?;
}

// TEP-74 burn_notification with the burn's custom payload appended. Only our
// own minter reads it; it carries the sell slippage limit.
message(0x7bdd97de) JettonBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
    customPayload: Cell?;
}

message(0xd53276db) JettonExcesses {
    queryId: Int as uint64;
}

// TEP-89 wallet discovery
message(0x2c76b973) ProvideWalletAddress {
    queryId: Int as uint64;
    ownerAddress: Address;
    includeAddress: Bool;
}

message(0xd1735400) TakeWalletAddress {
    queryId: Int as uint64;
    walletAddress: Address?;
    ownerAddress: Cell?;
}

// ─── Launchpad messages ──────────────────────────────────────────────────────

// Creator → factory. `salt` makes the jetton address unique per creator and
// lets the client compute it before sending.
message(0x4c500001) CreateToken {
    queryId: Int as uint64;
    salt: Int as uint64;
    content: Cell;
    initialBuyTon: Int as coins;
}

// Factory → new jetton, once, right after deploy.
message(0x4c500002) JettonSetup {
    queryId: Int as uint64;
    treasury: Address;
    liquidityManager: Address;
    content: Cell;
    launchFee: Int as coins;
    initialBuyTon: Int as coins;
}

// Trader → jetton. Message value must be tonAmount + BUY_GAS or more.
message(0x4c500003) Buy {
    queryId: Int as uint64;
    tonAmount: Int as coins;
    minTokensOut: Int as coins;
}

// Anyone → graduated jetton. Moves liquidity to the liquidity manager.
message(0x4c500004) Migrate {
    queryId: Int as uint64;
}

// Owner → factory. Recovers TON stranded in the factory by bounced deploys.
message(0x4c500005) FactoryWithdraw {
    queryId: Int as uint64;
}

// ─── Events (external out messages for indexers) ─────────────────────────────

message(0x4c500101) TokenLaunched {
    queryId: Int as uint64;
    creator: Address;
    salt: Int as uint64;
    initialBuyTon: Int as coins;
}

message(0x4c500102) TradeEvent {
    queryId: Int as uint64;
    trader: Address;
    isBuy: Bool;
    tonAmount: Int as coins;      // gross TON in (buy) or gross TON out of the curve (sell)
    tokenAmount: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
    realTonRaised: Int as coins;
}

message(0x4c500103) GraduatedEvent {
    queryId: Int as uint64;
    realTonRaised: Int as coins;
}

message(0x4c500104) MigratedEvent {
    queryId: Int as uint64;
    liquidityManager: Address;
    tonLiquidity: Int as coins;
    tokenLiquidity: Int as coins;
}

// ─── Getter structs ──────────────────────────────────────────────────────────

struct JettonData {
    totalSupply: Int as coins;
    mintable: Bool;
    adminAddress: Address?;
    content: Cell;
    walletCode: Cell;
}

struct JettonWalletData {
    balance: Int as coins;
    owner: Address;
    minter: Address;
    code: Cell;
}

struct CurveState {
    factory: Address;
    creator: Address;
    treasury: Address;
    liquidityManager: Address;
    initialized: Bool;
    virtualTon: Int as coins;
    virtualTokens: Int as coins;
    realTonRaised: Int as coins;
    totalSupply: Int as coins;
    graduated: Bool;
    migrated: Bool;
    graduationTarget: Int as coins;
    totalCreatorFees: Int as coins;
    totalPlatformFees: Int as coins;
    tradeCount: Int as uint32;
    progressBps: Int;
}

struct QuoteBuy {
    tokensOut: Int as coins;
    fee: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
}

struct QuoteSell {
    tonOut: Int as coins;       // net TON the seller receives
    fee: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
}

struct FactoryInfo {
    owner: Address;
    treasury: Address;
    liquidityManager: Address;
    launchCount: Int as uint32;
    launchFee: Int as coins;
    graduationTarget: Int as coins;
    tradeFeeBps: Int;
    creatorFeeBps: Int;
}

// ─── Pure curve maths (shared by handlers and getters) ───────────────────────
// Rounding always favours the pool: fees round up, tokens/TON paid out round
// down, so repeated trades cannot drain the reserve through rounding.

inline fun tradeFee(amount: Int): Int {
    return muldivc(amount, TRADE_FEE_BPS, BPS);
}

inline fun creatorShare(fee: Int): Int {
    return fee * CREATOR_FEE_BPS / BPS;
}
