import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type CreateToken = {
    $$type: 'CreateToken';
    queryId: bigint;
    name: string;
    symbol: string;
    imageUri: string;
    description: string;
    telegramLink: string;
    initialBuyTon: bigint;
}

export function storeCreateToken(src: CreateToken) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        const b_1 = new Builder();
        b_1.storeStringRefTail(src.imageUri);
        b_1.storeStringRefTail(src.description);
        b_1.storeStringRefTail(src.telegramLink);
        b_1.storeCoins(src.initialBuyTon);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCreateToken(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const sc_1 = sc_0.loadRef().beginParse();
    const _imageUri = sc_1.loadStringRefTail();
    const _description = sc_1.loadStringRefTail();
    const _telegramLink = sc_1.loadStringRefTail();
    const _initialBuyTon = sc_1.loadCoins();
    return { $$type: 'CreateToken' as const, queryId: _queryId, name: _name, symbol: _symbol, imageUri: _imageUri, description: _description, telegramLink: _telegramLink, initialBuyTon: _initialBuyTon };
}

export function loadTupleCreateToken(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _name = source.readString();
    const _symbol = source.readString();
    const _imageUri = source.readString();
    const _description = source.readString();
    const _telegramLink = source.readString();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'CreateToken' as const, queryId: _queryId, name: _name, symbol: _symbol, imageUri: _imageUri, description: _description, telegramLink: _telegramLink, initialBuyTon: _initialBuyTon };
}

export function loadGetterTupleCreateToken(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _name = source.readString();
    const _symbol = source.readString();
    const _imageUri = source.readString();
    const _description = source.readString();
    const _telegramLink = source.readString();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'CreateToken' as const, queryId: _queryId, name: _name, symbol: _symbol, imageUri: _imageUri, description: _description, telegramLink: _telegramLink, initialBuyTon: _initialBuyTon };
}

export function storeTupleCreateToken(source: CreateToken) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeString(source.imageUri);
    builder.writeString(source.description);
    builder.writeString(source.telegramLink);
    builder.writeNumber(source.initialBuyTon);
    return builder.build();
}

export function dictValueParserCreateToken(): DictionaryValue<CreateToken> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateToken(src)).endCell());
        },
        parse: (src) => {
            return loadCreateToken(src.loadRef().beginParse());
        }
    }
}

export type Buy = {
    $$type: 'Buy';
    queryId: bigint;
    minTokensOut: bigint;
}

export function storeBuy(src: Buy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.minTokensOut);
    };
}

export function loadBuy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _minTokensOut = sc_0.loadCoins();
    return { $$type: 'Buy' as const, queryId: _queryId, minTokensOut: _minTokensOut };
}

export function loadTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    return { $$type: 'Buy' as const, queryId: _queryId, minTokensOut: _minTokensOut };
}

export function loadGetterTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    return { $$type: 'Buy' as const, queryId: _queryId, minTokensOut: _minTokensOut };
}

export function storeTupleBuy(source: Buy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.minTokensOut);
    return builder.build();
}

export function dictValueParserBuy(): DictionaryValue<Buy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBuy(src)).endCell());
        },
        parse: (src) => {
            return loadBuy(src.loadRef().beginParse());
        }
    }
}

export type Sell = {
    $$type: 'Sell';
    queryId: bigint;
    jettonAmount: bigint;
    minTonOut: bigint;
}

export function storeSell(src: Sell) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.jettonAmount);
        b_0.storeCoins(src.minTonOut);
    };
}

export function loadSell(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _jettonAmount = sc_0.loadCoins();
    const _minTonOut = sc_0.loadCoins();
    return { $$type: 'Sell' as const, queryId: _queryId, jettonAmount: _jettonAmount, minTonOut: _minTonOut };
}

export function loadTupleSell(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _jettonAmount = source.readBigNumber();
    const _minTonOut = source.readBigNumber();
    return { $$type: 'Sell' as const, queryId: _queryId, jettonAmount: _jettonAmount, minTonOut: _minTonOut };
}

export function loadGetterTupleSell(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _jettonAmount = source.readBigNumber();
    const _minTonOut = source.readBigNumber();
    return { $$type: 'Sell' as const, queryId: _queryId, jettonAmount: _jettonAmount, minTonOut: _minTonOut };
}

export function storeTupleSell(source: Sell) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.jettonAmount);
    builder.writeNumber(source.minTonOut);
    return builder.build();
}

