// @ts-nocheck
// GENERATED from contracts/build by contracts/scripts/sync-wrappers.mjs. Do not edit.
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
        b_0.storeRef(src.content);
        b_0.storeCoins(src.launchFee);
        b_0.storeCoins(src.initialBuyTon);
    };
}

export function loadJettonSetup(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311298) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _launchFee = sc_0.loadCoins();
    const _initialBuyTon = sc_0.loadCoins();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function loadTupleJettonSetup(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _content = source.readCell();
    const _launchFee = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function loadGetterTupleJettonSetup(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _content = source.readCell();
    const _launchFee = source.readBigNumber();
    const _initialBuyTon = source.readBigNumber();
    return { $$type: 'JettonSetup' as const, queryId: _queryId, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, launchFee: _launchFee, initialBuyTon: _initialBuyTon };
}

export function storeTupleJettonSetup(source: JettonSetup) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
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
}

export function storeBuy(src: Buy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311299, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.tonAmount);
        b_0.storeCoins(src.minTokensOut);
    };
}

export function loadBuy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311299) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _tonAmount = sc_0.loadCoins();
    const _minTokensOut = sc_0.loadCoins();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut };
}

export function loadTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonAmount = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut };
}

export function loadGetterTupleBuy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _tonAmount = source.readBigNumber();
    const _minTokensOut = source.readBigNumber();
    return { $$type: 'Buy' as const, queryId: _queryId, tonAmount: _tonAmount, minTokensOut: _minTokensOut };
}

export function storeTupleBuy(source: Buy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.tonAmount);
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
    liquidityManager: Address;
    tonLiquidity: bigint;
    tokenLiquidity: bigint;
}

export function storeMigratedEvent(src: MigratedEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1280311556, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.liquidityManager);
        b_0.storeCoins(src.tonLiquidity);
        b_0.storeCoins(src.tokenLiquidity);
    };
}

export function loadMigratedEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1280311556) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _liquidityManager = sc_0.loadAddress();
    const _tonLiquidity = sc_0.loadCoins();
    const _tokenLiquidity = sc_0.loadCoins();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, liquidityManager: _liquidityManager, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function loadTupleMigratedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _liquidityManager = source.readAddress();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, liquidityManager: _liquidityManager, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function loadGetterTupleMigratedEvent(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _liquidityManager = source.readAddress();
    const _tonLiquidity = source.readBigNumber();
    const _tokenLiquidity = source.readBigNumber();
    return { $$type: 'MigratedEvent' as const, queryId: _queryId, liquidityManager: _liquidityManager, tonLiquidity: _tonLiquidity, tokenLiquidity: _tokenLiquidity };
}

export function storeTupleMigratedEvent(source: MigratedEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.liquidityManager);
    builder.writeNumber(source.tonLiquidity);
    builder.writeNumber(source.tokenLiquidity);
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
        b_1.storeBit(src.initialized);
        b_1.storeCoins(src.virtualTon);
        b_1.storeCoins(src.virtualTokens);
        b_1.storeCoins(src.realTonRaised);
        b_1.storeCoins(src.totalSupply);
        b_1.storeBit(src.graduated);
        b_1.storeBit(src.migrated);
        b_1.storeCoins(src.graduationTarget);
        b_1.storeCoins(src.totalCreatorFees);
        const b_2 = new Builder();
        b_2.storeCoins(src.totalPlatformFees);
        b_2.storeUint(src.tradeCount, 32);
        b_2.storeInt(src.progressBps, 257);
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
    const _initialized = sc_1.loadBit();
    const _virtualTon = sc_1.loadCoins();
    const _virtualTokens = sc_1.loadCoins();
    const _realTonRaised = sc_1.loadCoins();
    const _totalSupply = sc_1.loadCoins();
    const _graduated = sc_1.loadBit();
    const _migrated = sc_1.loadBit();
    const _graduationTarget = sc_1.loadCoins();
    const _totalCreatorFees = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _totalPlatformFees = sc_2.loadCoins();
    const _tradeCount = sc_2.loadUintBig(32);
    const _progressBps = sc_2.loadIntBig(257);
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps };
}

