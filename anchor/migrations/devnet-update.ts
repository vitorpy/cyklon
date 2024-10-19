/*
  This script is used to setup the devnet environment for the Cyklon program.
  It creates a PYUSD/WSOL pool and transfers initial liquidity to the pool.
  It is used to test the Cyklon program.

  Run with:
  ./node_modules/.bin/ts-node -P ./anchor/tsconfig.lib.json ./anchor/migrations/devnet-setup.ts
 */
import * as anchor from '@coral-xyz/anchor';
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from '@solana/spl-token';
import { AnchorProvider, web3, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, NATIVE_MINT } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Load the IDL using require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cyklonIdl = require('../target/idl/cyklon.json') as Idl;

// Constants
const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM');
const PYUSD_AMOUNT = 100 * 10**6; // 100 PYUSD (assuming 6 decimals)
const WSOL_AMOUNT = 1 * 10**9; // 1 WSOL (9 decimals)

function getCyklonProgram(provider: AnchorProvider): Program<typeof cyklonIdl> {
  return new Program<typeof cyklonIdl>(cyklonIdl, provider);
}

function getCyklonProgramId(network: string): PublicKey {
  switch (network) {
    case 'localnet':
    case 'devnet':
      return new PublicKey(cyklonIdl.address);
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

async function createPYUSDWSOLPool(provider: AnchorProvider) {
  const program = getCyklonProgram(provider);
  const programId = getCyklonProgramId('devnet');
  
  const [token0, token1] = [PYUSD_MINT, NATIVE_MINT].sort((a, b) => 
    a.toBuffer().compare(b.toBuffer())
  );

  // Find pool PDA using sorted token public keys
  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), token0.toBuffer(), token1.toBuffer()],
    programId
  );

  // Find LP token mint PDA
  const [lpTokenMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), token0.toBuffer(), token1.toBuffer()],
    programId
  );

  // Find metadata account PDA
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      lpTokenMint.toBuffer()
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );

  // Upgrade the pool
  const tx = await program.methods
    .upgradePool()
    .accounts({
      pool: poolPubkey,
      tokenMintX: token0,
      tokenMintY: token1,
      tokenMintLp: lpTokenMint,
      metadataAccount: metadataAccount,
      payer: provider.wallet.publicKey,
      lpTokenProgram: TOKEN_PROGRAM_ID,
      mplProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      systemProgram: SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("Pool upgraded. Transaction signature:", tx);
}

async function main() {
  // Read wallet keypair from home directory
  const homeDir = os.homedir();
  const walletPath = path.join(homeDir, '.config', 'solana', 'id.json');
  const rawdata = fs.readFileSync(walletPath, 'utf-8');
  const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rawdata)));

  // Initialize connection to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Create AnchorProvider
  const wallet = new anchor.Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {});

  // Print header and wallet address
  console.log("=== Devnet Setup ===");
  console.log("Wallet address:", wallet.publicKey.toString());

  // Set the provider
  anchor.setProvider(provider);

  // Run the pool creation function
  await createPYUSDWSOLPool(provider);
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
