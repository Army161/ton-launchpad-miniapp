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
        b_0.storeUint(260734629, 32);
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
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
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

export type JettonTransferInternal = {
    $$type: 'JettonTransferInternal';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    responseDestination: Address | null;
    forwardTonAmount: bigint;
    forwardPayload: Slice;
}

export function storeJettonTransferInternal(src: JettonTransferInternal) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(395134233, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeAddress(src.responseDestination);
        b_0.storeCoins(src.forwardTonAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadJettonTransferInternal(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 395134233) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _forwardTonAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'JettonTransferInternal' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadTupleJettonTransferInternal(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferInternal' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleJettonTransferInternal(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferInternal' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function storeTupleJettonTransferInternal(source: JettonTransferInternal) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeAddress(source.responseDestination);
    builder.writeNumber(source.forwardTonAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransferInternal(): DictionaryValue<JettonTransferInternal> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransferInternal(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransferInternal(src.loadRef().beginParse());
        }
    }
}

export type JettonNotification = {
    $$type: 'JettonNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    forwardPayload: Slice;
}

export function storeJettonNotification(src: JettonNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadJettonNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forwardPayload = sc_0;
    return { $$type: 'JettonNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadTupleJettonNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadGetterTupleJettonNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function storeTupleJettonNotification(source: JettonNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserJettonNotification(): DictionaryValue<JettonNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonNotification(src.loadRef().beginParse());
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
        b_0.storeUint(1499400124, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadJettonBurn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1499400124) { throw Error('Invalid prefix'); }
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

export type JettonBurnNotification = {
    $$type: 'JettonBurnNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
}

export function storeJettonBurnNotification(src: JettonBurnNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2078119902, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadJettonBurnNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2078119902) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'JettonBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadTupleJettonBurnNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'JettonBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadGetterTupleJettonBurnNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'JettonBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function storeTupleJettonBurnNotification(source: JettonBurnNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserJettonBurnNotification(): DictionaryValue<JettonBurnNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonBurnNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonBurnNotification(src.loadRef().beginParse());
        }
    }
}

export type JettonExcesses = {
    $$type: 'JettonExcesses';
    queryId: bigint;
}

export function storeJettonExcesses(src: JettonExcesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadJettonExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'JettonExcesses' as const, queryId: _queryId };
}

export function loadTupleJettonExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'JettonExcesses' as const, queryId: _queryId };
}

export function loadGetterTupleJettonExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'JettonExcesses' as const, queryId: _queryId };
}

export function storeTupleJettonExcesses(source: JettonExcesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserJettonExcesses(): DictionaryValue<JettonExcesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadJettonExcesses(src.loadRef().beginParse());
        }
    }
}

export type ProvideWalletAddress = {
    $$type: 'ProvideWalletAddress';
    queryId: bigint;
    ownerAddress: Address;
    includeAddress: boolean;
}

export function storeProvideWalletAddress(src: ProvideWalletAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(745978227, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.ownerAddress);
        b_0.storeBit(src.includeAddress);
    };
}

export function loadProvideWalletAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 745978227) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _ownerAddress = sc_0.loadAddress();
    const _includeAddress = sc_0.loadBit();
    return { $$type: 'ProvideWalletAddress' as const, queryId: _queryId, ownerAddress: _ownerAddress, includeAddress: _includeAddress };
}

export function loadTupleProvideWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _includeAddress = source.readBoolean();
    return { $$type: 'ProvideWalletAddress' as const, queryId: _queryId, ownerAddress: _ownerAddress, includeAddress: _includeAddress };
}

export function loadGetterTupleProvideWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _includeAddress = source.readBoolean();
    return { $$type: 'ProvideWalletAddress' as const, queryId: _queryId, ownerAddress: _ownerAddress, includeAddress: _includeAddress };
}

export function storeTupleProvideWalletAddress(source: ProvideWalletAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.ownerAddress);
    builder.writeBoolean(source.includeAddress);
    return builder.build();
}

export function dictValueParserProvideWalletAddress(): DictionaryValue<ProvideWalletAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeProvideWalletAddress(src)).endCell());
        },
        parse: (src) => {
            return loadProvideWalletAddress(src.loadRef().beginParse());
        }
    }
}

export type TakeWalletAddress = {
    $$type: 'TakeWalletAddress';
    queryId: bigint;
    walletAddress: Address | null;
    ownerAddress: Cell | null;
}

export function storeTakeWalletAddress(src: TakeWalletAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3513996288, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.walletAddress);
        if (src.ownerAddress !== null && src.ownerAddress !== undefined) { b_0.storeBit(true).storeRef(src.ownerAddress); } else { b_0.storeBit(false); }
    };
}

export function loadTakeWalletAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3513996288) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _walletAddress = sc_0.loadMaybeAddress();
    const _ownerAddress = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'TakeWalletAddress' as const, queryId: _queryId, walletAddress: _walletAddress, ownerAddress: _ownerAddress };
}

export function loadTupleTakeWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _walletAddress = source.readAddressOpt();
    const _ownerAddress = source.readCellOpt();
    return { $$type: 'TakeWalletAddress' as const, queryId: _queryId, walletAddress: _walletAddress, ownerAddress: _ownerAddress };
}

export function loadGetterTupleTakeWalletAddress(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _walletAddress = source.readAddressOpt();
    const _ownerAddress = source.readCellOpt();
    return { $$type: 'TakeWalletAddress' as const, queryId: _queryId, walletAddress: _walletAddress, ownerAddress: _ownerAddress };
}

export function storeTupleTakeWalletAddress(source: TakeWalletAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.walletAddress);
    builder.writeCell(source.ownerAddress);
    return builder.build();
}

export function dictValueParserTakeWalletAddress(): DictionaryValue<TakeWalletAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTakeWalletAddress(src)).endCell());
        },
        parse: (src) => {
            return loadTakeWalletAddress(src.loadRef().beginParse());
        }
    }
}

export type CreateToken = {
    $$type: 'CreateToken';
    queryId: bigint;
    salt: bigint;
    content: Cell;
    initialBuyTon: bigint;
}

export function storeCreateToken(src: CreateToken) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311297, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeUint(src.salt, 64);
        b_0.storeRef(src.content);
        b_0.storeCoins(src.initialBuyTon);
    };
}

export function loadCreateToken(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311297) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _salt = sc_0.loadUintBig(64);
    const _content = sc_0.loadRef();
    const _initialBuyTon = sc_0.loadCoins();
    return { $$type: 'CreateToken' as const, queryId: _queryId, salt: _salt, content: _content, initialBuyTon: _initialBuyTon };
}

export function loadTupleCreateToken(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _salt = source.readBigNumber();
    const _content = source.readCell();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'CreateToken' as const, queryId: _queryId, salt: _salt, content: _content, initialBuyTon: _initialBuyTon };
}

export function loadGetterTupleCreateToken(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _salt = source.readBigNumber();
    const _content = source.readCell();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'CreateToken' as const, queryId: _queryId, salt: _salt, content: _content, initialBuyTon: _initialBuyTon };
}

export function storeTupleCreateToken(source: CreateToken) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.salt);
    builder.writeCell(source.content);
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

export type JettonSetup = {
    $$type: 'JettonSetup';
    queryId: bigint;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
    content: Cell;
    launchFee: bigint;
    initialBuyTon: bigint;
}

