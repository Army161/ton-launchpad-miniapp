// TON Meme Coin Launchpad — factory, bonding-curve jetton minter, jetton wallet.
// V1 economics: 2% trade fee (60% creator / 40% platform), 1500 TON graduation.

import "./messages";
import "./jetton_wallet";
import "./launchpad_jetton";

contract LaunchpadFactory {
    owner: Address;
    treasury: Address;
    liquidityManager: Address;
    launchCount: Int as uint32;

    init(owner: Address, treasury: Address, liquidityManager: Address) {
        self.owner = owner;
        self.treasury = treasury;
        self.liquidityManager = liquidityManager;
        self.launchCount = 0;
    }

    // Deploy and top-ups.
    receive() {}

    receive(msg: CreateToken) {
        let ctx: Context = context();
        require(msg.initialBuyTon == 0 || msg.initialBuyTon >= MIN_TRADE, "Initial buy too small");
        require(msg.initialBuyTon <= MAX_INITIAL_BUY, "Initial buy too large");
        require(ctx.value >= LAUNCH_FEE + msg.initialBuyTon + CREATE_GAS, "Insufficient TON attached");

        self.launchCount = self.launchCount + 1;

        let init: StateInit = initOf LaunchpadJetton(myAddress(), ctx.sender, msg.salt);
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonSetup{
                queryId: msg.queryId,
                treasury: self.treasury,
                liquidityManager: self.liquidityManager,
                content: msg.content,
                launchFee: LAUNCH_FEE,
                initialBuyTon: msg.initialBuyTon,
            }.toCell(),
            code: init.code,
            data: init.data,
        });
    }

    // A bounced setup leaves its TON here; the owner can recover it.
    bounced(msg: bounced<JettonSetup>) {}

    receive(msg: FactoryWithdraw) {
        require(context().sender == self.owner, "Only owner");
        nativeReserve(ton("0.05"), ReserveExact);
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
            bounce: false,
            body: "Factory withdraw".asComment(),
        });
    }

    get fun get_factory_info(): FactoryInfo {
        return FactoryInfo{
            owner: self.owner,
            treasury: self.treasury,
            liquidityManager: self.liquidityManager,
            launchCount: self.launchCount,
            launchFee: LAUNCH_FEE,
            graduationTarget: GRADUATION_TARGET,
            tradeFeeBps: TRADE_FEE_BPS,
            creatorFeeBps: CREATOR_FEE_BPS,
        };
    }

    get fun get_jetton_address(creator: Address, salt: Int): Address {
        return contractAddress(initOf LaunchpadJetton(myAddress(), creator, salt));
    }
}
