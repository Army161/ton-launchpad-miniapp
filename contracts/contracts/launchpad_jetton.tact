// Jetton minter that is also its own bonding curve.
//
// Buy:  trader sends Buy with TON → curve mints jettons to the trader's wallet.
// Sell: trader burns jettons from their wallet with a SELL custom payload →
//       the wallet sends a burn notification → curve pays TON out.
// The curve's TON reserve is always `realTonRaised` and is protected with
// nativeReserve on every trade, so a trade can never pay out more than it owns.

contract LaunchpadJetton {
    factory: Address;
    creator: Address;
    salt: Int as uint64;

    initialized: Bool;
    treasury: Address;
    liquidityManager: Address;
    content: Cell;

    totalSupply: Int as coins;
    virtualTon: Int as coins;
    virtualTokens: Int as coins;
    realTonRaised: Int as coins;
    graduated: Bool;
    migrated: Bool;
    totalCreatorFees: Int as coins;
    totalPlatformFees: Int as coins;
    tradeCount: Int as uint32;

    init(factory: Address, creator: Address, salt: Int) {
        self.factory = factory;
        self.creator = creator;
        self.salt = salt;
        self.initialized = false;
        // Placeholders until the factory's JettonSetup arrives.
        self.treasury = factory;
        self.liquidityManager = factory;
        self.content = emptyCell();
        self.totalSupply = 0;
        self.virtualTon = VIRTUAL_TON;
        self.virtualTokens = VIRTUAL_TOKENS;
        self.realTonRaised = 0;
        self.graduated = false;
        self.migrated = false;
        self.totalCreatorFees = 0;
        self.totalPlatformFees = 0;
        self.tradeCount = 0;
    }

    // ── Setup (factory only, once) ──────────────────────────────────────────
    receive(msg: JettonSetup) {
        let ctx: Context = context();
        require(ctx.sender == self.factory, "Only factory");

        if (self.initialized) {
            // Same creator reused a salt: give everything back, change nothing.
            send(SendParameters{
                to: self.creator,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: "Launch refunded: token already exists".asComment(),
            });
            return;
        }

        self.initialized = true;
        self.treasury = msg.treasury;
        self.liquidityManager = msg.liquidityManager;
        self.content = msg.content;

        emit(TokenLaunched{
            queryId: msg.queryId,
            creator: self.creator,
            salt: self.salt,
            initialBuyTon: msg.initialBuyTon,
        }.toCell());

        send(SendParameters{
            to: self.treasury,
            value: msg.launchFee,
            mode: SendPayGasSeparately,
            bounce: false,
            body: "Launch fee".asComment(),
        });

        if (msg.initialBuyTon > 0) {
            // executeBuy reserves the curve's TON before sending anything else.
            self.executeBuy(self.creator, msg.initialBuyTon, 0, msg.queryId);
            return;
        }

        nativeReserve(MINTER_MIN_STORAGE, ReserveExact);
        send(SendParameters{
            to: self.creator,
            value: 0,
            mode: SendRemainingBalance,
            bounce: false,
            body: JettonExcesses{ queryId: msg.queryId }.toCell(),
        });
    }

    // ── Buy ─────────────────────────────────────────────────────────────────
    receive(msg: Buy) {
        let ctx: Context = context();
        require(self.initialized, "Not initialized");
        require(!self.graduated, "Curve graduated");
        require(msg.tonAmount >= MIN_TRADE, "Trade too small");
        require(ctx.value >= msg.tonAmount + BUY_GAS, "Insufficient TON attached");
        self.executeBuy(ctx.sender, msg.tonAmount, msg.minTokensOut, msg.queryId);
    }

    fun executeBuy(buyer: Address, tonAmount: Int, minTokensOut: Int, queryId: Int) {
        let q: QuoteBuy = self.quoteBuy(tonAmount);
        require(q.tokensOut > 0, "Trade too small");
        require(q.tokensOut >= minTokensOut, "Slippage exceeded");

        let tonAfterFee: Int = tonAmount - q.fee;
        self.virtualTon = self.virtualTon + tonAfterFee;
        self.virtualTokens = self.virtualTokens - q.tokensOut;
        self.realTonRaised = self.realTonRaised + tonAfterFee;
        self.totalSupply = self.totalSupply + q.tokensOut;
        self.totalCreatorFees = self.totalCreatorFees + q.creatorFee;
        self.totalPlatformFees = self.totalPlatformFees + q.platformFee;
        self.tradeCount = self.tradeCount + 1;

        if (self.realTonRaised >= GRADUATION_TARGET) {
            self.graduated = true;
            emit(GraduatedEvent{ queryId: queryId, realTonRaised: self.realTonRaised }.toCell());
        }

        // Lock the reserve first: every send below can only spend what is left.
        nativeReserve(self.realTonRaised + MINTER_MIN_STORAGE, ReserveExact);
        self.payFees(q.creatorFee, q.platformFee);

        emit(TradeEvent{
            queryId: queryId,
            trader: buyer,
            isBuy: true,
            tonAmount: tonAmount,
            tokenAmount: q.tokensOut,
            creatorFee: q.creatorFee,
            platformFee: q.platformFee,
            realTonRaised: self.realTonRaised,
        }.toCell());

        self.mint(buyer, q.tokensOut, queryId, SendRemainingBalance, 0);
    }

    // ── Sell / burn ─────────────────────────────────────────────────────────
    receive(msg: JettonBurnNotification) {
        let ctx: Context = context();
        let wallet: StateInit = initOf JettonWallet(msg.sender, myAddress());
        require(ctx.sender == contractAddress(wallet), "Invalid sender");

        if (msg.customPayload == null) {
            // Plain TEP-74 burn. Only allowed once the curve is closed, so it
            // cannot desynchronise the curve's supply accounting.
            require(self.graduated, "Sell through the curve");
            self.totalSupply = self.totalSupply - msg.amount;
            let to: Address = msg.responseDestination != null ? msg.responseDestination!! : msg.sender;
            send(SendParameters{
                to: to,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ queryId: msg.queryId }.toCell(),
            });
            return;
        }

        require(!self.graduated, "Curve graduated");
        require(ctx.value >= SELL_GAS, "Insufficient TON attached");
        let payload: Slice = msg.customPayload!!.beginParse();
        require(payload.loadUint(32) == SELL_PAYLOAD_OP, "Unknown burn payload");
        let minTonOut: Int = payload.loadCoins();

        let q: QuoteSell = self.quoteSell(msg.amount);
        let grossTonOut: Int = q.tonOut + q.fee;
        require(q.tonOut > 0, "Trade too small");
        require(grossTonOut <= self.realTonRaised, "Insufficient reserve");
        require(q.tonOut >= minTonOut, "Slippage exceeded");

        self.virtualTon = self.virtualTon - grossTonOut;
        self.virtualTokens = self.virtualTokens + msg.amount;
        self.realTonRaised = self.realTonRaised - grossTonOut;
        self.totalSupply = self.totalSupply - msg.amount;
        self.totalCreatorFees = self.totalCreatorFees + q.creatorFee;
        self.totalPlatformFees = self.totalPlatformFees + q.platformFee;
        self.tradeCount = self.tradeCount + 1;

        nativeReserve(self.realTonRaised + MINTER_MIN_STORAGE, ReserveExact);
        self.payFees(q.creatorFee, q.platformFee);

        emit(TradeEvent{
            queryId: msg.queryId,
            trader: msg.sender,
            isBuy: false,
            tonAmount: grossTonOut,
            tokenAmount: msg.amount,
            creatorFee: q.creatorFee,
            platformFee: q.platformFee,
            realTonRaised: self.realTonRaised,
        }.toCell());

        // Seller receives the net TON plus whatever gas is left.
        send(SendParameters{
            to: msg.sender,
            value: 0,
            mode: SendRemainingBalance,
            bounce: false,
            body: "Sell proceeds".asComment(),
        });
    }

    // ── Graduation → liquidity migration (permissionless) ───────────────────
    receive(msg: Migrate) {
        let ctx: Context = context();
        require(self.graduated, "Not graduated");
        require(!self.migrated, "Already migrated");
        require(ctx.value >= MIGRATE_GAS, "Insufficient TON attached");

        let tonLiquidity: Int = self.realTonRaised;
        let tokenLiquidity: Int = self.virtualTokens;
        self.migrated = true;
        self.realTonRaised = 0;
        self.virtualTokens = 0;
        self.totalSupply = self.totalSupply + tokenLiquidity;

        emit(MigratedEvent{
            queryId: msg.queryId,
            liquidityManager: self.liquidityManager,
            tonLiquidity: tonLiquidity,
            tokenLiquidity: tokenLiquidity,
        }.toCell());

        nativeReserve(MINTER_MIN_STORAGE, ReserveExact);
        self.mint(self.liquidityManager, tokenLiquidity, msg.queryId, SendPayGasSeparately, ton("0.05"));
        send(SendParameters{
            to: self.liquidityManager,
            value: 0,
            mode: SendRemainingBalance,
            bounce: false,
            body: "Graduation liquidity".asComment(),
        });
    }

    // ── TEP-89 ──────────────────────────────────────────────────────────────
    receive(msg: ProvideWalletAddress) {
        let ownerWorkchain: Int = parseStdAddress(msg.ownerAddress.asSlice()).workchain;
        let walletAddress: Address? = null;
        if (ownerWorkchain == 0) {
            walletAddress = contractAddress(initOf JettonWallet(msg.ownerAddress, myAddress()));
        }
        send(SendParameters{
            to: context().sender,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TakeWalletAddress{
                queryId: msg.queryId,
                walletAddress: walletAddress,
                ownerAddress: msg.includeAddress ? beginCell().storeAddress(msg.ownerAddress).endCell() : null,
            }.toCell(),
        });
    }

    // ── Internals ───────────────────────────────────────────────────────────
    fun payFees(creatorFee: Int, platformFee: Int) {
        if (creatorFee > 0) {
            send(SendParameters{
                to: self.creator,
                value: creatorFee,
                mode: SendPayGasSeparately,
                bounce: false,
                body: "Creator fee".asComment(),
            });
        }
        if (platformFee > 0) {
            send(SendParameters{
                to: self.treasury,
                value: platformFee,
                mode: SendPayGasSeparately,
                bounce: false,
                body: "Platform fee".asComment(),
            });
        }
    }

    fun mint(to: Address, amount: Int, queryId: Int, mode: Int, value: Int) {
        let init: StateInit = initOf JettonWallet(to, myAddress());
        send(SendParameters{
            to: contractAddress(init),
            value: value,
            mode: mode,
            bounce: true,
            body: JettonTransferInternal{
                queryId: queryId,
                amount: amount,
                sender: myAddress(),
                responseDestination: to,
                forwardTonAmount: 0,
                forwardPayload: beginCell().storeBool(false).asSlice(),
            }.toCell(),
            code: init.code,
            data: init.data,
        });
    }

    fun quoteBuy(tonAmount: Int): QuoteBuy {
        let fee: Int = tradeFee(tonAmount);
        let creatorFee: Int = creatorShare(fee);
        let tonAfterFee: Int = tonAmount - fee;
        let newVirtualTon: Int = self.virtualTon + tonAfterFee;
        let newVirtualTokens: Int = muldivc(self.virtualTon, self.virtualTokens, newVirtualTon);
        return QuoteBuy{
            tokensOut: self.virtualTokens - newVirtualTokens,
            fee: fee,
            creatorFee: creatorFee,
            platformFee: fee - creatorFee,
        };
    }

    fun quoteSell(tokenAmount: Int): QuoteSell {
        let newVirtualTokens: Int = self.virtualTokens + tokenAmount;
        let newVirtualTon: Int = muldivc(self.virtualTon, self.virtualTokens, newVirtualTokens);
        let grossTonOut: Int = self.virtualTon - newVirtualTon;
        let fee: Int = tradeFee(grossTonOut);
        let creatorFee: Int = creatorShare(fee);
        return QuoteSell{
            tonOut: grossTonOut - fee,
            fee: fee,
            creatorFee: creatorFee,
            platformFee: fee - creatorFee,
        };
    }

    // ── Getters ─────────────────────────────────────────────────────────────
    get fun get_jetton_data(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: !self.migrated,
            adminAddress: null,
            content: self.content,
            walletCode: initOf JettonWallet(myAddress(), myAddress()).code,
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf JettonWallet(owner, myAddress()));
    }

    get fun get_curve_state(): CurveState {
        return CurveState{
            factory: self.factory,
            creator: self.creator,
            treasury: self.treasury,
            liquidityManager: self.liquidityManager,
            initialized: self.initialized,
            virtualTon: self.virtualTon,
            virtualTokens: self.virtualTokens,
            realTonRaised: self.realTonRaised,
            totalSupply: self.totalSupply,
            graduated: self.graduated,
            migrated: self.migrated,
            graduationTarget: GRADUATION_TARGET,
            totalCreatorFees: self.totalCreatorFees,
            totalPlatformFees: self.totalPlatformFees,
            tradeCount: self.tradeCount,
            progressBps: min(BPS, self.realTonRaised * BPS / GRADUATION_TARGET),
        };
    }

    get fun quote_buy(tonAmount: Int): QuoteBuy {
        return self.quoteBuy(tonAmount);
    }

    get fun quote_sell(tokenAmount: Int): QuoteSell {
        return self.quoteSell(tokenAmount);
    }
}