export function storeJettonSetup(src: JettonSetup) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311298, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        const b_1 = new Builder();
        b_1.store(storeDexConfig(src.dex));
        b_1.storeRef(src.content);
        b_1.storeCoins(src.launchFee);
        b_1.storeCoins(src.initialBuyTon);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadJettonSetup(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311298) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _dex = loadDexConfig(sc_1);
    const _content = sc_1.loadRef();
    const _launchFee = sc_1.loadCoins();
    const _initialBuyTon = sc_1.loadCoins();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function loadTupleJettonSetup(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadTupleDexConfig(source);
    const _content = source.readCell();
    const _launchFee = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function loadGetterTupleJettonSetup(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadGetterTupleDexConfig(source);
    const _content = source.readCell();
    const _launchFee = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function storeTupleJettonSetup(source: JettonSetup) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeTuple(storeTupleDexConfig(source.dex));
    builder.writeCell(source.content);
    builder.writeNumber(source.launchFee);
    builder.writeNumber(source.initialBuyTon);
    return builder.build();
}

export function dictValueParserJettonSetup(): DictionaryValue<JettonSetup> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonSetup(src)).endCell());
        },
        parse: (src) => {
            return loadJettonSetup(src.loadRef().beginParse());
        }
    }
}

export type Buy = {
    $$type: 'Buy';
    queryId: bigint;
    tonAmount: bigint;
    minTokensOut: bigint;
    referrer: Address | null;
}

export function storeBuy(src: Buy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311299, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.tonAmount);
        b_0.storeCoins(src.minTokensOut);
        b_0.storeAddress(src.referrer);
    };
}

export function loadBuy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311299) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _tonAmount = sc_0.loadCoins();
    const _minTokensOut = sc_0.loadCoins();
    const _referrer = sc_0.loadMaybeAddress();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut, referrer: _referrer };
}

export function loadTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonAmount = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    const _referrer = source.readAddressOpt();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut, referrer: _referrer };
}

export function loadGetterTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonAmount = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    const _referrer = source.readAddressOpt();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut, referrer: _referrer };
}

export function storeTupleBuy(source: Buy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.tonAmount);
    builder.writeNumber(source.minTokensOut);
    builder.writeAddress(source.referrer);
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

export type DexConfig = {
    $$type: 'DexConfig';
    router: Address;
    ptonWallet: Address;
}

export function storeDexConfig(src: DexConfig) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.router);
        b_0.storeAddress(src.ptonWallet);
    };
}

export function loadDexConfig(slice: Slice) {
    const sc_0 = slice;
    const _router = sc_0.loadAddress();
    const _ptonWallet = sc_0.loadAddress();
    return { $$type: 'DexConfig' as const, router: _router, ptonWallet: _ptonWallet };
}

export function loadTupleDexConfig(source: TupleReader) {
    const _router = source.readAddress();
    const _ptonWallet = source.readAddress();
    return { $$type: 'DexConfig' as const, router: _router, ptonWallet: _ptonWallet };
}

export function loadGetterTupleDexConfig(source: TupleReader) {
    const _router = source.readAddress();
    const _ptonWallet = source.readAddress();
    return { $$type: 'DexConfig' as const, router: _router, ptonWallet: _ptonWallet };
}

export function storeTupleDexConfig(source: DexConfig) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.router);
    builder.writeAddress(source.ptonWallet);
    return builder.build();
}

export function dictValueParserDexConfig(): DictionaryValue<DexConfig> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDexConfig(src)).endCell());
        },
        parse: (src) => {
            return loadDexConfig(src.loadRef().beginParse());
        }
    }
}

export type Migrate = {
    $$type: 'Migrate';
    queryId: bigint;
}

export function storeMigrate(src: Migrate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311300, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadMigrate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311300) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Migrate' as const, queryId: _queryId };
}

export function loadTupleMigrate(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Migrate' as const, queryId: _queryId };
}

export function loadGetterTupleMigrate(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Migrate' as const, queryId: _queryId };
}

export function storeTupleMigrate(source: Migrate) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserMigrate(): DictionaryValue<Migrate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMigrate(src)).endCell());
        },
        parse: (src) => {
            return loadMigrate(src.loadRef().beginParse());
        }
    }
}

export type FactoryWithdraw = {
    $$type: 'FactoryWithdraw';
    queryId: bigint;
}

export function storeFactoryWithdraw(src: FactoryWithdraw) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311301, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadFactoryWithdraw(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311301) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'FactoryWithdraw' as const, queryId: _queryId };
}

export function loadTupleFactoryWithdraw(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'FactoryWithdraw' as const, queryId: _queryId };
}

export function loadGetterTupleFactoryWithdraw(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'FactoryWithdraw' as const, queryId: _queryId };
}

export function storeTupleFactoryWithdraw(source: FactoryWithdraw) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserFactoryWithdraw(): DictionaryValue<FactoryWithdraw> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryWithdraw(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryWithdraw(src.loadRef().beginParse());
        }
    }
}

export type TokenLaunched = {
    $$type: 'TokenLaunched';
    queryId: bigint;
    creator: Address;
    salt: bigint;
    initialBuyTon: bigint;
}

export function storeTokenLaunched(src: TokenLaunched) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311553, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.creator);
        b_0.storeUint(src.salt, 64);
        b_0.storeCoins(src.initialBuyTon);
    };
}

export function loadTokenLaunched(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311553) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _creator = sc_0.loadAddress();
    const _salt = sc_0.loadUintBig(64);
    const _initialBuyTon = sc_0.loadCoins();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, creator: _creator, salt: _salt, initialBuyTon: _initialBuyTon };
}

export function loadTupleTokenLaunched(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, creator: _creator, salt: _salt, initialBuyTon: _initialBuyTon };
}

export function loadGetterTupleTokenLaunched(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'TokenLaunched' as const, queryId: _queryId, creator: _creator, salt: _salt, initialBuyTon: _initialBuyTon };
}

export function storeTupleTokenLaunched(source: TokenLaunched) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.creator);
    builder.writeNumber(source.salt);
    builder.writeNumber(source.initialBuyTon);
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
    trader: Address;
    isBuy: boolean;
    tonAmount: bigint;
    tokenAmount: bigint;
    creatorFee: bigint;
    platformFee: bigint;
    realTonRaised: bigint;
}

export function storeTradeEvent(src: TradeEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311554, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.trader);
        b_0.storeBit(src.isBuy);
        b_0.storeCoins(src.tonAmount);
        b_0.storeCoins(src.tokenAmount);
        b_0.storeCoins(src.creatorFee);
        b_0.storeCoins(src.platformFee);
        b_0.storeCoins(src.realTonRaised);
    };
}

export function loadTradeEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311554) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _trader = sc_0.loadAddress();
    const _isBuy = sc_0.loadBit();
    const _tonAmount = sc_0.loadCoins();
    const _tokenAmount = sc_0.loadCoins();
    const _creatorFee = sc_0.loadCoins();
    const _platformFee = sc_0.loadCoins();
    const _realTonRaised = sc_0.loadCoins();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, trader: _trader, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee, realTonRaised: _realTonRaised };
}

export function loadTupleTradeEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _trader = source.readAddress();
    const _isBuy = source.readBoolean();
    const _tonAmount = source.readBigNumber();
    const _tokenAmount = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, trader: _trader, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee, realTonRaised: _realTonRaised };
}