export function dictValueParserSell(): DictionaryValue<Sell> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSell(src)).endCell());
        },
        parse: (src) => {
            return loadSell(src.loadRef().beginParse());
        }
    }
}

export type Graduate = {
    $$type: 'Graduate';
    queryId: bigint;
}

export function storeGraduate(src: Graduate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadGraduate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Graduate' as const, queryId: _queryId };
}

export function loadTupleGraduate(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Graduate' as const, queryId: _queryId };
}

export function loadGetterTupleGraduate(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Graduate' as const, queryId: _queryId };
}

export function storeTupleGraduate(source: Graduate) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserGraduate(): DictionaryValue<Graduate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGraduate(src)).endCell());
        },
        parse: (src) => {
            return loadGraduate(src.loadRef().beginParse());
        }
    }
}

export type JettonTransfer = {
    $$type: 'JettonTransfer';
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardTonAmount: bigint;
    forwardPayload: Slice;
}

export function storeJettonTransfer(src: JettonTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(5, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forwardTonAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadJettonTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 5) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forwardTonAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadTupleJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function storeTupleJettonTransfer(source: JettonTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    builder.writeNumber(source.forwardTonAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransfer(): DictionaryValue<JettonTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransfer(src.loadRef().beginParse());
        }
    }
}

export type JettonTransferNotification = {
    $$type: 'JettonTransferNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    forwardPayload: Slice;
}

export function storeJettonTransferNotification(src: JettonTransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(6, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadJettonTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 6) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forwardPayload = sc_0;
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadTupleJettonTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadGetterTupleJettonTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function storeTupleJettonTransferNotification(source: JettonTransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransferNotification(): DictionaryValue<JettonTransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type JettonBurn = {
    $$type: 'JettonBurn';
    queryId: bigint;
    amount: bigint;
    responseDestination: Address | null;
    customPayload: Cell | null;
}

export function storeJettonBurn(src: JettonBurn) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(7, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadJettonBurn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 7) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'JettonBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadTupleJettonBurn(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'JettonBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadGetterTupleJettonBurn(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'JettonBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function storeTupleJettonBurn(source: JettonBurn) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserJettonBurn(): DictionaryValue<JettonBurn> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonBurn(src)).endCell());
        },
        parse: (src) => {
            return loadJettonBurn(src.loadRef().beginParse());
        }
    }
}

export type TokenLaunched = {
    $$type: 'TokenLaunched';
    queryId: bigint;
    jettonMaster: Address;
    curveAddress: Address;
    creator: Address;
    name: string;
    symbol: string;
}

export function storeTokenLaunched(src: TokenLaunched) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(256, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.jettonMaster);
        b_0.storeAddress(src.curveAddress);
        b_0.storeAddress(src.creator);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
    };
}

export function loadTokenLaunched(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 256) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _jettonMaster = sc_0.loadAddress();
    const _curveAddress = sc_0.loadAddress();
    const _creator = sc_0.loadAddress();
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, jettonMaster: _jettonMaster, curveAddress: _curveAddress, creator: _creator, name: _name, symbol: _symbol };
}

export function loadTupleTokenLaunched(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _jettonMaster = source.readAddress();
    const _curveAddress = source.readAddress();
    const _creator = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, jettonMaster: _jettonMaster, curveAddress: _curveAddress, creator: _creator, name: _name, symbol: _symbol };
}

export function loadGetterTupleTokenLaunched(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _jettonMaster = source.readAddress();
    const _curveAddress = source.readAddress();
    const _creator = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, jettonMaster: _jettonMaster, curveAddress: _curveAddress, creator: _creator, name: _name, symbol: _symbol };
}

export function storeTupleTokenLaunched(source: TokenLaunched) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.jettonMaster);
    builder.writeAddress(source.curveAddress);
    builder.writeAddress(source.creator);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    return builder.build();
}

export function dictValueParserTokenLaunched(): DictionaryValue<TokenLaunched> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenLaunched(src)).endCell());
        },
        parse: (src) => {
            return loadTokenLaunched(src.loadRef().beginParse());
        }
    }
}

export type TradeEvent = {
    $$type: 'TradeEvent';
    queryId: bigint;
    isBuy: boolean;
    tonAmount: bigint;
    tokenAmount: bigint;
    creatorFee: bigint;
    platformFee: bigint;
}

export function storeTradeEvent(src: TradeEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(257, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeBit(src.isBuy);
        b_0.storeCoins(src.tonAmount);
        b_0.storeCoins(src.tokenAmount);
        b_0.storeCoins(src.creatorFee);
        b_0.storeCoins(src.platformFee);
    };
}

