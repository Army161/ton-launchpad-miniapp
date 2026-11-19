import { Address } from '@ton/core';
import { CHAIN, UserRejectsError, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEPLOY_VALUE, factoryInfoProblem, MAINNET_FACTORY, MIN_DEPLOYER_BALANCE, planFactoryDeploy, type FactoryPlan } from '../lib/factoryDeploy';
import { checkMainnetDex, mainnetReader } from '../lib/factoryDeployChain';
import styles from './DeployFactory.module.css';

// One-time mainnet factory deploy, approved in the owner's wallet app (docs/EXECUTION.md, "Factory deploy from a wallet app"). Always mainnet,
// whatever network the rest of the app is built for. Served only where VITE_FACTORY_DEPLOY_PAGE is "on".

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ready'; plan: FactoryPlan; source: string; balance: bigint; note?: string }
  | { kind: 'approve'; plan: FactoryPlan }
  | { kind: 'waiting'; plan: FactoryPlan }
  | { kind: 'late'; plan: FactoryPlan }
  | { kind: 'done'; plan: FactoryPlan; launches: bigint }
  | { kind: 'error'; message: string };

const POLL_MS = 4000;
const POLLS = 45;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');
const ton = (nano: bigint) => (Number(nano) / 1e9).toFixed(2);
const contract = (a: Address) => a.toString({ bounceable: true, testOnly: false });
const walletForm = (a: Address) => a.toString({ bounceable: false, testOnly: false });