export function loadGetterTupleTradeEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _trader = source.readAddress();
    const _isBuy = source.readBoolean();
    const _tonAmount = source.readBigNumber();
    const _tokenAmount = source.readBigNumber();
    const _creatorFee = source.readBigNumber();
    const _platformFee = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    return { $$type: 'TradeEvent' as const, queryId: _queryId, trader: _trader, isBuy: _isBuy, tonAmount: _tonAmount, tokenAmount: _tokenAmount, creatorFee: _creatorFee, platformFee: _platformFee, realTonRaised: _realTonRaised };
}

export function storeTupleTradeEvent(source: TradeEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.trader);
    builder.writeBoolean(source.isBuy);
    builder.writeNumber(source.tonAmount);
    builder.writeNumber(source.tokenAmount);
    builder.writeNumber(source.creatorFee);
    builder.writeNumber(source.platformFee);
    builder.writeNumber(source.realTonRaised);
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

export type ReferralPaidEvent = {
    $$type: 'ReferralPaidEvent';
    queryId: bigint;
    referrer: Address;
    trader: Address;
    referrerFee: bigint;
}

export function storeReferralPaidEvent(src: ReferralPaidEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311557, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.referrer);
        b_0.storeAddress(src.trader);
        b_0.storeCoins(src.referrerFee);
    };
}

export function loadReferralPaidEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311557) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _referrer = sc_0.loadAddress();
    const _trader = sc_0.loadAddress();
    const _referrerFee = sc_0.loadCoins();
    return { $$type: 'ReferralPaidEvent' as const, queryId: _queryId, referrer: _referrer, trader: _trader, referrerFee: _referrerFee };
}

export function loadTupleReferralPaidEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _referrer = source.readAddress();
    const _trader = source.readAddress();
    const _referrerFee = source.readBigNumber();
    return { $$type: 'ReferralPaidEvent' as const, queryId: _queryId, referrer: _referrer, trader: _trader, referrerFee: _referrerFee };
}

export function loadGetterTupleReferralPaidEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _referrer = source.readAddress();
    const _trader = source.readAddress();
    const _referrerFee = source.readBigNumber();
    return { $$type: 'ReferralPaidEvent' as const, queryId: _queryId, referrer: _referrer, trader: _trader, referrerFee: _referrerFee };
}

export function storeTupleReferralPaidEvent(source: ReferralPaidEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.referrer);
    builder.writeAddress(source.trader);
    builder.writeNumber(source.referrerFee);
    return builder.build();
}

export function dictValueParserReferralPaidEvent(): DictionaryValue<ReferralPaidEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeReferralPaidEvent(src)).endCell());
        },
        parse: (src) => {
            return loadReferralPaidEvent(src.loadRef().beginParse());
        }
    }
}

export type GraduatedEvent = {
    $$type: 'GraduatedEvent';
    queryId: bigint;
    realTonRaised: bigint;
}

export function storeGraduatedEvent(src: GraduatedEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311555, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.realTonRaised);
    };
}

export function loadGraduatedEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311555) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _realTonRaised = sc_0.loadCoins();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, realTonRaised: _realTonRaised };
}

export function loadTupleGraduatedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, realTonRaised: _realTonRaised };
}

export function loadGetterTupleGraduatedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    return { $$type: 'GraduatedEvent' as const, queryId: _queryId, realTonRaised: _realTonRaised };
}

export function storeTupleGraduatedEvent(source: GraduatedEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.realTonRaised);
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

export type MigratedEvent = {
    $$type: 'MigratedEvent';
    queryId: bigint;
    router: Address;
    tonLiquidity: bigint;
    tokenLiquidity: bigint;
    minLpOut: bigint;
}

export function storeMigratedEvent(src: MigratedEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311556, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.router);
        b_0.storeCoins(src.tonLiquidity);
        b_0.storeCoins(src.tokenLiquidity);
        b_0.storeCoins(src.minLpOut);
    };
}

export function loadMigratedEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311556) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _router = sc_0.loadAddress();
    const _tonLiquidity = sc_0.loadCoins();
    const _tokenLiquidity = sc_0.loadCoins();
    const _minLpOut = sc_0.loadCoins();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, router: _router, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity, minLpOut: _minLpOut };
}

export function loadTupleMigratedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _router = source.readAddress();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    const _minLpOut = source.readBigNumber();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, router: _router, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity, minLpOut: _minLpOut };
}

export function loadGetterTupleMigratedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _router = source.readAddress();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    const _minLpOut = source.readBigNumber();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, router: _router, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity, minLpOut: _minLpOut };
}

export function storeTupleMigratedEvent(source: MigratedEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.router);
    builder.writeNumber(source.tonLiquidity);
    builder.writeNumber(source.tokenLiquidity);
    builder.writeNumber(source.minLpOut);
    return builder.build();
}

export function dictValueParserMigratedEvent(): DictionaryValue<MigratedEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMigratedEvent(src)).endCell());
        },
        parse: (src) => {
            return loadMigratedEvent(src.loadRef().beginParse());
        }
    }
}

export type JettonData = {
    $$type: 'JettonData';
    totalSupply: bigint;
    mintable: boolean;
    adminAddress: Address | null;
    content: Cell;
    walletCode: Cell;
}

export function storeJettonData(src: JettonData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.totalSupply);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.adminAddress);
        b_0.storeRef(src.content);
        b_0.storeRef(src.walletCode);
    };
}

export function loadJettonData(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadCoins();
    const _mintable = sc_0.loadBit();
    const _adminAddress = sc_0.loadMaybeAddress();
    const _content = sc_0.loadRef();
    const _walletCode = sc_0.loadRef();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, content: _content, walletCode: _walletCode };
}

export function loadTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _adminAddress = source.readAddressOpt();
    const _content = source.readCell();
    const _walletCode = source.readCell();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, content: _content, walletCode: _walletCode };
}

export function loadGetterTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _adminAddress = source.readAddressOpt();
    const _content = source.readCell();
    const _walletCode = source.readCell();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, content: _content, walletCode: _walletCode };
}

export function storeTupleJettonData(source: JettonData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.adminAddress);
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

export type JettonWalletData = {
    $$type: 'JettonWalletData';
    balance: bigint;
    owner: Address;
    minter: Address;
    code: Cell;
}

export function storeJettonWalletData(src: JettonWalletData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.minter);
        b_0.storeRef(src.code);
    };
}

export function loadJettonWalletData(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _minter = sc_0.loadAddress();
    const _code = sc_0.loadRef();
    return { $$type: 'JettonWalletData' as const, balance: _balance, owner: _owner, minter: _minter, code: _code };
}

export function loadTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _minter = source.readAddress();
    const _code = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, owner: _owner, minter: _minter, code: _code };
}

export function loadGetterTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _minter = source.readAddress();
    const _code = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, owner: _owner, minter: _minter, code: _code };
}

export function storeTupleJettonWalletData(source: JettonWalletData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.minter);
    builder.writeCell(source.code);
    return builder.build();
}

export function dictValueParserJettonWalletData(): DictionaryValue<JettonWalletData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonWalletData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonWalletData(src.loadRef().beginParse());
        }
    }
}