export function loadTupleCurveState(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _initialized = source.readBoolean();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _totalSupply = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    const _graduationTarget = source.readBigNumber();
    const _totalCreatorFees = source.readBigNumber();
    source = source.readTuple();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    const _progressBps = source.readBigNumber();
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps };
}

export function loadGetterTupleCurveState(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
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
    return { $$type: 'CurveState' as const, factory: _factory, creator: _creator, salt: _salt, treasury: _treasury, liquidityManager: _liquidityManager, initialized: _initialized, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, totalSupply: _totalSupply, graduated: _graduated, migrated: _migrated, graduationTarget: _graduationTarget, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount, progressBps: _progressBps };
}

export function storeTupleCurveState(source: CurveState) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.factory);
    builder.writeAddress(source.creator);
    builder.writeNumber(source.salt);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
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
    launchCount: bigint;
    launchFee: bigint;
    graduationTarget: bigint;
    tradeFeeBps: bigint;
    creatorFeeBps: bigint;
}

export function storeFactoryInfo(src: FactoryInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        b_0.storeUint(src.launchCount, 32);
        b_0.storeCoins(src.launchFee);
        const b_1 = new Builder();
        b_1.storeCoins(src.graduationTarget);
        b_1.storeInt(src.tradeFeeBps, 257);
        b_1.storeInt(src.creatorFeeBps, 257);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadFactoryInfo(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const _launchCount = sc_0.loadUintBig(32);
    const _launchFee = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _graduationTarget = sc_1.loadCoins();
    const _tradeFeeBps = sc_1.loadIntBig(257);
    const _creatorFeeBps = sc_1.loadIntBig(257);
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps };
}

export function loadTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    const _creatorFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps };
}

export function loadGetterTupleFactoryInfo(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _launchCount = source.readBigNumber();
    const _launchFee = source.readBigNumber();
    const _graduationTarget = source.readBigNumber();
    const _tradeFeeBps = source.readBigNumber();
    const _creatorFeeBps = source.readBigNumber();
    return { $$type: 'FactoryInfo' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount, launchFee: _launchFee, graduationTarget: _graduationTarget, tradeFeeBps: _tradeFeeBps, creatorFeeBps: _creatorFeeBps };
}

export function storeTupleFactoryInfo(source: FactoryInfo) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
    builder.writeNumber(source.launchCount);
    builder.writeNumber(source.launchFee);
    builder.writeNumber(source.graduationTarget);
    builder.writeNumber(source.tradeFeeBps);
    builder.writeNumber(source.creatorFeeBps);
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
        b_1.storeRef(src.content);
        b_1.storeCoins(src.totalSupply);
        b_1.storeCoins(src.virtualTon);
        b_1.storeCoins(src.virtualTokens);
        b_1.storeCoins(src.realTonRaised);
        b_1.storeBit(src.graduated);
        b_1.storeBit(src.migrated);
        b_1.storeCoins(src.totalCreatorFees);
        b_1.storeCoins(src.totalPlatformFees);
        const b_2 = new Builder();
        b_2.storeUint(src.tradeCount, 32);
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
    const _content = sc_1.loadRef();
    const _totalSupply = sc_1.loadCoins();
    const _virtualTon = sc_1.loadCoins();
    const _virtualTokens = sc_1.loadCoins();
    const _realTonRaised = sc_1.loadCoins();
    const _graduated = sc_1.loadBit();
    const _migrated = sc_1.loadBit();
    const _totalCreatorFees = sc_1.loadCoins();
    const _totalPlatformFees = sc_1.loadCoins();
    const sc_2 = sc_1.loadRef().beginParse();
    const _tradeCount = sc_2.loadUintBig(32);
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount };
}

