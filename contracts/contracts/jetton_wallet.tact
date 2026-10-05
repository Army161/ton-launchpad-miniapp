// TEP-74 jetton wallet. One per (owner, minter) pair.

contract JettonWallet {
    balance: Int as coins;
    owner: Address;
    minter: Address;

    init(owner: Address, minter: Address) {
        self.balance = 0;
        self.owner = owner;
        self.minter = minter;
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

        let init: StateInit = initOf JettonWallet(msg.destination, self.minter);
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
        if (ctx.sender != self.minter) {
            let peer: StateInit = initOf JettonWallet(msg.sender, self.minter);
            require(ctx.sender == contractAddress(peer), "Invalid sender");
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

    // A failed transfer or a rejected burn/sell gives the jettons back.
    bounced(msg: bounced<JettonTransferInternal>) {
        self.balance = self.balance + msg.amount;
    }

    bounced(msg: bounced<JettonBurnNotification>) {
        self.balance = self.balance + msg.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            minter: self.minter,
            code: initOf JettonWallet(self.owner, self.minter).code,
        };
    }
}