export type CurveState = {
    $$type: 'CurveState';
    factory: Address;
    creator: Address;
    salt: bigint;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
    initialized: boolean;
    virtualTon: bigint;
    virtualTokens: bigint;
    realTonRaised: bigint;
    totalSupply: bigint;
    graduated: boolean;
    migrated: boolean;
    graduationTarget: bigint;
    totalCreatorFees: bigint;
    totalPlatformFees: bigint;
    tradeCount: bigint;
    progressBps: bigint;
    totalReferrerFees: bigint;
}

export function storeCurveState(src: CurveState) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.factory);
        b_0.storeAddress(src.creator);
        b_0.storeUint(src.salt, 64);
        b_0.storeAddress(src.treasury);
        const b_1 = new Builder();
        b_1.storeAddress(src.liquidityManager);
        b_1.store(storeDexConfig(src.dex));
        b_1.storeBit(src.initialized);
        b_1.storeCoins(src.virtualTon);
        const b_2 = new Builder();
        b_2.storeCoins(src.virtualTokens);
        b_2.storeCoins(src.realTonRaised);
        b_2.storeCoins(src.totalSupply);
        b_2.storeBit(src.graduated);
        b_2.storeBit(src.migrated);
        b_2.storeCoins(src.graduationTarget);
        b_2.storeCoins(src.totalCreatorFees);
        b_2.storeCoins(src.totalPlatformFees);
        b_2.storeUint(src.tradeCount, 32);
        const b_3 = new Builder();
        b_3.storeInt(src.progressBps, 257);
        b_3.storeCoins(src.totalReferrerFees);
        b_2.storeRef(b_3.endCell());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCurveState(slice: Slice) {
    const sc_0 = slice;
    const _factory = sc_0.loadAddress();
    const _creator = sc_0.loadAddress();
    const _salt = sc_0.loadUintBig(64);
    const _treasury = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _liquidityManager = sc_1.loadAddress();
    const _dex = loadDexConfig(sc_1);
    const _initialized = sc_1.loadBit();
    const _virtualTon = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _virtualTokens = sc_2.loadCoins();
    const _realTonRaised = sc_2.loadCoins();
    const _totalSupply = sc_2.loadCoins();
    const _graduated = sc_2.loadBit();
    const _migrated = sc_2.loadBit();
    const _graduationTarget = sc_2.loadCoins();
    const _totalCreatorFees = sc_2.loadCoins();
    const _totalPlatformFees = sc_2.loadCoins();
    const _tradeCount = sc_2.loadUintBig(32);
    const sc_3 = sc_2.loadRef().beginParse();
    const _progressBps = sc_3.loadIntBig(257);
    const _totalReferrerFees = sc_3.loadCoins();
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps, totalReferrerFees: _totalReferrerFees };
}

export function loadTupleCurveState(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadTupleDexConfig(source);
    const _initialized = source.readBoolean();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _totalSupply = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    const _graduationTarget = source.readBigNumber();
    source = source.readTuple();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    const _progressBps = source.readBigNumber();
    const _totalReferrerFees = source.readBigNumber();
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps, totalReferrerFees: _totalReferrerFees };
}

export function loadGetterTupleCurveState(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadGetterTupleDexConfig(source);
    const _initialized = source.readBoolean();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _totalSupply = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    const _graduationTarget = source.readBigNumber();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    const _progressBps = source.readBigNumber();
    const _totalReferrerFees = source.readBigNumber();
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps, totalReferrerFees: _totalReferrerFees };
}

export function storeTupleCurveState(source: CurveState) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.factory);
    builder.writeAddress(source.creator);
    builder.writeNumber(source.salt);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeTuple(storeTupleDexConfig(source.dex));
    builder.writeBoolean(source.initialized);
    builder.writeNumber(source.virtualTon);
    builder.writeNumber(source.virtualTokens);
    builder.writeNumber(source.realTonRaised);
    builder.writeNumber(source.totalSupply);
    builder.writeBoolean(source.graduated);
    builder.writeBoolean(source.migrated);
    builder.writeNumber(source.graduationTarget);
    builder.writeNumber(source.totalCreatorFees);
    builder.writeNumber(source.totalPlatformFees);
    builder.writeNumber(source.tradeCount);
    builder.writeNumber(source.progressBps);
    builder.writeNumber(source.totalReferrerFees);
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

export type FactoryInfo = {
    $$type: 'FactoryInfo';
    owner: Address;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
    launchCount: bigint;
    launchFee: bigint;
    graduationTarget: bigint;
    tradeFeeBps: bigint;
    creatorFeeBps: bigint;
    referrerFeeBps: bigint;
}

export function storeFactoryInfo(src: FactoryInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        const b_1 = new Builder();
        b_1.store(storeDexConfig(src.dex));
        b_1.storeUint(src.launchCount, 32);
        b_1.storeCoins(src.launchFee);
        b_1.storeCoins(src.graduationTarget);
        const b_2 = new Builder();
        b_2.storeInt(src.tradeFeeBps, 257);
        b_2.storeInt(src.creatorFeeBps, 257);
        b_2.storeInt(src.referrerFeeBps, 257);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadFactoryInfo(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _dex = loadDexConfig(sc_1);
    const _launchCount = sc_1.loadUintBig(32);
    const _launchFee = sc_1.loadCoins();
    const _graduationTarget = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _tradeFeeBps = sc_2.loadIntBig(257);
    const _creatorFeeBps = sc_2.loadIntBig(257);
    const _referrerFeeBps = sc_2.loadIntBig(257);
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps, referrerFeeBps: _referrerFeeBps };
}

export function loadTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadTupleDexConfig(source);
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    const _creatorFeeBps = source.readBigNumber();
    const _referrerFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps, referrerFeeBps: _referrerFeeBps };
}

export function loadGetterTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadGetterTupleDexConfig(source);
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    const _creatorFeeBps = source.readBigNumber();
    const _referrerFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps, referrerFeeBps: _referrerFeeBps };
}

export function storeTupleFactoryInfo(source: FactoryInfo) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeTuple(storeTupleDexConfig(source.dex));
    builder.writeNumber(source.launchCount);
    builder.writeNumber(source.launchFee);
    builder.writeNumber(source.graduationTarget);
    builder.writeNumber(source.tradeFeeBps);
    builder.writeNumber(source.creatorFeeBps);
    builder.writeNumber(source.referrerFeeBps);
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

export type JettonWallet$Data = {
    $$type: 'JettonWallet$Data';
    balance: bigint;
    owner: Address;
    minter: Address;
}

export function storeJettonWallet$Data(src: JettonWallet$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.minter);
    };
}

export function loadJettonWallet$Data(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _minter = sc_0.loadAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, minter: _minter };
}

export function loadTupleJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _minter = source.readAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, minter: _minter };
}

export function loadGetterTupleJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _minter = source.readAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, minter: _minter };
}

export function storeTupleJettonWallet$Data(source: JettonWallet$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.minter);
    return builder.build();
}

export function dictValueParserJettonWallet$Data(): DictionaryValue<JettonWallet$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonWallet$Data(src)).endCell());
        },
        parse: (src) => {
            return loadJettonWallet$Data(src.loadRef().beginParse());
        }
    }
}

