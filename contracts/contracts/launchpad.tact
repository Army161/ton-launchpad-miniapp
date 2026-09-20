// TON Meme Coin Launchpad — Factory + Bonding Curve + Jetton
// V1: 2% trade fee (60% creator / 40% platform), 1500 TON graduation target

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_SUPPLY: Int = 1_000_000_000;           // 1B tokens (no decimals in curve math)
const TOKEN_DECIMALS: Int = 9;
const TOTAL_SUPPLY_NANO: Int = TOTAL_SUPPLY * pow(10, TOKEN_DECIMALS);

const LAUNCH_FEE: Int = ton("0.05");
const GRADUATION_TARGET: Int = ton("1500");
const TRADE_FEE_BPS: Int = 200;                    // 2%
const CREATOR_FEE_BPS: Int = 6000;                 // 60% of fee → creator
const PLATFORM_FEE_BPS: Int = 4000;                // 40% of fee → platform

const VIRTUAL_TON: Int = ton("30");                // virtual reserve for curve
const VIRTUAL_TOKENS: Int = TOTAL_SUPPLY_NANO;     // virtual token reserve

const OP_CREATE_TOKEN: Int = 0x1;
const OP_BUY: Int = 0x2;
const OP_SELL: Int = 0x3;
const OP_GRADUATE: Int = 0x4;
const OP_TRANSFER: Int = 0xf8a7ea5;

// ─── Messages ────────────────────────────────────────────────────────────────

message(0x1) CreateToken {
    queryId: Int as uint64;
    name: String;
    symbol: String;
    imageUri: String;
    description: String;
    telegramLink: String;
    initialBuyTon: Int as coins;
}

message(0x2) Buy {
    queryId: Int as uint64;
    minTokensOut: Int as coins;
}

message(0x3) Sell {
    queryId: Int as uint64;
    jettonAmount: Int as coins;
    minTonOut: Int as coins;
}

message(0x4) Graduate {
    queryId: Int as uint64;
}

message(0x5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x6) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0x7) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address?;
    customPayload: Cell?;
}

// ─── Events ──────────────────────────────────────────────────────────────────

message(0x100) TokenLaunched {
    queryId: Int as uint64;
    jettonMaster: Address;
    curveAddress: Address;
    creator: Address;
    name: String;
    symbol: String;
}

message(0x101) TradeEvent {
    queryId: Int as uint64;
    isBuy: Bool;
    tonAmount: Int as coins;
    tokenAmount: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
}

message(0x102) GraduatedEvent {
    queryId: Int as uint64;
    tonLiquidity: Int as coins;
    tokenLiquidity: Int as coins;
}

// ─── Jetton Minter ───────────────────────────────────────────────────────────

struct JettonData {
    totalSupply: Int as coins;
    mintable: Bool;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

contract JettonMinter {
    totalSupply: Int as coins;
    mintable: Bool;
    owner: Address;
    content: Cell;
    curveAddress: Address;

    init(owner: Address, content: Cell, curveAddress: Address) {
        self.totalSupply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
        self.curveAddress = curveAddress;
    }

    receive(msg: JettonTransfer) {
        let ctx: Context = context();
        let sender: Address = ctx.sender;

        if (sender == self.curveAddress) {
            // Mint path: curve sends transfer to create wallet + mint
            self.totalSupply = self.totalSupply + msg.amount;
            // Forward to wallet deployment handled by curve
            return;
        }
        throw(401);
    }

    receive("mint") {
        let ctx: Context = context();
        require(ctx.sender == self.curveAddress, "Only curve can mint");
        self.totalSupply = self.totalSupply + ctx.value;
    }

    get fun get_jetton_data(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: self.mintable,
            owner: self.owner,
            content: self.content,
            walletCode: emptyCell(),
        };
    }
}

// ─── Bonding Curve Pool ──────────────────────────────────────────────────────