export function loadTradeEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 257) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _isBuy = sc_0.loadBit();
    const _tonAmount = sc_0.loadCoins();
    const _tokenAmount = sc_0.loadCoins();
    const _creatorFee = sc_0.loadCoins();
    const _platformFee = sc_0.loadCoins();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadTupleTradeEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _isBuy = source.readBoolean();
    const _tonAmount = source.readBigNumber();
    const _tokenAmount = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadGetterTupleTradeEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _isBuy = source.readBoolean();
    const _tonAmount = source.readBigNumber();
    const _tokenAmount = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function storeTupleTradeEvent(source: TradeEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeBoolean(source.isBuy);
    builder.writeNumber(source.tonAmount);
    builder.writeNumber(source.tokenAmount);
    builder.writeNumber(source.creatorFee);
    builder.writeNumber(source.platformFee);
    return builder.build();
}

export function dictValueParserTradeEvent(): DictionaryValue<TradeEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTradeEvent(src)).endCell());
        },
        parse: (src) => {
            return loadTradeEvent(src.loadRef().beginParse());
        }
    }
}

export type GraduatedEvent = {
    $$type: 'GraduatedEvent';
    queryId: bigint;
    tonLiquidity: bigint;
    tokenLiquidity: bigint;
}

export function storeGraduatedEvent(src: GraduatedEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(258, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.tonLiquidity);
        b_0.storeCoins(src.tokenLiquidity);
    };
}

export function loadGraduatedEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 258) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _tonLiquidity = sc_0.loadCoins();
    const _tokenLiquidity = sc_0.loadCoins();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function loadTupleGraduatedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function loadGetterTupleGraduatedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function storeTupleGraduatedEvent(source: GraduatedEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.tonLiquidity);
    builder.writeNumber(source.tokenLiquidity);
    return builder.build();
}

export function dictValueParserGraduatedEvent(): DictionaryValue<GraduatedEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGraduatedEvent(src)).endCell());
        },
        parse: (src) => {
            return loadGraduatedEvent(src.loadRef().beginParse());
        }
    }
}

export type JettonData = {
    $$type: 'JettonData';
    totalSupply: bigint;
    mintable: boolean;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

export function storeJettonData(src: JettonData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.totalSupply);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeRef(src.walletCode);
    };
}

export function loadJettonData(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadCoins();
    const _mintable = sc_0.loadBit();
    const _owner = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _walletCode = sc_0.loadRef();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, walletCode: _walletCode };
}

export function loadTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _walletCode = source.readCell();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, walletCode: _walletCode };
}

export function loadGetterTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _walletCode = source.readCell();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, walletCode: _walletCode };
}

export function storeTupleJettonData(source: JettonData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.owner);
    builder.writeCell(source.content);
    builder.writeCell(source.walletCode);
    return builder.build();
}

export function dictValueParserJettonData(): DictionaryValue<JettonData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonData(src.loadRef().beginParse());
        }
    }
}

export type JettonMinter$Data = {
    $$type: 'JettonMinter$Data';
    totalSupply: bigint;
    mintable: boolean;
    owner: Address;
    content: Cell;
    curveAddress: Address;
}

export function storeJettonMinter$Data(src: JettonMinter$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.totalSupply);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeAddress(src.curveAddress);
    };
}

export function loadJettonMinter$Data(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadCoins();
    const _mintable = sc_0.loadBit();
    const _owner = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _curveAddress = sc_0.loadAddress();
    return { $$type: 'JettonMinter$Data' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, curveAddress: _curveAddress };
}

export function loadTupleJettonMinter$Data(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _curveAddress = source.readAddress();
    return { $$type: 'JettonMinter$Data' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, curveAddress: _curveAddress };
}

export function loadGetterTupleJettonMinter$Data(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _curveAddress = source.readAddress();
    return { $$type: 'JettonMinter$Data' as const, totalSupply: _totalSupply, mintable: _mintable, owner: _owner, content: _content, curveAddress: _curveAddress };
}

export function storeTupleJettonMinter$Data(source: JettonMinter$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.owner);
    builder.writeCell(source.content);
    builder.writeAddress(source.curveAddress);
    return builder.build();
}

export function dictValueParserJettonMinter$Data(): DictionaryValue<JettonMinter$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonMinter$Data(src)).endCell());
        },
        parse: (src) => {
            return loadJettonMinter$Data(src.loadRef().beginParse());
        }
    }
}