export type LaunchpadJetton$Data = {
    $$type: 'LaunchpadJetton$Data';
    factory: Address;
    creator: Address;
    salt: bigint;
    initialized: boolean;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
    content: Cell;
    totalSupply: bigint;
    virtualTon: bigint;
    virtualTokens: bigint;
    realTonRaised: bigint;
    graduated: boolean;
    migrated: boolean;
    totalCreatorFees: bigint;
    totalPlatformFees: bigint;
    tradeCount: bigint;
    totalReferrerFees: bigint;
}

export function storeLaunchpadJetton$Data(src: LaunchpadJetton$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.factory);
        b_0.storeAddress(src.creator);
        b_0.storeUint(src.salt, 64);
        b_0.storeBit(src.initialized);
        b_0.storeAddress(src.treasury);
        const b_1 = new Builder();
        b_1.storeAddress(src.liquidityManager);
        b_1.store(storeDexConfig(src.dex));
        b_1.storeRef(src.content);
        b_1.storeCoins(src.totalSupply);
        const b_2 = new Builder();
        b_2.storeCoins(src.virtualTon);
        b_2.storeCoins(src.virtualTokens);
        b_2.storeCoins(src.realTonRaised);
        b_2.storeBit(src.graduated);
        b_2.storeBit(src.migrated);
        b_2.storeCoins(src.totalCreatorFees);
        b_2.storeCoins(src.totalPlatformFees);
        b_2.storeUint(src.tradeCount, 32);
        b_2.storeCoins(src.totalReferrerFees);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadLaunchpadJetton$Data(slice: Slice) {
    const sc_0 = slice;
    const _factory = sc_0.loadAddress();
    const _creator = sc_0.loadAddress();
    const _salt = sc_0.loadUintBig(64);
    const _initialized = sc_0.loadBit();
    const _treasury = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _liquidityManager = sc_1.loadAddress();
    const _dex = loadDexConfig(sc_1);
    const _content = sc_1.loadRef();
    const _totalSupply = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _virtualTon = sc_2.loadCoins();
    const _virtualTokens = sc_2.loadCoins();
    const _realTonRaised = sc_2.loadCoins();
    const _graduated = sc_2.loadBit();
    const _migrated = sc_2.loadBit();
    const _totalCreatorFees = sc_2.loadCoins();
    const _totalPlatformFees = sc_2.loadCoins();
    const _tradeCount = sc_2.loadUintBig(32);
    const _totalReferrerFees = sc_2.loadCoins();
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, totalReferrerFees: _totalReferrerFees };
}

export function loadTupleLaunchpadJetton$Data(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialized = source.readBoolean();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadTupleDexConfig(source);
    const _content = source.readCell();
    const _totalSupply = source.readBigNumber();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    source = source.readTuple();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    const _totalReferrerFees = source.readBigNumber();
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, totalReferrerFees: _totalReferrerFees };
}

export function loadGetterTupleLaunchpadJetton$Data(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialized = source.readBoolean();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadGetterTupleDexConfig(source);
    const _content = source.readCell();
    const _totalSupply = source.readBigNumber();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    const _totalCreatorFees = source.readBigNumber();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    const _totalReferrerFees = source.readBigNumber();
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, totalReferrerFees: _totalReferrerFees };
}

export function storeTupleLaunchpadJetton$Data(source: LaunchpadJetton$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.factory);
    builder.writeAddress(source.creator);
    builder.writeNumber(source.salt);
    builder.writeBoolean(source.initialized);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeTuple(storeTupleDexConfig(source.dex));
    builder.writeCell(source.content);
    builder.writeNumber(source.totalSupply);
    builder.writeNumber(source.virtualTon);
    builder.writeNumber(source.virtualTokens);
    builder.writeNumber(source.realTonRaised);
    builder.writeBoolean(source.graduated);
    builder.writeBoolean(source.migrated);
    builder.writeNumber(source.totalCreatorFees);
    builder.writeNumber(source.totalPlatformFees);
    builder.writeNumber(source.tradeCount);
    builder.writeNumber(source.totalReferrerFees);
    return builder.build();
}

export function dictValueParserLaunchpadJetton$Data(): DictionaryValue<LaunchpadJetton$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLaunchpadJetton$Data(src)).endCell());
        },
        parse: (src) => {
            return loadLaunchpadJetton$Data(src.loadRef().beginParse());
        }
    }
}

export type LaunchpadFactory$Data = {
    $$type: 'LaunchpadFactory$Data';
    owner: Address;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
    launchCount: bigint;
}

export function storeLaunchpadFactory$Data(src: LaunchpadFactory$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        const b_1 = new Builder();
        b_1.store(storeDexConfig(src.dex));
        b_1.storeUint(src.launchCount, 32);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadLaunchpadFactory$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _dex = loadDexConfig(sc_1);
    const _launchCount = sc_1.loadUintBig(32);
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount };
}

export function loadTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadTupleDexConfig(source);
    const _launchCount = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount };
}

export function loadGetterTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _dex = loadGetterTupleDexConfig(source);
    const _launchCount = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, dex: _dex, launchCount: _launchCount };
}

export function storeTupleLaunchpadFactory$Data(source: LaunchpadFactory$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeTuple(storeTupleDexConfig(source.dex));
    builder.writeNumber(source.launchCount);
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

 type LaunchpadFactory_init_args = {
    $$type: 'LaunchpadFactory_init_args';
    owner: Address;
    treasury: Address;
    liquidityManager: Address;
    dex: DexConfig;
}

function initLaunchpadFactory_init_args(src: LaunchpadFactory_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        const b_1 = new Builder();
        b_1.store(storeDexConfig(src.dex));
        b_0.storeRef(b_1.endCell());
    };
}