export function DeployFactory() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const reader = useMemo(() => mainnetReader(), []);
  const [last, setState] = useState<State>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);
  /** Only the newest check or deploy may change the page. */
  const turn = useRef(0);

  const owner = wallet?.account.address ?? null;
  const onMainnet = wallet?.account.chain === CHAIN.MAINNET;
  /** Without a mainnet wallet nothing of an earlier check is shown. */
  const state: State = owner && onMainnet ? last : { kind: 'idle' };

  const verify = useCallback(
    async (plan: FactoryPlan): Promise<State> => {
      const info = await reader.factoryInfo(plan.factory);
      const problem = factoryInfoProblem(info, plan);
      return problem ? { kind: 'error', message: `${problem} Do not use this factory; send this message to Claude.` } : { kind: 'done', plan, launches: info.launchCount };
    },
    [reader],
  );

  const check = useCallback(
    async (ownerRaw: string) => {
      const mine = ++turn.current;
      const show = (next: State) => {
        if (turn.current === mine) setState(next);
      };
      show({ kind: 'checking' });
      try {
        const dex = await checkMainnetDex(reader, {
          router: Address.parse(MAINNET_FACTORY.stonRouter),
          ptonMaster: Address.parse(MAINNET_FACTORY.ptonMaster),
          ptonWallet: Address.parse(MAINNET_FACTORY.ptonWallet),
        });
        const plan = await planFactoryDeploy({
          owner: Address.parse(ownerRaw),
          treasury: Address.parse(MAINNET_FACTORY.treasury),
          router: dex.router,
          ptonWallet: dex.ptonWallet,
        });
        if (await reader.isDeployed(plan.factory)) {
          show(await verify(plan));
          return;
        }
        show({ kind: 'ready', plan, source: dex.source, balance: await reader.balance(plan.owner) });
      } catch (err) {
        show({ kind: 'error', message: errorText(err) });
      }
    },
    [reader, verify],
  );

  useEffect(() => {
    if (owner && onMainnet) void check(owner);
    else turn.current++;
  }, [owner, onMainnet, check]);

  const deploy = useCallback(
    async (ready: Extract<State, { kind: 'ready' }>) => {
      const { plan } = ready;
      const mine = ++turn.current;
      const show = (next: State) => {
        if (turn.current === mine) setState(next);
      };
      show({ kind: 'approve', plan });
      try {
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 600,
          network: CHAIN.MAINNET,
          messages: [plan.message],
        });
      } catch (err) {
        // Only a refusal in the wallet proves nothing was sent. After any other failure the transaction may still
        // have gone out, so the page offers a check, not a second send.
        if (err instanceof UserRejectsError) show({ ...ready, note: 'You declined it in the wallet, so nothing was sent. You can try again.' });
        else show({ kind: 'late', plan });
        return;
      }
      show({ kind: 'waiting', plan });
      for (let i = 0; i < POLLS && turn.current === mine; i++) {
        await sleep(POLL_MS);
        try {
          if (await reader.isDeployed(plan.factory)) {
            show(await verify(plan));
            return;
          }
        } catch {
          // A failed read says nothing about the deploy: ask again.
        }
      }
      show({ kind: 'late', plan });
    },
    [tonConnectUI, reader, verify],
  );

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, []);

  const rows = (plan: FactoryPlan, source?: string) => (
    <dl className={styles.rows}>
      <dt>Owner (your wallet)</dt>
      <dd>{walletForm(plan.owner)}</dd>
      <dt>Fee wallet (treasury)</dt>
      <dd>{walletForm(plan.treasury)}</dd>
      <dt>Refund wallet</dt>
      <dd>your wallet</dd>
      <dt>STON.fi router</dt>
      <dd>{contract(plan.router)}</dd>
      {source && (
        <>
          <dt>Router check</dt>
          <dd>{source}</dd>
        </>
      )}
      <dt>Factory address</dt>
      <dd>{contract(plan.factory)}</dd>
    </dl>
  );

  return (
    <div className={`page page--no-nav ${styles.wrap}`}>
      <h1>Deploy the launchpad factory</h1>
      <p className="muted">
        One time only, on TON mainnet. Your wallet app shows the transaction and you approve it there. No recovery phrase is typed or stored
        anywhere.
      </p>

      {!wallet && (
        <button className="btn-primary" onClick={() => void tonConnectUI.openModal()}>
          Connect your wallet
        </button>
      )}

      {wallet && !onMainnet && <p className={styles.warn}>This wallet is on testnet. Switch it to mainnet and connect again.</p>}

      {state.kind === 'checking' && <p className="loading-pulse">Checking the router and your wallet. This takes about ten seconds.</p>}

      {state.kind === 'ready' && (
        <>
          <div className="card">{rows(state.plan, state.source)}</div>
          <p>
            Your wallet holds {ton(state.balance)} TON. The deploy sends {ton(DEPLOY_VALUE)} TON to the factory.
          </p>
          {state.note && <p className={styles.warn}>{state.note}</p>}
          {state.balance < MIN_DEPLOYER_BALANCE ? (
            <>
              <p className={styles.warn}>
                This wallet needs at least {ton(MIN_DEPLOYER_BALANCE)} TON. Add TON to it, or connect the wallet you funded, then check again.
              </p>
              <button className="btn-secondary" onClick={() => owner && void check(owner)}>
                Check again
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => void deploy(state)}>
              Deploy the factory
            </button>
          )}
        </>
      )}

      {state.kind === 'approve' && <p className="loading-pulse">Open your wallet app and approve the transaction of {ton(DEPLOY_VALUE)} TON.</p>}

      {state.kind === 'waiting' && <p className="loading-pulse">Sent. Waiting for the network to confirm, usually under a minute. Keep this page open.</p>}

      {state.kind === 'late' && (
        <>
          <p className={styles.warn}>The network does not show the factory yet. Do not send again. Wait a minute, then check.</p>
          <button className="btn-secondary" onClick={() => owner && void check(owner)}>
            Check again
          </button>
        </>
      )}

      {state.kind === 'done' && (
        <>
          <p className={styles.ok}>The factory is deployed and its settings are verified on-chain.</p>
          <div className="card">{rows(state.plan)}</div>
          <button className="btn-primary" onClick={() => void copy(contract(state.plan.factory))}>
            {copied ? 'Copied' : 'Copy the factory address'}
          </button>
          <p>Paste the factory address into the chat with Claude. That is the last step here.</p>
          <a className="btn-ghost" href={`https://tonviewer.com/${contract(state.plan.factory)}`} target="_blank" rel="noreferrer">
            View on Tonviewer
          </a>
        </>
      )}

      {state.kind === 'error' && (
        <>
          <p className={styles.warn}>{state.message}</p>
          <button className="btn-secondary" onClick={() => owner && void check(owner)}>
            Check again
          </button>
        </>
      )}

      {wallet && state.kind !== 'approve' && state.kind !== 'waiting' && (
        <button className="btn-ghost" onClick={() => void tonConnectUI.disconnect()}>
          Use another wallet
        </button>
      )}
    </div>
  );
}