export function loadTupleLaunchpadJetton$Data(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialized = source.readBoolean();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _content = source.readCell();
    const _totalSupply = source.readBigNumber();
    const _virtualTon = source.readBigNumber();
    const _virtualTokens = source.readBigNumber();
    const _realTonRaised = source.readBigNumber();
    const _graduated = source.readBoolean();
    const _migrated = source.readBoolean();
    const _totalCreatorFees = source.readBigNumber();
    source = source.readTuple();
    const _totalPlatformFees = source.readBigNumber();
    const _tradeCount = source.readBigNumber();
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount };
}

export function loadGetterTupleLaunchpadJetton$Data(source: TupleReader) {
    const _factory = source.readAddress();
    const _creator = source.readAddress();
    const _salt = source.readBigNumber();
    const _initialized = source.readBoolean();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
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
    return { $$type: 'LaunchpadJetton$Data' as const, factory: _factory, creator: _creator, salt: _salt, initialized: _initialized, treasury: _treasury, liquidityManager: _liquidityManager, content: _content, totalSupply: _totalSupply, virtualTon: _virtualTon, virtualTokens: _virtualTokens, realTonRaised: _realTonRaised, graduated: _graduated, migrated: _migrated, totalCreatorFees: _totalCreatorFees, totalPlatformFees: _totalPlatformFees, tradeCount: _tradeCount };
}

export function storeTupleLaunchpadJetton$Data(source: LaunchpadJetton$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.factory);
    builder.writeAddress(source.creator);
    builder.writeNumber(source.salt);
    builder.writeBoolean(source.initialized);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
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
    launchCount: bigint;
}

export function storeLaunchpadFactory$Data(src: LaunchpadFactory$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.treasury);
        b_0.storeAddress(src.liquidityManager);
        b_0.storeUint(src.launchCount, 32);
    };
}

export function loadLaunchpadFactory$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _liquidityManager = sc_0.loadAddress();
    const _launchCount = sc_0.loadUintBig(32);
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount };
}

export function loadTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _launchCount = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount };
}

export function loadGetterTupleLaunchpadFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _treasury = source.readAddress();
    const _liquidityManager = source.readAddress();
    const _launchCount = source.readBigNumber();
    return { $$type: 'LaunchpadFactory$Data' as const, owner: _owner, treasury: _treasury, liquidityManager: _liquidityManager, launchCount: _launchCount };
}

export function storeTupleLaunchpadFactory$Data(source: LaunchpadFactory$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.treasury);
    builder.writeAddress(source.liquidityManager);
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

 type LaunchpadJetton_init_args = {
    $$type: 'LaunchpadJetton_init_args';
    factory: Address;
    creator: Address;
    salt: bigint;
}

function initLaunchpadJetton_init_args(src: LaunchpadJetton_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.factory);
        b_0.storeAddress(src.creator);
        b_0.storeInt(src.salt, 257);
    };
}