export type BondingCurve$Data = {
    $$type: 'BondingCurve$Data';
    creator: Address;
    platformTreasury: Address;
    jettonMaster: Address;
    name: string;
    symbol: string;
    virtualTon: bigint;
    virtualTokens: bigint;
    realTonRaised: bigint;
    tokensSold: bigint;
    graduated: boolean;
    totalCreatorFees: bigint;
    totalPlatformFees: bigint;
}

export function storeBondingCurve$Data(src: BondingCurve$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.creator);
        b_0.storeAddress(src.platformTreasury);
        b_0.storeAddress(src.jettonMaster);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        b_0.storeCoins(src.virtualTon);
        const b_1 = new Builder();
        b_1.storeCoins(src.virtualTokens);
        b_1.storeCoins(src.realTonRaised);
        b_1.storeCoins(src.tokensSold);
        b_1.storeBit(src.graduated);
        b_1.storeCoins(src.totalCreatorFees);
        b_1.storeCoins(src.totalPlatformFees);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadBondingCurve$Data(slice: Slice) {
    const sc_0 = slice;
    const _creator = sc_0.loadAddress();
    const _platformTreasury = sc_0.loadAddress();
    const _jettonMaster = sc_0.loadAddress();
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const _virtualTon = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _virtualTokens = sc_1.loadCoins();
    const _realTonRaised = sc_1.loadCoins();
    const _tokensSold = sc_1.loadCoins();
    const _graduated = sc_1.loadBit();
    const _totalCreatorFees = sc_1.loadCoins();
    const _totalPlatformFees = sc_1.loadCoins();
    return { $$type: 'BondingCurve$Data' as const, creator: _creator, platformTreasury: _platformTreasury, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees };
}

export function loadTupleBondingCurve$Data(source: TupleReader) {
    const _creator = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _jettonMaster = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _tokensSold = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    return { $$type: 'BondingCurve$Data' as const, creator: _creator, platformTreasury: _platformTreasury, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees };
}

export function loadGetterTupleBondingCurve$Data(source: TupleReader) {
    const _creator = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _jettonMaster = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _tokensSold = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    return { $$type: 'BondingCurve$Data' as const, creator: _creator, platformTreasury: _platformTreasury, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees };
}

export function storeTupleBondingCurve$Data(source: BondingCurve$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.creator);
    builder.writeAddress(source.platformTreasury);
    builder.writeAddress(source.jettonMaster);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeNumber(source.virtualTon);
    builder.writeNumber(source.virtualTokens);
    builder.writeNumber(source.realTonRaised);
    builder.writeNumber(source.tokensSold);
    builder.writeBoolean(source.graduated);
    builder.writeNumber(source.totalCreatorFees);
    builder.writeNumber(source.totalPlatformFees);
    return builder.build();
}

export function dictValueParserBondingCurve$Data(): DictionaryValue<BondingCurve$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBondingCurve$Data(src)).endCell());
        },
        parse: (src) => {
            return loadBondingCurve$Data(src.loadRef().beginParse());
        }
    }
}

export type CurveState = {
    $$type: 'CurveState';
    creator: Address;
    jettonMaster: Address;
    name: string;
    symbol: string;
    virtualTon: bigint;
    virtualTokens: bigint;
    realTonRaised: bigint;
    tokensSold: bigint;
    graduated: boolean;
    graduationTarget: bigint;
    totalCreatorFees: bigint;
    totalPlatformFees: bigint;
    progressBps: bigint;
}

export function storeCurveState(src: CurveState) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.creator);
        b_0.storeAddress(src.jettonMaster);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        b_0.storeCoins(src.virtualTon);
        b_0.storeCoins(src.virtualTokens);
        b_0.storeCoins(src.realTonRaised);
        const b_1 = new Builder();
        b_1.storeCoins(src.tokensSold);
        b_1.storeBit(src.graduated);
        b_1.storeCoins(src.graduationTarget);
        b_1.storeCoins(src.totalCreatorFees);
        b_1.storeCoins(src.totalPlatformFees);
        b_1.storeInt(src.progressBps, 257);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCurveState(slice: Slice) {
    const sc_0 = slice;
    const _creator = sc_0.loadAddress();
    const _jettonMaster = sc_0.loadAddress();
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const _virtualTon = sc_0.loadCoins();
    const _virtualTokens = sc_0.loadCoins();
    const _realTonRaised = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _tokensSold = sc_1.loadCoins();
    const _graduated = sc_1.loadBit();
    const _graduationTarget = sc_1.loadCoins();
    const _totalCreatorFees = sc_1.loadCoins();
    const _totalPlatformFees = sc_1.loadCoins();
    const _progressBps = sc_1.loadIntBig(257);
    return { $$type: 'CurveState' as const, creator: _creator, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, progressBps: _progressBps };
}