async function LaunchpadFactory_init(owner: Address, treasury: Address, liquidityManager: Address, dex: DexConfig) {
    const __code = Cell.fromHex('b5ee9c7241026801001c8f000228ff008e88f4a413f4bcf2c80bed5320e303ed43d90106020378e00204018dbb877ed44d0d200018e1bfa40fa40fa40d401d0fa40fa405902d31f30103610351034126c168e1afa40fa40fa40d401d0fa40fa40593210251024430005d1550370e2db3c6c6b8030044820afaf08082195d3ef798008100c88117708107d02a515a515a515a515a515a55400191b8e60ed44d0d200018e1bfa40fa40fa40d401d0fa40fa405902d31f30103610351034126c168e1afa40fa40fa40d401d0fa40fa40593210251024430005d1550370e25515db3c6c618050164f82859db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d00903f83001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e1bfa40fa40fa40d401d0fa40fa405902d31f30103610351034126c168e1afa40fa40fa40d401d0fa40fa40593210251024430005d1550370e207e3027026d74920c21f953106d31f07de2182104c500001bae302372082104c500005ba070864007a058020d7217021d749c21f9430d31f309131e282104c500002ba8e1e10355512c87f01ca0055505056ce13cecec8400302cece12cb1fcdc9ed54e05f0602fe5b05d33fd33fd4fa0030f8416f243032812a6623c000917f97238208989680bee2f2f48200b5de238218174876e800bbf2f4817694820afaf08024a0821008f0d180a013be12f2f40aa4f82840b4db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0700962012488c87001ca0055215023cece810101cf00c90a022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d90b190202710c0e03bfbedc1f6a268690000c75afd207d20408080eb802a9001e8ac11382a3a224438410c037e11d600411806f05b59d3b200001138382a391110078889078877886f718688890889888908888889088888880888888807888807aa876d9e3662363a41a1b0d0104db3c380201200f170201201015020158111303c3adbcf6a268690000c75afd207d20408080eb802a9001e8ac11382a3a224438410c037e11d600411806f05b59d3b200001138382a391110078889078877886f718688890889888908888889088888880888888807888807aa876d9e2b882f87b618c01a1b120162f828db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d04d038faf16f6a268690000c75afd207d20408080eb802a9001e8ac11382a3a224438410c037e11d600411806f05b59d3b200001138382a391110078889078877886f7186ed9e367ab622c01a1b14011e24b36df828f828db3c302c552052e04d03bfb6987da89a1a400031d6bf481f481020203ae00aa4007a2b044e0a8e88910e104300df847580104601bc16d674ec8000044e0e0a8e444401e22241e21de21bdc61a2224222622242222222422222220222222201e22201eaa1db678d988d8e901a1b160104db3c2a03e7ba48ced44d0d200018eb5fa40fa40810101d700552003d15822705474448870821806fc23ac0082300de0b6b3a7640000227070547222200f11120f10ef10dee30ddb3c5714571457145714571457145714571457145714571457145714571457145714571457145714111311121111111055e081a1b18008e82195d3ef798008127105380a822a904b608561402561402561402561302561302561302561302561802561202561202561202561602561302561302561301561301561301561304d401d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018eb5fa40fa40810101d700552003d15822705474448870821806fc23ac0082300de0b6b3a7640000227070547222200f11120f10ef10dee30d1114e3021112d70d1ff2e0822182104c500002ba1a1b1c1f000000acfa40fa40d33fd200fa40d401d0fa40fa40fa405902d4fa00d430d0fa00fa00fa00d200d200fa00fa00d31ffa00300e11130e0e11120e0e11110e0e11100e10ef10bc57131111111211111110111111100f11100f550e03f011128020d7217021d749c21f953020d70b1fde8210178d4519bae30230228ec7820afaf08070fb0270830670882f553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00de1110111211100f11110f0e11100e551d1d1e6002d28020d721d33ffa005932248ec91112111411121111111311111110111211100f11110f0e11100e8040702f11120f11110f0e11100e10df10ce10bd10ac109b108a107910681057065530db3c111201111101111055d1915be21110111211100f11110f0e11100e551d3360004c0000000047726164756174696f6e206c6971756964697479202844455820626f756e63656429043ce3022182104c500003bae3022182107bdd97debae3022182104c500004ba2027354203fc31d33ffa40fa40d430d0fa40fa405902d4fa00fa0030f8416f245b812e0c32561ac705f2f456158f525f0870804270885613553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001110111211100f11110f0e11100e551de057102160220052000000004c61756e636820726566756e6465643a20746f6b656e20616c72656164792065786973747302fc571057105710571057107f22561356132ec8553082104c5001015005cb1f13cb3fcecb3f01fa02c9c88258c000000000000000000000000101cb67ccc970fb0071708824041110552010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c9012324001c000000004c61756e63682066656504fcfb002ac2008f37111211141112706d561311161113111511130e11140e0311130311101111111010ce10bd10ac109b108a1079106810570610355044db3ce03a820afaf08070fb027083067003c8018210d53276db58cb1fcb3fc95613504410246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb08a2960252600065bcf8101e48ae2f400c901fb001110111211100f11110f0e11100e109f108e10bc5517c87f01ca00111311121111111055e0011112011113ce01111001ce1ecb3f1cca001ace08c8ce407602cece13cc01fa02c858fa0258fa0258fa0213ca0013ca005003fa025003fa0213cb1f5003fa02cdcdc9ed544001fc31d33ffa00fa00d72c01916d93fa4001e231f8416f243032811de95614f2f48200e4232ab3f2f48200e7eb258208989680bef2f481769425821005f5e100a013be12f2f41115111711151114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10792801b8106810575044db3cc87f01ca00111311121111111055e0011112011113ce01111001ce1ecb3f1cca001ace08c8ce407602cece13cc01fa02c858fa0258fa0258fa0213ca0013ca005003fa025003fa0213cb1f5003fa02cdcdc9ed542904f61112111711121111111611111110111511100f11140f0e11130e0d11170d0c11160c0b11150b0a11140a09111309081117080711160706111506051114050411130403111703021116020111150111145617db3c8200e7eb24c200f2f4238200a239111cbe01111b01f2f47056186eb39170e30de300111a561aa12a2b2c2d004a208100c8812710a98620811770a8812710a9045121a152b0a0546bb0a98652a0a15312a11300185618206ef2d0805618c705b3002c30218107d0a8812710a90420820807a120be923070df01fa561b5003a151cca051b3a150aca051c2a05169a05151a0035619a004a42c82195d3ef79800be8e30387f56182dc85982104c5001035003cb1fcb3f01fa02c9c88258c000000000000000000000000101cb67ccc970fb0008de2c820afaf080a070fb021112111511121111111411111110111311100f11150f0e11140e2e03fa0d11130d0c11150c0b11140b0a11130a10690811130807111407061115060511130504111404031113030211130201111456155615db3c5619c2009457175718e30d7f5617045616431402111b0256140201111701111628c8557082104c5001025009cb1f17cb3f15ce13ca0001fa0201fa0201fa0201fa0201fa02c93a2f3202d45617206ef2d080717088561d552010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001117206ef2d080561802561701111bc8553082104c5001055005cb1f13cb3fcece01fa02c93031002000000000526566657272616c206665650030c88258c000000000000000000000000101cb67ccc970fb000188c88258c000000000000000000000000101cb67ccc970fb000d11150d0c11140c0b11130b0a11120a0911110908111008107f106e105d104c103b4a18439658830670db3c3302f4f8285250db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d07ff8287070c8ca00c9d01059104a1023102bc855508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec910565e22401310465522c8cf85804d340058ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0003fe31d33ffa00fa40d72c01916d93fa4001e201f40430f8416f243032f8285250db3c0181114d02705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d012c705f2f4216ee302328200e42329b3f2f481769402820afaf080be12f2f4206ef2d080d08200bd1401d31f4d363701ec5b8108ff28f2f450b2a1216eb3963a206ef2d080923109e27080427004c8018210d53276db58cb1fcb3fc91034413010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001110111211100f11110f0e11100e551d6002fc01821053454c4cba12f2f4fa00301112111411121111111311111110111411100f11130f0e11140e0d11130d0c11140c0b11130b0a11140a09111309081114080711130706111406051113050411140403111303021114020111150111165614db3c5233a08200e7eb24c200f2f4813fc3531bbbf2f4038200a239111bbe3839004a5280a0546990a9865290a1208100c8812710a98620811770a8812710a9045121a15312a11302fa01111a01f2f451a1a1095616a05181a10b5616a1055618a0514aa003a42b820afaf080a070fb021112111411121111111311111110111411100f11130f0e11140e0d11130d0c11140c0b11130b0a11140a1059105810570611130604111304031113030211130201111356185615db3c041115047056185045031115033a3e029e21c2008ec071708856160405552010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009131e220c2009130e30d3b3c001e0000000043726561746f7220666565017c7170885612553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb003d002000000000506c6174666f726d2066656503fe0211180201111a01111628c8557082104c5001025009cb1f17cb3f15ce13ca0001fa0201fa0201fa0201fa0201fa02c9c88258c000000000000000000000000101cb67ccc970fb0070830670880411160410246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c901fb000c11120c3f404100220000000053656c6c2070726f6365656473001a58cf8680cf8480f400f400cf8100d40b11110b0a11100a109f108e107d106c555510344013c87f01ca00111311121111111055e0011112011113ce01111001ce1ecb3f1cca001ace08c8ce407602cece13cc01fa02c858fa0258fa0258fa0213ca0013ca005003fa025003fa0213cb1f5003fa02cdcdc9ed5404f68ff731d33f30f8416f2430328200f49227f2f48151db06b316f2f481769401820afaf080bef2f405821026be3680a15306db3c7f705450caa05479f453d6c8554082104c5001045006cb1f14cb3f12ce01fa0201fa0201fa02c9c88258c000000000000000000000000101cb67ccc970fb00f828561001db3ce021434d454b0118a8db3c8126aca8812710a90444005620c101923070e02020f285b603a5ab00a4ae5ca9045210a0ab00935301b999315ca9045210a0ab00e8303102fe705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0f823810384a0820afaf08024fb02f828561201db3c821011e1a300717ff82856191111111e11111110111d11100f111c0f0e111b0e0d111a0d0c11190c0b11180b82100e01d0c056180c0b11180b0a11180a4d4602fc0911160908111708070611200605111a0504111e0403111d0302112102011122011119561b5617db3c7fc8ca00ccc9d05614050411160403111e0302112202112301c855508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec956140605111d050411170403111b0312011114011116494701fe10465522c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00225613821011e1a300a08208989680a00b11130b0a11120a0911110908111008107f106e105d104c103b102a08111808102706111606102504111a041023021115020111190111187111164802ec7f1118db3c7fc88209f3835d01cb1f561c01cb3f011116fa022fcf1601111501ca0001111401ccc90411180403111703021114020111150110246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00708306701117c8494a00a26dc85003fa028d0860000000000000000000000000000000000000000000000000000000000000000004cf167101cb0070fa0212f400c9c8821037c096df01cb1f5003cf165610cf165611cf16cb3fccc901c6018210d53276db58cb1fcb3fc90411140441300111170110246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000b11120b0a11110a09111009108f107e55661655046002fa8210d53276dbba8e655b1110111211100f11110f0e11100e551dc87f01ca00111311121111111055e0011112011113ce01111001ce1ecb3f1cca001ace08c8ce407602cece13cc01fa02c858fa0258fa0258fa0213ca0013ca005003fa025003fa0213cb1f5003fa02cdcdc9ed54e00182102c76b973bae3025f0f5f054c6102f2d33ffa40d2003021fa44306d018eb430f8285220db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0dff842708040700596c85006cf16c992356de24630c855208210d17354005004cb1f12cb3f01206e9430cf84809201cee2f400c943304d5f011688c87001ca005a02cecec94e022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d94f510149a65ec0bb513434800066be803e903e9015481b04e6be903e901640b4405c1678b6cf1b0d205001125cdb3c3054633052305704b401d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e204e30202d70d1ff2e0822182100f8a7ea5bae302218210178d4519bae302018210595f07bcba5253565b00b6028020d7217021d749c21f9430d31f01de208210178d4519ba8e1a30d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e082107bdd97deba8e19d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e05f0402f231d33ffa00fa40d72c01916d93fa4001e201f40431fa0023fa4430f2d08af8416f2481114d533cc705f2f48142a629c200f2f451a8a18200ca9721c2fff2f44330523bfa40fa0071d721fa00fa00306c6170f83a23c20091729171e281769402a85240a08209c9c380a08208989680a012bcf2f45138db3c5c575401fe705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d050767080407f2c48135079c855508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec9105610451034401310465522c8cf8580ca00cf8440ce01fa028069cf40025c6e015500586eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed5404fc31d33ffa00fa40d72c01916d93fa4001e201fa00f8416f24532cc705b38ebc537cdb3c0181114d02705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d05240c705f2f4de51a8a021f8276f1021a1820898968066b608a18208e4e1c0a0a126c200e30f236eb35758595a0018f82ac87001ca005a02cecec900e8504b4330fa40fa0071d721fa00fa00306c6170f83a5230a018a171702848135074c8553082107362d09c5005cb1f13cb3f01fa02cecec9284614505510246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0003000c107b50895f0800dc9321c2009170e28e5003206ef2d080727004c8018210d53276db58cb1fcb3fc9414010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00926c31e202c87f01ca0055205afa0212cecec9ed54010ee3025f04f2c0825c01fed33ffa00d72c01916d93fa4001e201f40430f8416f24303281114d5118c705f2f48142a624c200f2f45153a18200ca9721c2fff2f4817694068210042c1d80be16f2f470504380407f544857c8554082107bdd97de5006cb1f14cb3f58fa02ce01206e9430cf84809201cee2f400c926444410246d50436d03c8cf8580ca005d017689cf16ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed545e000110018e10246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001110111211100f11110f0e11100e551d6000a8c87f01ca00111311121111111055e0011112011113ce01111001ce1ecb3f1cca001ace08c8ce407602cece13cc01fa02c858fa0258fa0258fa0213ca0013ca005003fa025003fa0213cb1f5003fa02cdcdc9ed540006f2c08201ea0680407f820afaf0802c513c513c0356114b130cc8557082104c5000025009cb1f17cb3f15ce13cec8400302cece12cc58fa0258fa02cdc9506215141310465522c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010355512630034c87f01ca0055505056ce13cecec8400302cece12cb1fcdc9ed5403fc8ef2303582008aabf84225c705f2f4820afaf08070fb02708306708827553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010355512c87f01ca0055505056ce13cecec8400302cece12cb1fcdc9ed54e0c00006c12116b0e302656667002800000000466163746f7279207769746864726177003c10355512c87f01ca0055505056ce13cecec8400302cece12cb1fcdc9ed54000a5f06f2c0827fcc0bfe');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initLaunchpadFactory_init_args({ $$type: 'LaunchpadFactory_init_args', owner, treasury, liquidityManager, dex })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const LaunchpadFactory_errors = {
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
    2303: { message: "Sell through the curve" },
    4429: { message: "Invalid sender" },
    7657: { message: "Not initialized" },
    10854: { message: "Initial buy too small" },
    11788: { message: "Only factory" },
    16323: { message: "Insufficient reserve" },
    17062: { message: "Invalid amount" },
    20955: { message: "Already migrated" },
    30356: { message: "Insufficient TON attached" },
    35499: { message: "Only owner" },
    41529: { message: "Slippage exceeded" },
    46558: { message: "Initial buy too large" },
    48404: { message: "Unknown burn payload" },
    51863: { message: "Insufficient jetton balance" },
    58403: { message: "Curve graduated" },
    59371: { message: "Trade too small" },
    62610: { message: "Not graduated" },
} as const

export const LaunchpadFactory_errors_backward = {
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
    "Sell through the curve": 2303,
    "Invalid sender": 4429,
    "Not initialized": 7657,
    "Initial buy too small": 10854,
    "Only factory": 11788,
    "Insufficient reserve": 16323,
    "Invalid amount": 17062,
    "Already migrated": 20955,
    "Insufficient TON attached": 30356,
    "Only owner": 35499,
    "Slippage exceeded": 41529,
    "Initial buy too large": 46558,
    "Unknown burn payload": 48404,
    "Insufficient jetton balance": 51863,
    "Curve graduated": 58403,
    "Trade too small": 59371,
    "Not graduated": 62610,
} as const

const LaunchpadFactory_types: ABIType[] = [
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
    {"name":"JettonTransfer","header":260734629,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonTransferInternal","header":395134233,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonNotification","header":1935855772,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonBurn","header":1499400124,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"JettonBurnNotification","header":2078119902,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"JettonExcesses","header":3576854235,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"ProvideWalletAddress","header":745978227,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"ownerAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"includeAddress","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"TakeWalletAddress","header":3513996288,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"walletAddress","type":{"kind":"simple","type":"address","optional":true}},{"name":"ownerAddress","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"CreateToken","header":1280311297,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"JettonSetup","header":1280311298,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"dex","type":{"kind":"simple","type":"DexConfig","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Buy","header":1280311299,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"tonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minTokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"referrer","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"DexConfig","header":null,"fields":[{"name":"router","type":{"kind":"simple","type":"address","optional":false}},{"name":"ptonWallet","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Migrate","header":1280311300,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryWithdraw","header":1280311301,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"TokenLaunched","header":1280311553,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"TradeEvent","header":1280311554,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"trader","type":{"kind":"simple","type":"address","optional":false}},{"name":"isBuy","type":{"kind":"simple","type":"bool","optional":false}},{"name":"tonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"ReferralPaidEvent","header":1280311557,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"referrer","type":{"kind":"simple","type":"address","optional":false}},{"name":"trader","type":{"kind":"simple","type":"address","optional":false}},{"name":"referrerFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"GraduatedEvent","header":1280311555,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"MigratedEvent","header":1280311556,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"router","type":{"kind":"simple","type":"address","optional":false}},{"name":"tonLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minLpOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"JettonData","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"adminAddress","type":{"kind":"simple","type":"address","optional":true}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"walletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"JettonWalletData","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"minter","type":{"kind":"simple","type":"address","optional":false}},{"name":"code","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"CurveState","header":null,"fields":[{"name":"factory","type":{"kind":"simple","type":"address","optional":false}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"dex","type":{"kind":"simple","type":"DexConfig","optional":false}},{"name":"initialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"migrated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"progressBps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalReferrerFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"QuoteBuy","header":null,"fields":[{"name":"tokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"QuoteSell","header":null,"fields":[{"name":"tonOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"FactoryInfo","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"dex","type":{"kind":"simple","type":"DexConfig","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"creatorFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"referrerFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"JettonWallet$Data","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"minter","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"LaunchpadJetton$Data","header":null,"fields":[{"name":"factory","type":{"kind":"simple","type":"address","optional":false}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"initialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"dex","type":{"kind":"simple","type":"DexConfig","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"migrated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalReferrerFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"LaunchpadFactory$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"dex","type":{"kind":"simple","type":"DexConfig","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
]

const LaunchpadFactory_opcodes = {
    "JettonTransfer": 260734629,
    "JettonTransferInternal": 395134233,
    "JettonNotification": 1935855772,
    "JettonBurn": 1499400124,
    "JettonBurnNotification": 2078119902,
    "JettonExcesses": 3576854235,
    "ProvideWalletAddress": 745978227,
    "TakeWalletAddress": 3513996288,
    "CreateToken": 1280311297,
    "JettonSetup": 1280311298,
    "Buy": 1280311299,
    "Migrate": 1280311300,
    "FactoryWithdraw": 1280311301,
    "TokenLaunched": 1280311553,
    "TradeEvent": 1280311554,
    "ReferralPaidEvent": 1280311557,
    "GraduatedEvent": 1280311555,
    "MigratedEvent": 1280311556,
}

const LaunchpadFactory_getters: ABIGetter[] = [
    {"name":"get_factory_info","methodId":112759,"arguments":[],"returnType":{"kind":"simple","type":"FactoryInfo","optional":false}},
    {"name":"get_jetton_address","methodId":118368,"arguments":[{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const LaunchpadFactory_getterMapping: { [key: string]: string } = {
    'get_factory_info': 'getGetFactoryInfo',
    'get_jetton_address': 'getGetJettonAddress',
}

const LaunchpadFactory_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CreateToken"}},
    {"receiver":"internal","message":{"kind":"typed","type":"FactoryWithdraw"}},
]

export const TOKEN_DECIMALS = 9n;
export const TOTAL_SUPPLY_NANO = 1000000000000000000n;
export const LAUNCH_FEE = 50000000n;
export const GRADUATION_TARGET = 1500000000000n;
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;
export const BPS = 10000n;
export const REFERRER_FEE_BPS = 2000n;
export const REFERRAL_DUST = 500000n;
export const VIRTUAL_TON = 30000000000n;
export const VIRTUAL_TOKENS = 1000000000000000000n;
export const MIN_TRADE = 10000000n;
export const MAX_INITIAL_BUY = 100000000000n;
export const CREATE_GAS = 150000000n;
export const BUY_GAS = 100000000n;
export const SELL_GAS = 50000000n;
export const MIGRATE_GAS = 50000000n;
export const MINTER_MIN_STORAGE = 50000000n;
export const WALLET_MIN_STORAGE = 10000000n;
export const WALLET_GAS = 15000000n;
export const BURN_MIN_VALUE = 70000000n;
export const STON_PROVIDE_LP_OP = 935368415n;
export const PTON_TON_TRANSFER_OP = 32736093n;
export const DEX_JETTON_SIDE_VALUE = 300000000n;
export const DEX_JETTON_SIDE_FWD = 235000000n;
export const DEX_TON_SIDE_FWD = 300000000n;
export const DEX_PTON_GAS = 10000000n;
export const DEX_MIGRATION_COST = 650000000n;
export const DEX_DEADLINE = 900n;
export const LP_MIN_OUT_BPS = 9900n;
export const SELL_PAYLOAD_OP = 1397050444n;

export class LaunchpadFactory implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = LaunchpadFactory_errors_backward;
    public static readonly opcodes = LaunchpadFactory_opcodes;
    
    static async init(owner: Address, treasury: Address, liquidityManager: Address, dex: DexConfig) {
        return await LaunchpadFactory_init(owner, treasury, liquidityManager, dex);
    }
    
    static async fromInit(owner: Address, treasury: Address, liquidityManager: Address, dex: DexConfig) {
        const __gen_init = await LaunchpadFactory_init(owner, treasury, liquidityManager, dex);
        const address = contractAddress(0, __gen_init);
        return new LaunchpadFactory(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new LaunchpadFactory(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  LaunchpadFactory_types,
        getters: LaunchpadFactory_getters,
        receivers: LaunchpadFactory_receivers,
        errors: LaunchpadFactory_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: null | CreateToken | FactoryWithdraw) {
        
        let body: Cell | null = null;
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CreateToken') {
            body = beginCell().store(storeCreateToken(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'FactoryWithdraw') {
            body = beginCell().store(storeFactoryWithdraw(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetFactoryInfo(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_factory_info', builder.build())).stack;
        const result = loadGetterTupleFactoryInfo(source);
        return result;
    }
    
    async getGetJettonAddress(provider: ContractProvider, creator: Address, salt: bigint) {
        const builder = new TupleBuilder();
        builder.writeAddress(creator);
        builder.writeNumber(salt);
        const source = (await provider.get('get_jetton_address', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}