import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as spl from '@solana/spl-token';
import { createMint } from '@solana/spl-token';
import { Cyklon } from '../target/types/cyklon';
import { before } from 'node:test';

describe('cyklon', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Cyklon as Program<Cyklon>;

  let poolPubkey: anchor.web3.PublicKey;
  let tokenMint0: anchor.web3.PublicKey;
  let tokenMint1: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop 10 SOL to the payer wallet
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // Create token mints for testing
    const signer = {
      publicKey: payer.publicKey,
      secretKey: (payer as anchor.Wallet).payer.secretKey,
    };
    tokenMint0 = await createMint(provider.connection, signer, signer.publicKey, null, 6);
    tokenMint1 = await createMint(provider.connection, signer, signer.publicKey, null, 6);

    // Find the pool PDA
    [poolPubkey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );
    
    console.log(
      `Payer: ${payer.publicKey.toBase58()}
Pool PDA: ${poolPubkey.toBase58()}
Token Mint 0: ${tokenMint0.toBase58()}
Token Mint 1: ${tokenMint1.toBase58()}`
    );
  });

  it('Initialize Pool', async () => {
    try {
      await program.methods
        .initializePool(1, new anchor.BN(1))
      .accountsPartial({
        tokenMint0: tokenMint0.toBase58(),
        tokenMint1: tokenMint1.toBase58(),
        payer: payer.publicKey,
        })
        .rpc();
    } catch (error) {
      console.error("Error initializing pool:", error);
      throw error;
    }

    const poolAccount = await program.account.pool.fetch(poolPubkey);
    expect(poolAccount.tokenMint0.equals(tokenMint0)).toBe(true);
    expect(poolAccount.tokenMint1.equals(tokenMint1)).toBe(true);
  });

  it('Confidential Swap', async () => {
    // This is a placeholder test. In a real scenario, you'd need to:
    // 1. Create user token accounts
    // 2. Mint some tokens to the user
    // 3. Create pool token accounts
    // 4. Generate a valid zero-knowledge proof
    // 5. Perform the swap
    // 6. Check the results

    // For now, we'll just check if the method exists
    expect(typeof program.methods.confidentialSwap).toBe('function');
  });
});