export function loadTupleCurveState(source: TupleReader) {
    const _creator = source.readAddress();
    const _jettonMaster = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _tokensSold = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _graduationTarget = source.readBigNumber();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _progressBps = source.readBigNumber();
    return { $$type: 'CurveState' as const, creator: _creator, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, progressBps: _progressBps };
}

export function loadGetterTupleCurveState(source: TupleReader) {
    const _creator = source.readAddress();
    const _jettonMaster = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _tokensSold = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _graduationTarget = source.readBigNumber();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _progressBps = source.readBigNumber();
    return { $$type: 'CurveState' as const, creator: _creator, jettonMaster: _jettonMaster, name: _name, symbol: _symbol, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, tokensSold: _tokensSold, graduated: _graduated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, progressBps: _progressBps };
}

export function storeTupleCurveState(source: CurveState) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.creator);
    builder.writeAddress(source.jettonMaster);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeNumber(source.virtualTon);
    builder.writeNumber(source.virtualTokens);
    builder.writeNumber(source.realTonRaised);
    builder.writeNumber(source.tokensSold);
    builder.writeBoolean(source.graduated);
    builder.writeNumber(source.graduationTarget);
    builder.writeNumber(source.totalCreatorFees);
    builder.writeNumber(source.totalPlatformFees);
    builder.writeNumber(source.progressBps);
    return builder.build();
}

export function dictValueParserCurveState(): DictionaryValue<CurveState> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCurveState(src)).endCell());
        },
        parse: (src) => {
            return loadCurveState(src.loadRef().beginParse());
        }
    }
}

export type QuoteBuy = {
    $$type: 'QuoteBuy';
    tokensOut: bigint;
    fee: bigint;
    creatorFee: bigint;
    platformFee: bigint;
}

export function storeQuoteBuy(src: QuoteBuy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.tokensOut);
        b_0.storeCoins(src.fee);
        b_0.storeCoins(src.creatorFee);
        b_0.storeCoins(src.platformFee);
    };
}

export function loadQuoteBuy(slice: Slice) {
    const sc_0 = slice;
    const _tokensOut = sc_0.loadCoins();
    const _fee = sc_0.loadCoins();
    const _creatorFee = sc_0.loadCoins();
    const _platformFee = sc_0.loadCoins();
    return { $$type: 'QuoteBuy' as const, tokensOut: _tokensOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadTupleQuoteBuy(source: TupleReader) {
    const _tokensOut = source.readBigNumber();
    const _fee = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'QuoteBuy' as const, tokensOut: _tokensOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadGetterTupleQuoteBuy(source: TupleReader) {
    const _tokensOut = source.readBigNumber();
    const _fee = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'QuoteBuy' as const, tokensOut: _tokensOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function storeTupleQuoteBuy(source: QuoteBuy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.tokensOut);
    builder.writeNumber(source.fee);
    builder.writeNumber(source.creatorFee);
    builder.writeNumber(source.platformFee);
    return builder.build();
}

export function dictValueParserQuoteBuy(): DictionaryValue<QuoteBuy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeQuoteBuy(src)).endCell());
        },
        parse: (src) => {
            return loadQuoteBuy(src.loadRef().beginParse());
        }
    }
}

export type QuoteSell = {
    $$type: 'QuoteSell';
    tonOut: bigint;
    fee: bigint;
    creatorFee: bigint;
    platformFee: bigint;
}

export function storeQuoteSell(src: QuoteSell) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.tonOut);
        b_0.storeCoins(src.fee);
        b_0.storeCoins(src.creatorFee);
        b_0.storeCoins(src.platformFee);
    };
}

