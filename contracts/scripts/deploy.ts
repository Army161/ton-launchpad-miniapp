/**
 * Deploy LaunchpadFactory to TON mainnet or testnet.
 *
 * Usage:
 *   DEPLOY_MNEMONIC="word1 word2 ..." PLATFORM_TREASURY_ADDRESS=UQ... npm run deploy:mainnet
 *   DEPLOY_MNEMONIC="word1 word2 ..." PLATFORM_TREASURY_ADDRESS=UQ... npm run deploy:testnet
 */
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, toNano, Address } from '@ton/ton';
import { LaunchpadFactory } from '../build/Launchpad_LaunchpadFactory';
import * as fs from 'fs';
import * as path from 'path';

const network = process.argv[2] ?? 'testnet';

const ENDPOINTS: Record<string, string> = {
  mainnet: 'https://toncenter.com/api/v2/jsonRPC',
  testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC',
};

async function main() {
  const mnemonic = process.env.DEPLOY_MNEMONIC;
  const treasuryStr = process.env.PLATFORM_TREASURY_ADDRESS;

  if (!mnemonic) {
    console.error('ERROR: Set DEPLOY_MNEMONIC environment variable');
    process.exit(1);
  }
  if (!treasuryStr) {
    console.error('ERROR: Set PLATFORM_TREASURY_ADDRESS environment variable');
    process.exit(1);
  }

  const apiKey = process.env.TONCENTER_API_KEY ?? '';
  const endpoint = ENDPOINTS[network];
  if (!endpoint) {
    console.error(`Unknown network: ${network}`);
    process.exit(1);
  }

  const client = new TonClient({
    endpoint,
    apiKey: apiKey || undefined,
  });

  const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });
  const walletContract = client.open(wallet);
  const platformTreasury = Address.parse(treasuryStr);

  const factory = await LaunchpadFactory.fromInit(
    wallet.address,
    platformTreasury,
  );

  console.log(`Network: ${network}`);
  console.log(`Factory address: ${factory.address.toString()}`);
  console.log(`Platform treasury: ${platformTreasury.toString()}`);
  console.log(`Deployer wallet: ${wallet.address.toString()}`);

  const seqno = await walletContract.getSeqno();

  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: factory.address,
        value: toNano('0.1'),
        init: factory.init,
        body: null,
      }),
    ],
  });

  console.log('Deploy transaction sent. Waiting for confirmation...');

  // Wait for deploy
  let currentSeqno = seqno;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    currentSeqno = await walletContract.getSeqno();
    if (currentSeqno > seqno) break;
  }

  const info = await client.open(factory).getGetFactoryInfo();
  console.log('Factory deployed successfully!');
  console.log('Launch fee:', info.launchFee.toString(), 'nanotons');
  console.log('Trade fee BPS:', info.tradeFeeBps.toString());

  // Write deploy artifact
  const artifact = {
    network,
    factoryAddress: factory.address.toString(),
    platformTreasury: platformTreasury.toString(),
    deployer: wallet.address.toString(),
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, '..', 'deployed.json');
  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  console.log(`Artifact written to ${outPath}`);

  // Update SMARTCONTRACT.md
  const mdPath = path.join(__dirname, '..', '..', 'docs', 'SMARTCONTRACT.md');
  if (fs.existsSync(mdPath)) {
    let md = fs.readFileSync(mdPath, 'utf8');
    md = md.replace('PENDING_DEPLOY', factory.address.toString());
    md = md.replace('$PLATFORM_TREASURY_ADDRESS', platformTreasury.toString());
    fs.writeFileSync(mdPath, md);
    console.log('Updated docs/SMARTCONTRACT.md');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
