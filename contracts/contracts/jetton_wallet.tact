// TEP-74 jetton wallet. One per (owner, minter) pair.
//
// The wallet that belongs to the token's STON.fi router is guarded (ADR-010).
// It accepts nothing until the token contract's graduation mint, and no outside
// liquidity deposit for DEX_LP_GUARD seconds after that mint, so nobody can seed
// the pool before the curve's own liquidity is in it. Every other wallet has the
// guard switched off (0) and is a plain TEP-74 wallet. Transfers out of the
// router's wallet (swap payouts, refunds) are never restricted.

contract JettonWallet {
    balance: Int as coins;
    owner: Address;
    minter: Address;
    dexRouter: Address;
    // 0: no guard. DEX_CLOSED: closed until the graduation mint.
    // Anything else: the time from which outside liquidity deposits are accepted.
    dexGuardUntil: Int as uint32;

    init(owner: Address, minter: Address, dexRouter: Address) {
        self.balance = 0;
        self.owner = owner;
        self.minter = minter;
        self.dexRouter = dexRouter;
        self.dexGuardUntil = owner == dexRouter ? DEX_CLOSED : 0;
    }

    receive(msg: JettonTransfer) {
        forceBasechain(msg.destination);
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid sender");
        require(msg.amount > 0, "Invalid amount");

        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Insufficient jetton balance");

        let fwdFee: Int = ctx.readForwardFee();
        let fwdCount: Int = msg.forwardTonAmount > 0 ? 2 : 1;
        require(
            ctx.value > msg.forwardTonAmount + fwdCount * fwdFee + 2 * WALLET_GAS + WALLET_MIN_STORAGE,
            "Insufficient TON attached",
        );

        let init: StateInit = initOf JettonWallet(msg.destination, self.minter, self.dexRouter);
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload,
            }.toCell(),
            code: init.code,
            data: init.data,
        });
    }

    receive(msg: JettonTransferInternal) {
        let ctx: Context = context();
        if (ctx.sender == self.minter) {
            // The router's wallet is minted to exactly once: at graduation.
            if (self.dexGuardUntil == DEX_CLOSED) {
                self.dexGuardUntil = now() + DEX_LP_GUARD;
            }
        } else {
            let peer: StateInit = initOf JettonWallet(msg.sender, self.minter, self.dexRouter);
            require(ctx.sender == contractAddress(peer), "Invalid sender");
            if (now() < self.dexGuardUntil) {
                require(self.dexGuardUntil != DEX_CLOSED, "DEX closed until graduation");
                require(!carriesProvideLp(msg.forwardPayload), "DEX liquidity not open yet");
            }
        }
        self.balance = self.balance + msg.amount;

        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageTopUp: Int = WALLET_MIN_STORAGE - min(tonBalanceBeforeMsg, WALLET_MIN_STORAGE);
        msgValue = msgValue - (storageTopUp + WALLET_GAS);

        if (msg.forwardTonAmount > 0) {
            let fwdFee: Int = ctx.readForwardFee();
            msgValue = msgValue - (msg.forwardTonAmount + fwdFee);
            send(SendParameters{
                to: self.owner,
                value: msg.forwardTonAmount,
                mode: SendPayGasSeparately,
                bounce: false,
                body: JettonNotification{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    sender: msg.sender,
                    forwardPayload: msg.forwardPayload,
                }.toCell(),
            });
        }

        if (msg.responseDestination != null && msgValue > 0) {
            send(SendParameters{
                to: msg.responseDestination!!,
                value: msgValue,
                mode: SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: JettonBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid sender");
        require(msg.amount > 0, "Invalid amount");

        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Insufficient jetton balance");
        require(ctx.value >= BURN_MIN_VALUE, "Insufficient TON attached");

        send(SendParameters{
            to: self.minter,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
                customPayload: msg.customPayload,
            }.toCell(),
        });
    }

    // A failed transfer or a rejected burn/sell gives the jettons back, and the
    // TON that came back with the bounce goes on to the owner instead of staying
    // in this wallet, where nobody could ever use it.
    bounced(msg: bounced<JettonTransferInternal>) {
        self.balance = self.balance + msg.amount;
        self.refundBounce(msg.queryId);
    }

    bounced(msg: bounced<JettonBurnNotification>) {
        self.balance = self.balance + msg.amount;
        self.refundBounce(msg.queryId);
    }

    // SendIgnoreErrors: giving the jettons back must not depend on this send.
    fun refundBounce(queryId: Int) {
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            bounce: false,
            body: JettonExcesses{ queryId: queryId }.toCell(),
        });
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            minter: self.minter,
            code: initOf JettonWallet(self.owner, self.minter, self.dexRouter).code,
        };
    }

    // 0 for every wallet but the router's. See `dexGuardUntil`.
    get fun get_dex_guard(): Int {
        return self.dexGuardUntil;
    }
}

// True when the STON.fi v2 router would treat this forward payload as a
// liquidity deposit. The router does not look at the TEP-74 Either bit: it takes
// the first reference of whatever follows the sender address in the notification
// and reads a 32-bit op from it (router/msgs/jetton.fc, router/dex.fc). A first
// reference shorter than 32 bits makes the router refund the transfer.
fun carriesProvideLp(payload: Slice): Bool {
    if (payload.refs() == 0) {
        return false;
    }
    let dex: Slice = payload.preloadRef().beginParse();
    return dex.bits() >= 32 && dex.preloadUint(32) == STON_PROVIDE_LP_OP;
}