export function loadQuoteSell(slice: Slice) {
    const sc_0 = slice;
    const _tonOut = sc_0.loadCoins();
    const _fee = sc_0.loadCoins();
    const _creatorFee = sc_0.loadCoins();
    const _platformFee = sc_0.loadCoins();
    return { $$type: 'QuoteSell' as const, tonOut: _tonOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadTupleQuoteSell(source: TupleReader) {
    const _tonOut = source.readBigNumber();
    const _fee = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'QuoteSell' as const, tonOut: _tonOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function loadGetterTupleQuoteSell(source: TupleReader) {
    const _tonOut = source.readBigNumber();
    const _fee = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    return { $$type: 'QuoteSell' as const, tonOut: _tonOut, fee: _fee, creatorFee: _creatorFee, platformFee: _platformFee };
}

export function storeTupleQuoteSell(source: QuoteSell) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.tonOut);
    builder.writeNumber(source.fee);
    builder.writeNumber(source.creatorFee);
    builder.writeNumber(source.platformFee);
    return builder.build();
}

export function dictValueParserQuoteSell(): DictionaryValue<QuoteSell> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeQuoteSell(src)).endCell());
        },
        parse: (src) => {
            return loadQuoteSell(src.loadRef().beginParse());
        }
    }
}

export type LaunchpadFactory$Data = {
    $$type: 'LaunchpadFactory$Data';
    owner: Address;
    platformTreasury: Address;
    launchCount: bigint;
    launchFee: bigint;
}

export function storeLaunchpadFactory$Data(src: LaunchpadFactory$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.platformTreasury);
        b_0.storeUint(src.launchCount, 32);
        b_0.storeCoins(src.launchFee);
    };
}

export function loadLaunchpadFactory$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _platformTreasury = sc_0.loadAddress();
    const _launchCount = sc_0.loadUintBig(32);
    const _launchFee = sc_0.loadCoins();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee };
}

export function loadTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee };
}

export function loadGetterTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee };
}

export function storeTupleLaunchpadFactory$Data(source: LaunchpadFactory$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.platformTreasury);
    builder.writeNumber(source.launchCount);
    builder.writeNumber(source.launchFee);
    return builder.build();
}

export function dictValueParserLaunchpadFactory$Data(): DictionaryValue<LaunchpadFactory$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLaunchpadFactory$Data(src)).endCell());
        },
        parse: (src) => {
            return loadLaunchpadFactory$Data(src.loadRef().beginParse());
        }
    }
}

export type FactoryInfo = {
    $$type: 'FactoryInfo';
    owner: Address;
    platformTreasury: Address;
    launchCount: bigint;
    launchFee: bigint;
    graduationTarget: bigint;
    tradeFeeBps: bigint;
}

export function storeFactoryInfo(src: FactoryInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.platformTreasury);
        b_0.storeUint(src.launchCount, 32);
        b_0.storeCoins(src.launchFee);
        b_0.storeCoins(src.graduationTarget);
        const b_1 = new Builder();
        b_1.storeInt(src.tradeFeeBps, 257);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadFactoryInfo(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _platformTreasury = sc_0.loadAddress();
    const _launchCount = sc_0.loadUintBig(32);
    const _launchFee = sc_0.loadCoins();
    const _graduationTarget = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _tradeFeeBps = sc_1.loadIntBig(257);
    return { $$type: 'FactoryInfo' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps };
}

export function loadTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps };
}

export function loadGetterTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _platformTreasury = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, platformTreasury: _platformTreasury, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps };
}

export function storeTupleFactoryInfo(source: FactoryInfo) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.platformTreasury);
    builder.writeNumber(source.launchCount);
    builder.writeNumber(source.launchFee);
    builder.writeNumber(source.graduationTarget);
    builder.writeNumber(source.tradeFeeBps);
    return builder.build();
}

export function dictValueParserFactoryInfo(): DictionaryValue<FactoryInfo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryInfo(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryInfo(src.loadRef().beginParse());
        }
    }
}

 type BondingCurve_init_args = {
    $$type: 'BondingCurve_init_args';
    creator: Address;
    platformTreasury: Address;
    jettonMaster: Address;
    name: string;
    symbol: string;
}

function initBondingCurve_init_args(src: BondingCurve_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.creator);
        b_0.storeAddress(src.platformTreasury);
        b_0.storeAddress(src.jettonMaster);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
    };
}

