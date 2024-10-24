// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from '@coral-xyz/anchor';
import { createTransferInstruction } from '@solana/spl-token';
import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  getDarklakeProgram,
  getDarklakeProgramId,
} from '../src/darklake-exports';

// Constants
const PYUSD_MINT = new PublicKey(
  'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM'
);
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const PYUSD_AMOUNT = 100 * 10 ** 6; // 100 PYUSD (assuming 6 decimals)
const WSOL_AMOUNT = 1 * 10 ** 9; // 1 WSOL (9 decimals)

async function createPYUSDWSOLPool(provider: AnchorProvider) {
  const program = getDarklakeProgram(provider);
  const programId = getDarklakeProgramId('devnet');

  // Find pool PDA
  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), PYUSD_MINT.toBuffer(), WSOL_MINT.toBuffer()],
    programId
  );

  // Create associated token accounts for the pool
  const poolPYUSDAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    poolPubkey,
    true
  );
  const poolWSOLAccount = await getAssociatedTokenAddress(
    WSOL_MINT,
    poolPubkey,
    true
  );

  // Create user's associated token accounts
  const userPYUSDAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    provider.wallet.publicKey
  );
  const userWSOLAccount = await getAssociatedTokenAddress(
    WSOL_MINT,
    provider.wallet.publicKey
  );

  // Initialize the pool
  const tx = await program.methods
    .initializePool()
    .accounts({
      // @ts-expect-error Anchor is annoying as fuck.
      pool: poolPubkey,
      tokenMint0: PYUSD_MINT,
      tokenMint1: WSOL_MINT,
      poolTokenAccount0: poolPYUSDAccount,
      poolTokenAccount1: poolWSOLAccount,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log('Pool initialized. Transaction signature:', tx);

  // Transfer initial liquidity
  const transferTx = new web3.Transaction();

  // Transfer PYUSD
  transferTx.add(
    createTransferInstruction(
      userPYUSDAccount,
      poolPYUSDAccount,
      provider.wallet.publicKey,
      PYUSD_AMOUNT
    )
  );

  // Transfer WSOL
  transferTx.add(
    createTransferInstruction(
      userWSOLAccount,
      poolWSOLAccount,
      provider.wallet.publicKey,
      WSOL_AMOUNT
    )
  );

  const transferSig = await provider.sendAndConfirm(transferTx);
  console.log(
    'Initial liquidity transferred. Transaction signature:',
    transferSig
  );
}

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
  await createPYUSDWSOLPool(provider);
};
