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
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, NATIVE_MINT } from '@solana/spl-token';
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

  // Check if the pool already exists
  const poolAccount = await provider.connection.getAccountInfo(poolPubkey);
  
  if (poolAccount !== null) {
    console.log("Pool already exists. Checking token accounts...");
  } else {
    // Create associated token accounts for the pool
    const poolPYUSDAccount = await getAssociatedTokenAddress(
      PYUSD_MINT,
      poolPubkey,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    const poolWSOLAccount = await getAssociatedTokenAddress(NATIVE_MINT, poolPubkey, true);

    // Check if pool token accounts exist
    const poolPYUSDAccountInfo = await provider.connection.getAccountInfo(poolPYUSDAccount);
    const poolWSOLAccountInfo = await provider.connection.getAccountInfo(poolWSOLAccount);

    const createATAsTx = new web3.Transaction();
    let needToCreateATAs = false;

    if (!poolPYUSDAccountInfo) {
      console.log("Creating pool PYUSD ATA...");
      createATAsTx.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          poolPYUSDAccount,
          poolPubkey,
          PYUSD_MINT,
          TOKEN_2022_PROGRAM_ID
        )
      );
      needToCreateATAs = true;
    }

    if (!poolWSOLAccountInfo) {
      console.log("Creating pool WSOL ATA...");
      createATAsTx.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          poolWSOLAccount,
          poolPubkey,
          NATIVE_MINT
        )
      );
      needToCreateATAs = true;
    }

    if (needToCreateATAs) {
      const createATAsSig = await provider.sendAndConfirm(createATAsTx);
      console.log("Pool ATAs created. Transaction signature:", createATAsSig);
    }

    // Initialize the pool
    const tx = await program.methods
      .initializePool()
      .accounts({
        pool: poolPubkey,
        tokenMint0: PYUSD_MINT,
        tokenMint1: NATIVE_MINT,
        poolTokenAccount0: poolPYUSDAccount,
        poolTokenAccount1: poolWSOLAccount,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Pool initialized. Transaction signature:", tx);
  }

  // Create user's associated token accounts
  const userWSOLAccount = await getAssociatedTokenAddress(NATIVE_MINT, provider.wallet.publicKey);

  // Get pool token accounts
  const poolPYUSDAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    poolPubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );
  const poolWSOLAccount = await getAssociatedTokenAddress(NATIVE_MINT, poolPubkey, true);

  // Check and create pool token accounts if they don't exist
  const createPoolATAsTx = new web3.Transaction();
  let needToCreatePoolATAs = false;

  const poolPYUSDAccountInfo = await provider.connection.getAccountInfo(poolPYUSDAccount);
  if (!poolPYUSDAccountInfo) {
    console.log("Creating pool PYUSD ATA...");
    createPoolATAsTx.add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        poolPYUSDAccount,
        poolPubkey,
        PYUSD_MINT,
        TOKEN_2022_PROGRAM_ID
      )
    );
    needToCreatePoolATAs = true;
  }

  const poolWSOLAccountInfo = await provider.connection.getAccountInfo(poolWSOLAccount);
  if (!poolWSOLAccountInfo) {
    console.log("Creating pool WSOL ATA...");
    createPoolATAsTx.add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        poolWSOLAccount,
        poolPubkey,
        NATIVE_MINT
      )
    );
    needToCreatePoolATAs = true;
  }

  if (needToCreatePoolATAs) {
    const createPoolATAsSig = await provider.sendAndConfirm(createPoolATAsTx);
    console.log("Pool ATAs created. Transaction signature:", createPoolATAsSig);
  }

  // Check current pool balances
  let poolPYUSDBalance, poolWSOLBalance;
  try {
    poolPYUSDBalance = await provider.connection.getTokenAccountBalance(poolPYUSDAccount);
    poolWSOLBalance = await provider.connection.getTokenAccountBalance(poolWSOLAccount);

    console.log("Current pool balances:");
    console.log("PYUSD:", poolPYUSDBalance.value.uiAmount);
    console.log("WSOL:", poolWSOLBalance.value.uiAmount);
  } catch (error) {
    poolPYUSDBalance = { value: { uiAmount: 0 } };
    poolWSOLBalance = { value: { uiAmount: 0 } };
  }

  // Transfer initial liquidity if the pool is empty
  if (poolPYUSDBalance.value.uiAmount === 0 && poolWSOLBalance.value.uiAmount === 0) {
    const transferTx = new web3.Transaction();

    // Check if user's PYUSD account exists and has sufficient balance
    const userPYUSDAccount = await getAssociatedTokenAddress(
      PYUSD_MINT,
      provider.wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const userPYUSDAccountInfo = await provider.connection.getAccountInfo(userPYUSDAccount);
    
    if (!userPYUSDAccountInfo) {
      console.log("User's PYUSD account doesn't exist. Please fund your account with PYUSD first.");
      return;
    }

    const userPYUSDBalance = await provider.connection.getTokenAccountBalance(userPYUSDAccount);
    if (userPYUSDBalance.value.uiAmount === null || userPYUSDBalance.value.uiAmount < PYUSD_AMOUNT / 10**6) {
      console.log(`Insufficient PYUSD balance. You need at least ${PYUSD_AMOUNT / 10**6} PYUSD.`);
      return;
    }

    if (userPYUSDAccountInfo.owner.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
      console.log("User's PYUSD account is not a Token-2022 account. Please check the account.");
      return;
    }
    
    // Check if WSOL account exists, if not, create it
    const userWSOLInfo = await provider.connection.getAccountInfo(userWSOLAccount);
    if (!userWSOLInfo) {
      transferTx.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          userWSOLAccount,
          provider.wallet.publicKey,
          NATIVE_MINT
        )
      );
    }

    // Wrap SOL to WSOL
    transferTx.add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: userWSOLAccount,
        lamports: WSOL_AMOUNT,
      })
    );
    transferTx.add(
      createSyncNativeInstruction(userWSOLAccount)
    );

    // Send transaction to wrap SOL
    const wrapSolSig = await provider.sendAndConfirm(transferTx);
    console.log("SOL wrapped to WSOL. Transaction signature:", wrapSolSig);

    // Call add_liquidity method on Cyklon
    const addLiquidityTx = await program.methods
      .addLiquidity(new anchor.BN(PYUSD_AMOUNT), new anchor.BN(WSOL_AMOUNT))
      .accounts({
        pool: poolPubkey,
        tokenMint0: PYUSD_MINT,
        tokenMint1: NATIVE_MINT,
        poolTokenAccount0: poolPYUSDAccount,
        poolTokenAccount1: poolWSOLAccount,
        userTokenAccount0: userPYUSDAccount,
        userTokenAccount1: userWSOLAccount,
        user: provider.wallet.publicKey,
        tokenMint0Program: TOKEN_2022_PROGRAM_ID, // Use Token-2022 for PYUSD
        tokenMint1Program: TOKEN_PROGRAM_ID, // Use regular SPL Token for WSOL
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Liquidity added. Transaction signature:", addLiquidityTx);
  } else {
    console.log("Pool already has liquidity. Skipping initial liquidity transfer.");
  }
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