async function LaunchpadJetton_init(factory: Address, creator: Address, salt: bigint) {
    const __code = Cell.fromHex('b5ee9c72410245010012f300025aff008e88f4a413f4bcf2c80bed53208e983001d072d721d200d200fa4021103450666f04f86102f862e1ed43d90112020271020403fbbedc1f6a268690000c71b7d207d20699fe9007d206a00e87d206a7d007d007d007d00690069007d007d006a1868698f9805888805885f885f085e885e2b882a8747587d207d20408080eb802a9001e8ac1138124438410c037e11d600411806f05b59d3b200001138382a39110867885e0855f107888807aa876d9e3662413030e0104db3c22020120050f020120060c020158070a03fbadbcf6a268690000c71b7d207d20699fe9007d206a00e87d206a7d007d007d007d00690069007d007d006a1868698f9805888805885f885f085e885e2b882a8747587d207d20408080eb802a9001e8ac1138124438410c037e11d600411806f05b59d3b200001138382a39110867885e0855f107888807aa876d9e2b88401308090162f828db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d03200045f0f02f3af16f6a268690000c71b7d207d20699fe9007d206a00e87d206a7d007d007d007d00690069007d007d006a1868698f9805888805885f885f085e885e2b882a8747587d207d20408080eb802a9001e8ac1138124438410c037e11d600411806f05b59d3b200001138382a39110867885e0855f16d9e3652b632c0130b011e23b36df828f828db3c302b552052d03203fbb6987da89a1a400031c6df481f481a67fa401f481a803a1f481a9f401f401f401f401a401a401f401f401a861a1a63e6016222016217e217c217a2178ae20aa1d1d61f481f481020203ae00aa4007a2b044e04910e104300df847580104601bc16d674ec8000044e0e0a8e444219e21782157c41e22201eaa1db678d9890130d0e0104db3c1c00046c4403fbba48ced44d0d200018e36fa40fa40d33fd200fa40d401d0fa40d4fa00fa00fa00fa00d200d200fa00fa00d430d0d31f300b11100b10bf10be10bd10bc5710550e8eb0fa40fa40810101d700552003d1582270248870821806fc23ac0082300de0b6b3a764000022707054722210cf10bc10abe2db3c57115711571157118131011007882195d3ef798008127105370a822a904b6085611025611025611025610025610025613544f302f544f305613025610025610025610015610015610010038571157115711571157115711571157115711571157115711111055e002feed44d0d200018e36fa40fa40d33fd200fa40d401d0fa40d4fa00fa00fa00fa00d200d200fa00fa00d430d0d31f300b11100b10bf10be10bd10bc5710550e8eb0fa40fa40810101d700552003d1582270248870821806fc23ac0082300de0b6b3a764000022707054722210cf10bc10abe21111935f0f5be00fd70d1ff2e0821314000004fa2182104c500002ba8ff131d33ffa40fa40d4fa00fa0030f8416f245b812e0c325615c705f2f456108f465f0670804270885610553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010df551ce03d3d3d3d7f5472fe2dc8e0211530161a0052000000004c61756e636820726566756e6465643a20746f6b656e20616c72656164792065786973747303fe553082104c5001015005cb1f13cb3fcecb3f01fa02c9c88258c000000000000000000000000101cb67ccc970fb0071708824040f552010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0029c200e30239820afaf08070fb0270830670171819001c000000004c61756e63682066656501c80f11110f702f11120f11110f0c11100c102f10ac109b108a107910681057104645150403db3cc87f01ca00111055e011101fce1dce1bcb3f19ca0017ce05c8ce14cc58fa0201fa0201fa0258fa0212ca0012ca0058fa0258fa0202c8cb1f12cdcdc9ed541b01ac03c8018210d53276db58cb1fcb3fc95610504410246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010df10ce10bd108c107b55163004f882104c500003ba8f6731d33ffa00fa0030f8416f243032811de95610f2f48200e42328b3f2f48200e7eb248208989680bef2f481769424821005f5e100a013be12f2f41111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a1079106810571046104503db3ce02182107bdd97debae302211b301f2a02f60f11130f0e11120e0d11110d0c11100c0b11130b0a11120a09111109081110080711130706111206051111050411100403111303021112020111110111105612db3c8200e7eb24c200f2f4238200a2391117be01111601f2f4561558a151aaa05192a1508aa051a1a05147a0035613a002a42a82195d3ef79800be1c1d004a208100c8812710a98620811770a8812710a9045121a152a0a0546aa0a9865290a15312a11302fa8e30367f56122bc85982104c5001035003cb1fcb3f01fa02c9c88258c000000000000000000000000101cb67ccc970fb0006de2a820afaf080a070fb020f11110f5e3d0c11100c0b11110b0a11100a091111091048104706111106051110050411110403111003021110020111100156115614db3c7f56130456174314241e01d60211170256130201111501111729c8557082104c5001025009cb1f17cb3f15ce13ca0001fa0201fa0201fa0201fa0201fa02c9c88258c000000000000000000000000101cb67ccc970fb000c11120c0b11110b0a11100a109f108e107d106c55551045401403830670db3c2d03fe31d33ffa00fa40d72c01916d93fa4001e201f40430f8416f243032f8285250db3c0181114d02705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d012c705f2f4216ee302328200e42328b3f2f481769402820afaf080be12f2f4206ef2d080d08200bd1401d31f32202101d45b8108ff27f2f450a2a1216eb39639206ef2d080923108e27080427004c8018210d53276db58cb1fcb3fc91034413010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010df551c3002fc01821053454c4cba12f2f4fa00300f11110f5e3d0c11100c0b11110b0a11100a09111109081110080711110706111006051111050411100403111103021110020111120111135610db3c5233a08200e7eb24c200f2f4813fc3531abbf2f4038200a2391118be01111701f2f45191a1085612a05171a10a5612a1045615a02223004a5270a0546880a9865280a1208100c8812710a98620811770a8812710a9045121a15312a11302fc5139a002a42a820afaf080a070fb020f11110f5e3d0c11100c0b11110b0a11100a091111091048104710460511100503111003021110020111100156155612db3c041113047056155045031112030211140201111701111327c8557082104c5001025009cb1f17cb3f15ce13ca0001fa0201fa0201fa0201fa0201fa02c92428029e21c2008ec071708856130405552010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009131e220c2009130e30d2526001e0000000043726561746f7220666565017a7170882f553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0027002000000000506c6174666f726d2066656502ccc88258c000000000000000000000000101cb67ccc970fb0070830670880411130410246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00109f108e107d106c555545401023293000220000000053656c6c2070726f6365656473023282104c500004bae3020182102c76b973bae3025f0f5bf2c0822b3101fe31d33f30f8416f24135f038200f49225f2f48151db04b314f2f481769403821008f0d180be13f2f47f70545097a05464c829c8553082104c5001045005cb1f13cb3fce01fa0201fa02c9c88258c000000000000000000000000101cb67ccc970fb00820afaf08021fb020f11110f0e11100e10df2a10df10ce0d10ac106b182c039c1a10575e32503471820afaf080db3c70830670882e553010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb002d2f3002f4f8285250db3c5c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d07ff8287070c8ca00c9d01059104a1023102bc855508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec910565e22401310465522c8cf8580322e0058ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0000300000000047726164756174696f6e206c6971756964697479007cc87f01ca00111055e011101fce1dce1bcb3f19ca0017ce05c8ce14cc58fa0201fa0201fa0258fa0212ca0012ca0058fa0258fa0202c8cb1f12cdcdc9ed5402f2d33ffa40d2003021fa44306d018eb430f8285220db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d0dff842708040700596c85006cf16c992356de24630c855208210d17354005004cb1f12cb3f01206e9430cf84809201cee2f400c943303244011688c87001ca005a02cecec933022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d934360149a65ec0bb513434800066be803e903e9015481b04e6be903e901640b4405c1678b6cf1b0d203501125cdb3c3054633052303c04b401d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e204e30202d70d1ff2e0822182100f8a7ea5bae302218210178d4519bae302018210595f07bcba37383b4000b6028020d7217021d749c21f9430d31f01de208210178d4519ba8e1a30d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e082107bdd97deba8e19d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e05f0402f231d33ffa00fa40d72c01916d93fa4001e201f40431fa0023fa4430f2d08af8416f2481114d533cc705f2f48142a629c200f2f451a8a18200ca9721c2fff2f44330523bfa40fa0071d721fa00fa00306c6170f83a23c20091729171e281769402a85240a08209c9c380a08208989680a012bcf2f45138db3c5c3c3901fe705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d050767080407f2c48135079c855508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec9105610451034401310465522c8cf8580ca00cf8440ce01fa028069cf40025c6e013a00586eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed5404fc31d33ffa00fa40d72c01916d93fa4001e201fa00f8416f24532cc705b38ebc537cdb3c0181114d02705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d05240c705f2f4de51a8a021f8276f1021a1820898968066b608a18208e4e1c0a0a126c200e30f236eb33c3d3e3f0018f82ac87001ca005a02cecec900e8504b4330fa40fa0071d721fa00fa00306c6170f83a5230a018a171702848135074c8553082107362d09c5005cb1f13cb3f01fa02cecec9284614505510246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0003000c107b50895f0800dc9321c2009170e28e5003206ef2d080727004c8018210d53276db58cb1fcb3fc9414010246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00926c31e202c87f01ca0055205afa0212cecec9ed54010ee3025f04f2c0824101fed33ffa00d72c01916d93fa4001e201f40430f8416f24303281114d5118c705f2f48142a624c200f2f45153a18200ca9721c2fff2f4817694068210042c1d80be16f2f470504380407f544857c8554082107bdd97de5006cb1f14cb3f58fa02ce01206e9430cf84809201cee2f400c926444410246d50436d03c8cf8580ca0042017689cf16ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed544300011000f210246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010df551cc87f01ca00111055e011101fce1dce1bcb3f19ca0017ce05c8ce14cc58fa0201fa0201fa0258fa0212ca0012ca0058fa0258fa0202c8cb1f12cdcdc9ed544bbe0daf');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initLaunchpadJetton_init_args({ $$type: 'LaunchpadJetton_init_args', factory, creator, salt })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const LaunchpadJetton_errors = {
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

export const LaunchpadJetton_errors_backward = {
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

const LaunchpadJetton_types: ABIType[] = [
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
    {"name":"JettonSetup","header":1280311298,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Buy","header":1280311299,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"tonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"minTokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"Migrate","header":1280311300,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryWithdraw","header":1280311301,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"TokenLaunched","header":1280311553,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"initialBuyTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"TradeEvent","header":1280311554,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"trader","type":{"kind":"simple","type":"address","optional":false}},{"name":"isBuy","type":{"kind":"simple","type":"bool","optional":false}},{"name":"tonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"GraduatedEvent","header":1280311555,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"MigratedEvent","header":1280311556,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"tonLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tokenLiquidity","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"JettonData","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"adminAddress","type":{"kind":"simple","type":"address","optional":true}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"walletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"JettonWalletData","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"minter","type":{"kind":"simple","type":"address","optional":false}},{"name":"code","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"CurveState","header":null,"fields":[{"name":"factory","type":{"kind":"simple","type":"address","optional":false}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"initialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"migrated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"progressBps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"QuoteBuy","header":null,"fields":[{"name":"tokensOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"QuoteSell","header":null,"fields":[{"name":"tonOut","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"creatorFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"platformFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"FactoryInfo","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"launchFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduationTarget","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"creatorFeeBps","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"JettonWallet$Data","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"minter","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"LaunchpadJetton$Data","header":null,"fields":[{"name":"factory","type":{"kind":"simple","type":"address","optional":false}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"salt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"initialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"virtualTokens","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"realTonRaised","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"graduated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"migrated","type":{"kind":"simple","type":"bool","optional":false}},{"name":"totalCreatorFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalPlatformFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"tradeCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"LaunchpadFactory$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"liquidityManager","type":{"kind":"simple","type":"address","optional":false}},{"name":"launchCount","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
]

const LaunchpadJetton_opcodes = {
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
    "GraduatedEvent": 1280311555,
    "MigratedEvent": 1280311556,
}

const LaunchpadJetton_getters: ABIGetter[] = [
    {"name":"get_jetton_data","methodId":106029,"arguments":[],"returnType":{"kind":"simple","type":"JettonData","optional":false}},
    {"name":"get_wallet_address","methodId":103289,"arguments":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"get_curve_state","methodId":124044,"arguments":[],"returnType":{"kind":"simple","type":"CurveState","optional":false}},
    {"name":"quote_buy","methodId":111811,"arguments":[{"name":"tonAmount","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"QuoteBuy","optional":false}},
    {"name":"quote_sell","methodId":88963,"arguments":[{"name":"tokenAmount","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"QuoteSell","optional":false}},
]

export const LaunchpadJetton_getterMapping: { [key: string]: string } = {
    'get_jetton_data': 'getGetJettonData',
    'get_wallet_address': 'getGetWalletAddress',
    'get_curve_state': 'getGetCurveState',
    'quote_buy': 'getQuoteBuy',
    'quote_sell': 'getQuoteSell',
}

const LaunchpadJetton_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"JettonSetup"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Buy"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonBurnNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Migrate"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ProvideWalletAddress"}},
]

export const TOKEN_DECIMALS = 9n;
export const TOTAL_SUPPLY_NANO = 1000000000000000000n;
export const LAUNCH_FEE = 50000000n;
export const GRADUATION_TARGET = 1500000000000n;
export const TRADE_FEE_BPS = 200n;
export const CREATOR_FEE_BPS = 6000n;
export const BPS = 10000n;
export const VIRTUAL_TON = 30000000000n;
export const VIRTUAL_TOKENS = 1000000000000000000n;
export const MIN_TRADE = 10000000n;
export const MAX_INITIAL_BUY = 100000000000n;
export const CREATE_GAS = 150000000n;
export const BUY_GAS = 100000000n;
export const SELL_GAS = 50000000n;
export const MIGRATE_GAS = 150000000n;
export const MINTER_MIN_STORAGE = 50000000n;
export const WALLET_MIN_STORAGE = 10000000n;
export const WALLET_GAS = 15000000n;
export const BURN_MIN_VALUE = 70000000n;
export const SELL_PAYLOAD_OP = 1397050444n;

export class LaunchpadJetton implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = LaunchpadJetton_errors_backward;
    public static readonly opcodes = LaunchpadJetton_opcodes;
    
    static async init(factory: Address, creator: Address, salt: bigint) {
        return await LaunchpadJetton_init(factory, creator, salt);
    }
    
    static async fromInit(factory: Address, creator: Address, salt: bigint) {
        const __gen_init = await LaunchpadJetton_init(factory, creator, salt);
        const address = contractAddress(0, __gen_init);
        return new LaunchpadJetton(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new LaunchpadJetton(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  LaunchpadJetton_types,
        getters: LaunchpadJetton_getters,
        receivers: LaunchpadJetton_receivers,
        errors: LaunchpadJetton_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: JettonSetup | Buy | JettonBurnNotification | Migrate | ProvideWalletAddress) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonSetup') {
            body = beginCell().store(storeJettonSetup(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Buy') {
            body = beginCell().store(storeBuy(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonBurnNotification') {
            body = beginCell().store(storeJettonBurnNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Migrate') {
            body = beginCell().store(storeMigrate(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ProvideWalletAddress') {
            body = beginCell().store(storeProvideWalletAddress(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetJettonData(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_jetton_data', builder.build())).stack;
        const result = loadGetterTupleJettonData(source);
        return result;
    }
    
    async getGetWalletAddress(provider: ContractProvider, owner: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(owner);
        const source = (await provider.get('get_wallet_address', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getGetCurveState(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_curve_state', builder.build())).stack;
        const result = loadGetterTupleCurveState(source);
        return result;
    }
    
    async getQuoteBuy(provider: ContractProvider, tonAmount: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(tonAmount);
        const source = (await provider.get('quote_buy', builder.build())).stack;
        const result = loadGetterTupleQuoteBuy(source);
        return result;
    }
    
    async getQuoteSell(provider: ContractProvider, tokenAmount: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(tokenAmount);
        const source = (await provider.get('quote_sell', builder.build())).stack;
        const result = loadGetterTupleQuoteSell(source);
        return result;
    }
    
}