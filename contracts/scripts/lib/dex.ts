/**
 * Resolves the STON.fi v2 router and its pTON wallet for deploy and rehearsal.
 *
 * Mainnet: the STON.fi API describes the router (version, type, pool creation)
 * and names its pTON master and wallet. STON.fi has no testnet API, so on testnet
 * (or whenever STON_PTON_MASTER_ADDRESS is set) the API is skipped: the pTON
 * master comes from STON_PTON_MASTER_ADDRESS and the router's pTON wallet is
 * asked from that master on-chain. Either way the pTON master must confirm the
 * wallet belongs to this router, or the TON leg of graduation would be lost.
 */
import { Address, beginCell } from '@ton/core';
import type { TonClient } from '@ton/ton';
import { StonApiClient } from '@ston-fi/api';
import { requireAddress, type Network } from './wallet';

export type DexResolution = { router: Address; ptonWallet: Address; ptonMaster: Address; source: string };

type Reader = Pick<TonClient, 'runMethod' | 'isContractDeployed'>;

export async function routerPtonWallet(client: Reader, ptonMaster: Address, router: Address): Promise<Address> {
    const res = await client.runMethod(ptonMaster, 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(router).endCell() },
    ]);
    return res.stack.readAddress();
}

export async function resolveDex(
    client: Reader,
    network: Network,
    env: NodeJS.ProcessEnv = process.env,
    api: () => Pick<StonApiClient, 'getRouter'> = () =>
        new StonApiClient(env.STONFI_API_URL ? { baseURL: env.STONFI_API_URL } : undefined),
): Promise<DexResolution> {
    const router = requireAddress('STON_ROUTER_ADDRESS', env);
    const configuredWallet = env.STON_PTON_WALLET_ADDRESS ? requireAddress('STON_PTON_WALLET_ADDRESS', env) : null;

    let ptonMaster: Address;
    let source: string;
    if (env.STON_PTON_MASTER_ADDRESS || network === 'testnet') {
        if (!env.STON_PTON_MASTER_ADDRESS) {
            throw new Error('STON.fi has no testnet API: set STON_PTON_MASTER_ADDRESS to the testnet pTON v2 master.');
        }
        ptonMaster = requireAddress('STON_PTON_MASTER_ADDRESS', env);
        if (!(await client.isContractDeployed(router))) throw new Error('STON_ROUTER_ADDRESS is not an active contract on this network.');
        source = 'on-chain (pTON master), router version not checked';
    } else {
        const info = await api().getRouter(router.toString());
        if (info.majorVersion !== 2) throw new Error(`Router is v${info.majorVersion}; graduation needs a STON.fi v2 router.`);
        if (!/constant/i.test(info.routerType)) throw new Error(`Router type is ${info.routerType}; use a constant-product router.`);
        if (!info.poolCreationEnabled) throw new Error('This router does not allow pool creation.');
        ptonMaster = Address.parse(info.ptonMasterAddress);
        source = `STON.fi API: v${info.majorVersion}.${info.minorVersion}, ${info.routerType}`;
        if (!configuredWallet) {
            const fromApi = Address.parse(info.ptonWalletAddress);
            const onChain = await routerPtonWallet(client, ptonMaster, router);
            if (!onChain.equals(fromApi)) throw new Error('pTON wallet does not match the pTON master\'s wallet for this router.');
            return { router, ptonWallet: onChain, ptonMaster, source };
        }
    }

    const onChain = await routerPtonWallet(client, ptonMaster, router);
    if (configuredWallet && !configuredWallet.equals(onChain)) {
        throw new Error('STON_PTON_WALLET_ADDRESS does not match the pTON master\'s wallet for this router.');
    }
    return { router, ptonWallet: onChain, ptonMaster, source };
}