async function BondingCurve_init(creator: Address, platformTreasury: Address, jettonMaster: Address, name: string, symbol: string) {
    const __code = Cell.fromHex('b5ee9c7241021901000633000228ff008e88f4a413f4bcf2c80bed5320e303ed43d90109020271020401d1bedc1f6a268690000c7157d207d207d206a00e800ea00e86a00e800fd007d007d007d0069007d007d00180846084588450844b60e4715fd207d207d206a00e800ea00e80a8a219802e8aa81c10c037e11d600411806f05b59d3b200003810382988f12a85ed9e3662403004a5376a85272a0a9045270a1208100c8a8812710a90420811770a8812710a9045ca15132a103020120050701d1bb4c3ed44d0d200018e2afa40fa40fa40d401d001d401d0d401d001fa00fa00fa00fa00d200fa00fa0030108c108b108a10896c1c8e2bfa40fa40fa40d401d001d401d01514433005d15503821806fc23ac0082300de0b6b3a76400007020705311e2550bdb3c6cc4806004c208100c8a8812710a90466a15387a85292a0a9045270a121811770a8812710a9045320a1102301e5ba48ced44d0d200018e2afa40fa40fa40d401d001d401d0d401d001fa00fa00fa00fa00d200fa00fa0030108c108b108a10896c1c8e2bfa40fa40fa40d401d001d401d01514433005d15503821806fc23ac0082300de0b6b3a76400007020705311e2db3c3d3d3d3d3d3d3d3d3d3d3d3d55b0808004882195d3ef7980025812710a821a9042d544c302c544c302c544c302c544c302c59546cc002f83001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e2afa40fa40fa40d401d001d401d0d401d001fa00fa00fa00fa00d200fa00fa0030108c108b108a10896c1c8e2bfa40fa40fa40d401d001d401d01514433005d15503821806fc23ac0082300de0b6b3a76400007020705311e20de3020b0a0b00045f0d02d4d70d1ff2e08221c002e30221c006e30230c0048e4f8200ba9401b3f2f48200a5c12282195d3ef79800bef2f4108a55177f59c87f01ca0055b050bcce19ce17ce05c8ce15cdc804c8ce14cd58fa0201fa0258fa0258fa0212ca0058fa0258fa02cdc9ed54e05f0cf2c0820c1203fe31d33f31fa00308200ba9422b3f2f4f8416f243032815b0a22c200f2f4218100c8a8812710a90420811770a8812710a9045ca15042a15398a851a1a051aaa9045199a1208200a23907be16f2f48137ff5375a082300de0b6b3a7640000bbf2f45064a05063a051d1a051e4a021c2009131e30d23c2009133e30df8276f10200d0e0f017871882e0344445a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0014017871882c0346665a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001602d28208989680bc8ec082084c4b40a1718810365a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00923033e22a82195d3ef79800be92307fde109b108a1079106810571046103540331011001e000000006275795f737563636573730064c87f01ca0055b050bcce19ce17ce05c8ce15cdc804c8ce14cd58fa0201fa0258fa0258fa0212ca0058fa0258fa02cdc9ed5404fe31d33f31fa00fa40f8416f2410235f038200ba9425b3f2f42281114d02c705f2f45376a85173a05177a9045188a1208100c8a8812710a90420811770a8812710a9045ca15233a18200a23905fa00305210be15f2f45075a15077a151e3a051f5a023c2009133e30d24c2009134e30d7188102310255a6d6d40037fc8cf858013151718017871882f0346665a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0014001e0000000063726561746f725f666565017871882d0347775a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0016002000000000706c6174666f726d5f66656500200000000073656c6c5f7375636365737300dcca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00109b108a107910681057104610354033c87f01ca0055b050bcce19ce17ce05c8ce15cdc804c8ce14cd58fa0201fa0258fa0258fa0212ca0058fa0258fa02cdc9ed5416683b4d');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initBondingCurve_init_args({ $$type: 'BondingCurve_init_args', creator, platformTreasury, jettonMaster, name, symbol })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const BondingCurve_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    4429: { message: "Invalid sender" },
    14335: { message: "Exceeds supply" },
    15664: { message: "Only curve can mint" },
    23306: { message: "No TON sent" },
    23701: { message: "Insufficient launch fee" },
    41529: { message: "Slippage exceeded" },
    42433: { message: "Target not reached" },
    47764: { message: "Already graduated" },
} as const

export const BondingCurve_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Invalid sender": 4429,
    "Exceeds supply": 14335,
    "Only curve can mint": 15664,
    "No TON sent": 23306,
    "Insufficient launch fee": 23701,
    "Slippage exceeded": 41529,
    "Target not reached": 42433,
    "Already graduated": 47764,
} as const