contract BondingCurve {
    creator: Address;
    platformTreasury: Address;
    jettonMaster: Address;
    name: String;
    symbol: String;

    virtualTon: Int as coins;
    virtualTokens: Int as coins;
    realTonRaised: Int as coins;
    tokensSold: Int as coins;
    graduated: Bool;
    totalCreatorFees: Int as coins;
    totalPlatformFees: Int as coins;

    init(
        creator: Address,
        platformTreasury: Address,
        jettonMaster: Address,
        name: String,
        symbol: String,
    ) {
        self.creator = creator;
        self.platformTreasury = platformTreasury;
        self.jettonMaster = jettonMaster;
        self.name = name;
        self.symbol = symbol;
        self.virtualTon = VIRTUAL_TON;
        self.virtualTokens = VIRTUAL_TOKENS;
        self.realTonRaised = 0;
        self.tokensSold = 0;
        self.graduated = false;
        self.totalCreatorFees = 0;
        self.totalPlatformFees = 0;
    }

    // ── Buy: send TON with Buy message ──
    receive(msg: Buy) {
        require(!self.graduated, "Already graduated");
        let ctx: Context = context();
        let tonIn: Int = ctx.value;
        require(tonIn > 0, "No TON sent");

        // Deduct 2% fee
        let fee: Int = tonIn * TRADE_FEE_BPS / 10000;
        let creatorFee: Int = fee * CREATOR_FEE_BPS / 10000;
        let platformFee: Int = fee - creatorFee;
        let tonAfterFee: Int = tonIn - fee;

        // Constant product: tokensOut = vTokens - k / (vTon + tonAfterFee)
        let k: Int = self.virtualTon * self.virtualTokens;
        let newVirtualTon: Int = self.virtualTon + tonAfterFee;
        let newVirtualTokens: Int = k / newVirtualTon;
        let tokensOut: Int = self.virtualTokens - newVirtualTokens;

        require(tokensOut >= msg.minTokensOut, "Slippage exceeded");
        require(self.tokensSold + tokensOut <= TOTAL_SUPPLY_NANO, "Exceeds supply");

        self.virtualTon = newVirtualTon;
        self.virtualTokens = newVirtualTokens;
        self.tokensSold = self.tokensSold + tokensOut;
        self.realTonRaised = self.realTonRaised + tonAfterFee;
        self.totalCreatorFees = self.totalCreatorFees + creatorFee;
        self.totalPlatformFees = self.totalPlatformFees + platformFee;

        // Send fees
        if (creatorFee > 0) {
            send(SendParameters{
                to: self.creator,
                value: creatorFee,
                mode: SendPayGasSeparately,
                body: "creator_fee".asComment(),
            });
        }
        if (platformFee > 0) {
            send(SendParameters{
                to: self.platformTreasury,
                value: platformFee,
                mode: SendPayGasSeparately,
                body: "platform_fee".asComment(),
            });
        }

        // Emit trade event via external message pattern (logged in getter state)
        // Mint tokens to buyer via jetton master (simplified: store balance mapping off-chain via events)

        // Refund excess
        let gasLeft: Int = myBalance();
        if (gasLeft > ton("0.01")) {
            send(SendParameters{
                to: ctx.sender,
                value: gasLeft - ton("0.005"),
                mode: SendPayGasSeparately,
                body: "buy_success".asComment(),
            });
        }

        // Auto-graduate check
        if (self.realTonRaised >= GRADUATION_TARGET) {
            self.graduated = true;
        }
    }

    // ── Sell: jetton wallet sends JettonTransferNotification ──
    receive(msg: JettonTransferNotification) {
        let ctx: Context = context();
        require(!self.graduated, "Already graduated");
        require(msg.sender == ctx.sender, "Invalid sender");

        let tokenIn: Int = msg.amount;

        // Constant product sell: tonOut = vTon - k / (vTokens + tokenIn)
        let k: Int = self.virtualTon * self.virtualTokens;
        let newVirtualTokens: Int = self.virtualTokens + tokenIn;
        let newVirtualTon: Int = k / newVirtualTokens;
        let tonOut: Int = self.virtualTon - newVirtualTon;

        // Deduct 2% fee from tonOut
        let fee: Int = tonOut * TRADE_FEE_BPS / 10000;
        let creatorFee: Int = fee * CREATOR_FEE_BPS / 10000;
        let platformFee: Int = fee - creatorFee;
        let tonAfterFee: Int = tonOut - fee;

        require(tonAfterFee >= msg.forwardPayload.loadCoins(), "Slippage exceeded"); // minTonOut in payload

        self.virtualTon = newVirtualTon;
        self.virtualTokens = newVirtualTokens;
        self.tokensSold = self.tokensSold - tokenIn;
        self.realTonRaised = self.realTonRaised - tonOut;
        self.totalCreatorFees = self.totalCreatorFees + creatorFee;
        self.totalPlatformFees = self.totalPlatformFees + platformFee;

        if (creatorFee > 0) {
            send(SendParameters{
                to: self.creator,
                value: creatorFee,
                mode: SendPayGasSeparately,
                body: "creator_fee".asComment(),
            });
        }
        if (platformFee > 0) {
            send(SendParameters{
                to: self.platformTreasury,
                value: platformFee,
                mode: SendPayGasSeparately,
                body: "platform_fee".asComment(),
            });
        }

        send(SendParameters{
            to: msg.sender,
            value: tonAfterFee,
            mode: SendPayGasSeparately,
            body: "sell_success".asComment(),
        });
    }

    receive(msg: Graduate) {
        require(!self.graduated, "Already graduated");
        require(self.realTonRaised >= GRADUATION_TARGET, "Target not reached");
        self.graduated = true;
        // V1: mark graduated; STON.fi pool creation via off-chain keeper script
    }

    // ── Getters ──
    get fun get_curve_state(): CurveState {
        return CurveState{
            creator: self.creator,
            jettonMaster: self.jettonMaster,
            name: self.name,
            symbol: self.symbol,
            virtualTon: self.virtualTon,
            virtualTokens: self.virtualTokens,
            realTonRaised: self.realTonRaised,
            tokensSold: self.tokensSold,
            graduated: self.graduated,
            graduationTarget: GRADUATION_TARGET,
            totalCreatorFees: self.totalCreatorFees,
            totalPlatformFees: self.totalPlatformFees,
            progressBps: self.realTonRaised * 10000 / GRADUATION_TARGET,
        };
    }

    get fun quote_buy(tonIn: Int): QuoteBuy {
        let fee: Int = tonIn * TRADE_FEE_BPS / 10000;
        let tonAfterFee: Int = tonIn - fee;
        let k: Int = self.virtualTon * self.virtualTokens;
        let newVirtualTon: Int = self.virtualTon + tonAfterFee;
        let newVirtualTokens: Int = k / newVirtualTon;
        let tokensOut: Int = self.virtualTokens - newVirtualTokens;
        let creatorFee: Int = fee * CREATOR_FEE_BPS / 10000;
        let platformFee: Int = fee - creatorFee;
        return QuoteBuy{
            tokensOut: tokensOut,
            fee: fee,
            creatorFee: creatorFee,
            platformFee: platformFee,
        };
    }

    get fun quote_sell(tokenIn: Int): QuoteSell {
        let k: Int = self.virtualTon * self.virtualTokens;
        let newVirtualTokens: Int = self.virtualTokens + tokenIn;
        let newVirtualTon: Int = k / newVirtualTokens;
        let tonOut: Int = self.virtualTon - newVirtualTon;
        let fee: Int = tonOut * TRADE_FEE_BPS / 10000;
        let creatorFee: Int = fee * CREATOR_FEE_BPS / 10000;
        let platformFee: Int = fee - creatorFee;
        return QuoteSell{
            tonOut: tonOut - fee,
            fee: fee,
            creatorFee: creatorFee,
            platformFee: platformFee,
        };
    }
}