const BondingCurve_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"CreateToken","header":1,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"imageUri","type":{"kind":"simple","type":"string","optional":false}},{"name":"description","type":{"kind":"simple","type":"string","optional":false}},{"name":"telegramLink","type":{"kind":"simple","type":"string","optional":false}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Buy","header":2,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"minTokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Sell","header":3,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"jettonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minTonOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Graduate","header":4,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"JettonTransfer","header":5,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonTransferNotification","header":6,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonBurn","header":7,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"TokenLaunched","header":256,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"jettonMaster","type":{"kind":"simple","type":"address","optional":false}},{"name":"curveAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}}]},
    {"name":"TradeEvent","header":257,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"isBuy","type":{"kind":"simple","type":"bool","optional":false}},{"name":"tonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"GraduatedEvent","header":258,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"tonLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"JettonData","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"walletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"JettonMinter$Data","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"curveAddress","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"BondingCurve$Data","header":null,"fields":[{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"platformTreasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonMaster","type":{"kind":"simple","type":"address","optional":false}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokensSold","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"CurveState","header":null,"fields":[{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonMaster","type":{"kind":"simple","type":"address","optional":false}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokensSold","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"progressBps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"QuoteBuy","header":null,"fields":[{"name":"tokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"QuoteSell","header":null,"fields":[{"name":"tonOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"LaunchpadFactory$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"platformTreasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"FactoryInfo","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"platformTreasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
]

const BondingCurve_opcodes = {
    "CreateToken": 1,
    "Buy": 2,
    "Sell": 3,
    "Graduate": 4,
    "JettonTransfer": 5,
    "JettonTransferNotification": 6,
    "JettonBurn": 7,
    "TokenLaunched": 256,
    "TradeEvent": 257,
    "GraduatedEvent": 258,
}

const BondingCurve_getters: ABIGetter[] = [
    {"name":"get_curve_state","methodId":124044,"arguments":[],"returnType":{"kind":"simple","type":"CurveState","optional":false}},
    {"name":"quote_buy","methodId":111811,"arguments":[{"name":"tonIn","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"QuoteBuy","optional":false}},
    {"name":"quote_sell","methodId":88963,"arguments":[{"name":"tokenIn","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"QuoteSell","optional":false}},
]

export const BondingCurve_getterMapping: { [key: string]: string } = {
    'get_curve_state': 'getGetCurveState',
    'quote_buy': 'getQuoteBuy',
    'quote_sell': 'getQuoteSell',
}

const BondingCurve_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"Buy"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonTransferNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Graduate"}},
]

export const TOTAL_SUPPLY = 1000000000n;
export const TOKEN_DECIMALS = 9n;
export const TOTAL_SUPPLY_NANO = 1000000000000000000n;
export const LAUNCH_FEE = 50000000n;
export const GRADUATION_TARGET = 1500000000000n;
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;
export const PLATFORM_FEE_BPS = 4000n;
export const VIRTUAL_TON = 30000000000n;
export const VIRTUAL_TOKENS = 1000000000000000000n;
export const OP_CREATE_TOKEN = 1n;
export const OP_BUY = 2n;
export const OP_SELL = 3n;
export const OP_GRADUATE = 4n;
export const OP_TRANSFER = 260734629n;

export class BondingCurve implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = BondingCurve_errors_backward;
    public static readonly opcodes = BondingCurve_opcodes;
    
    static async init(creator: Address, platformTreasury: Address, jettonMaster: Address, name: string, symbol: string) {
        return await BondingCurve_init(creator, platformTreasury, jettonMaster, name, symbol);
    }
    
    static async fromInit(creator: Address, platformTreasury: Address, jettonMaster: Address, name: string, symbol: string) {
        const __gen_init = await BondingCurve_init(creator, platformTreasury, jettonMaster, name, symbol);
        const address = contractAddress(0, __gen_init);
        return new BondingCurve(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new BondingCurve(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  BondingCurve_types,
        getters: BondingCurve_getters,
        receivers: BondingCurve_receivers,
        errors: BondingCurve_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Buy | JettonTransferNotification | Graduate) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Buy') {
            body = beginCell().store(storeBuy(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonTransferNotification') {
            body = beginCell().store(storeJettonTransferNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Graduate') {
            body = beginCell().store(storeGraduate(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetCurveState(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_curve_state', builder.build())).stack;
        const result = loadGetterTupleCurveState(source);
        return result;
    }
    
    async getQuoteBuy(provider: ContractProvider, tonIn: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(tonIn);
        const source = (await provider.get('quote_buy', builder.build())).stack;
        const result = loadGetterTupleQuoteBuy(source);
        return result;
    }
    
    async getQuoteSell(provider: ContractProvider, tokenIn: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(tokenIn);
        const source = (await provider.get('quote_sell', builder.build())).stack;
        const result = loadGetterTupleQuoteSell(source);
        return result;
    }
    
}