struct CurveState {
    creator: Address;
    jettonMaster: Address;
    name: String;
    symbol: String;
    virtualTon: Int as coins;
    virtualTokens: Int as coins;
    realTonRaised: Int as coins;
    tokensSold: Int as coins;
    graduated: Bool;
    graduationTarget: Int as coins;
    totalCreatorFees: Int as coins;
    totalPlatformFees: Int as coins;
    progressBps: Int;
}

struct QuoteBuy {
    tokensOut: Int as coins;
    fee: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
}

struct QuoteSell {
    tonOut: Int as coins;
    fee: Int as coins;
    creatorFee: Int as coins;
    platformFee: Int as coins;
}

// ─── Launchpad Factory ───────────────────────────────────────────────────────

contract LaunchpadFactory {
    owner: Address;
    platformTreasury: Address;
    launchCount: Int as uint32;
    launchFee: Int as coins;

    init(owner: Address, platformTreasury: Address) {
        self.owner = owner;
        self.platformTreasury = platformTreasury;
        self.launchCount = 0;
        self.launchFee = LAUNCH_FEE;
    }

    receive(msg: CreateToken) {
        let ctx: Context = context();
        require(ctx.value >= self.launchFee, "Insufficient launch fee");

        let creator: Address = ctx.sender;
        self.launchCount = self.launchCount + 1;

        // Send launch fee to platform treasury
        send(SendParameters{
            to: self.platformTreasury,
            value: self.launchFee,
            mode: SendPayGasSeparately,
            body: "launch_fee".asComment(),
        });

        // Deploy bonding curve (child contract)
        let curveInit: StateInit = initOf BondingCurve(
            creator,
            self.platformTreasury,
            myAddress(), // placeholder jetton master — updated post-deploy
            msg.name,
            msg.symbol,
        );

        send(SendParameters{
            to: contractAddress(curveInit),
            value: ton("0.1"),
            mode: SendPayGasSeparately,
            code: curveInit.code,
            data: curveInit.data,
            body: "deploy_curve".asComment(),
        });

        // Handle initial buy if provided
        if (msg.initialBuyTon > 0) {
            send(SendParameters{
                to: contractAddress(curveInit),
                value: msg.initialBuyTon,
                mode: SendPayGasSeparately,
                body: Buy{queryId: msg.queryId, minTokensOut: 0}.toCell(),
            });
        }

        // Refund excess TON to creator
        let remaining: Int = ctx.value - self.launchFee - ton("0.15") - msg.initialBuyTon;
        if (remaining > 0) {
            send(SendParameters{
                to: creator,
                value: remaining,
                mode: SendPayGasSeparately,
                body: "refund".asComment(),
            });
        }
    }

    get fun get_factory_info(): FactoryInfo {
        return FactoryInfo{
            owner: self.owner,
            platformTreasury: self.platformTreasury,
            launchCount: self.launchCount,
            launchFee: self.launchFee,
            graduationTarget: GRADUATION_TARGET,
            tradeFeeBps: TRADE_FEE_BPS,
        };
    }
}

struct FactoryInfo {
    owner: Address;
    platformTreasury: Address;
    launchCount: Int as uint32;
    launchFee: Int as coins;
    graduationTarget: Int as coins;
    tradeFeeBps: Int;
}
