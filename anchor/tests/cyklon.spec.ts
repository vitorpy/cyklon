import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Cyklon } from '../target/types/cyklon';
import { createAccount, createMint, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

const convertToSigner = (wallet: anchor.Wallet): anchor.web3.Signer => ({
  publicKey: wallet.publicKey,
  secretKey: wallet.payer.secretKey,
});

describe('cyklon', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Cyklon as Program<Cyklon>;

  let poolPubkey: anchor.web3.PublicKey;
  let tokenMint0: anchor.web3.PublicKey;
  let tokenMint1: anchor.web3.PublicKey;
  let userTokenAccount0: anchor.web3.PublicKey;
  let userTokenAccount1: anchor.web3.PublicKey;
  let poolTokenAccount0: anchor.web3.PublicKey;
  let poolTokenAccount1: anchor.web3.PublicKey;

  const setupMint = async () => {
    // Airdrop 10 SOL to the payer wallet
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // Create token mints for testing
    const signer = convertToSigner(payer);
    tokenMint0 = await createMint(provider.connection, signer, signer.publicKey, null, 6);
    tokenMint1 = await createMint(provider.connection, signer, signer.publicKey, null, 6);

    // Find the pool PDA
    [poolPubkey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
      program.programId
    );
    
    console.log(
      `Payer: ${payer.publicKey.toBase58()}
Pool PDA: ${poolPubkey.toBase58()}
Token Mint 0: ${tokenMint0.toBase58()}
Token Mint 1: ${tokenMint1.toBase58()}`
    );
  };
  
  const setupPool = async () => {
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
  };
  
  it('Initialize Pool', async () => {
    await setupMint();
    await setupPool();

    const poolAccount = await program.account.pool.fetch(poolPubkey);
    expect(poolAccount.tokenMint0.equals(tokenMint0)).toBe(true);
    expect(poolAccount.tokenMint1.equals(tokenMint1)).toBe(true);
  });
  
  let poolPda;
  it('Add Liquidity', async () => {
    // Create user token accounts (ATAs)
    const userTokenAccount0 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint0,
      payer.publicKey
    );
    const userTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint1,
      payer.publicKey
    );

    // Create pool token accounts (ATAs)
    const poolTokenAccount0 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint0,
      poolPubkey,
      true
    );
    const poolTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint1,
      poolPubkey,
      true
    );

    // Mint tokens to the user
    const amount0 = 1000000; // 1 token with 6 decimals
    const amount1 = 2000000; // 2 tokens with 6 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenMint0, userTokenAccount0.address, convertToSigner(payer), amount0);
    await mintTo(provider.connection, convertToSigner(payer), tokenMint1, userTokenAccount1.address, convertToSigner(payer), amount1);

    // Add liquidity
    const tickLower = -10;
    const tickUpper = 10;
    
    try {
      // Derive the pool PDA (if not already done)
      [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
        program.programId
      );

      // Derive the user position PDA
      const [userPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("position"), poolPda.toBuffer(), payer.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .addLiquidity(
          new anchor.BN(amount0),
          new anchor.BN(amount1),
          tickLower,
          tickUpper
        )
        .accounts({
          // @ts-expect-error ts complains but anchor fails to run if its missing
          pool: poolPda,
          userTokenAccount0: userTokenAccount0.address,
          userTokenAccount1: userTokenAccount1.address,
          poolTokenAccount0: poolTokenAccount0.address,
          poolTokenAccount1: poolTokenAccount1.address,
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
          user: payer.publicKey,
          userPosition: userPositionPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .rpc();

      // Fetch the pool account after adding liquidity
      const updatedPoolAccount = await program.account.pool.fetch(poolPubkey);

      // Check if liquidity has been added
      expect(updatedPoolAccount.liquidity.toNumber()).toBeGreaterThan(0);

      // Fetch user token accounts to verify balance changes
      const userAccount0Info = await getAccount(provider.connection, userTokenAccount0.address);
      const userAccount1Info = await getAccount(provider.connection, userTokenAccount1.address);

      // Check if tokens have been transferred from user accounts
      expect(Number(userAccount0Info.amount)).toBeLessThan(amount0);
      expect(Number(userAccount1Info.amount)).toBeLessThan(amount1);

    } catch (error) {
      console.error("Error adding liquidity:", error);
      throw error;
    }
  }, 10000000);

  it('Confidential Swap', async () => {
    const poolAccount = await program.account.pool.fetch(poolPda);

    // Create user token accounts
    const userTokenAccount0 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint0,
      payer.publicKey
    );
    const userTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint1,
      payer.publicKey
    );

    // Mint tokens to the user
    const amountToMint = 1000000; // 1 token with 6 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenMint0, userTokenAccount0.address, convertToSigner(payer), amountToMint);

    // Create pool token accounts (if not already created)
    const poolTokenAccount0 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint0,
      poolPubkey,
      true
    );
    const poolTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenMint1,
      poolPubkey,
      true
    );

    // Generate a valid zero-knowledge proof
    const privateAmountIn = 100000; // 0.1 token
    const privateZeroForOne = 1; // Swapping token0 for token1
    
    const amountIn = new anchor.BN(privateAmountIn);
    const publicInputs = {
      publicSqrtPrice: poolAccount.sqrtPrice.toString(),
      publicLiquidity: poolAccount.liquidity.toString(),
      publicAmountInMax: (2 * amountIn).toString(),
      publicMinimumAmountOut: "0" // Set a minimum amount out if desired
    };

    const privateInputs = {
      privateAmountIn: privateAmountIn.toString(),
      privateZeroForOne: privateZeroForOne.toString()
    };

    const { proof, publicSignals } = await generateProof(
      'swap',
      privateInputs,
      publicInputs
    );

    // Perform the swap
    try {
      await program.methods
        .confidentialSwap(
          new anchor.BN(publicInputs.publicAmountInMax),
          new anchor.BN(publicInputs.publicMinimumAmountOut),
          proof,
          publicSignals
        )
        .accounts({
          // @ts-expect-error ts complains but anchor fails to run if its missing
          pool: poolPda,
          userTokenAccountIn: userTokenAccount0.address,
          userTokenAccountOut: userTokenAccount1.address,
          poolTokenAccount0: poolTokenAccount0.address,
          poolTokenAccount1: poolTokenAccount1.address,
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
          user: payer.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Check the results
      const userAccount0AfterSwap = await getAccount(provider.connection, userTokenAccount0.address);
      const userAccount1AfterSwap = await getAccount(provider.connection, userTokenAccount1.address);

      // Verify that tokens were swapped
      expect(Number(userAccount0AfterSwap.amount)).toBeLessThan(amountToMint);
      expect(Number(userAccount1AfterSwap.amount)).toBeGreaterThan(0);

      // Verify pool balances (optional, depending on your implementation)
      const poolAccount0AfterSwap = await getAccount(provider.connection, poolTokenAccount0.address);
      const poolAccount1AfterSwap = await getAccount(provider.connection, poolTokenAccount1.address);

      expect(Number(poolAccount0AfterSwap.amount)).toBeGreaterThan(0);
      expect(Number(poolAccount1AfterSwap.amount)).toBeGreaterThan(0);

    } catch (error) {
      console.error("Error performing confidential swap:", error);
      throw error;
    }
  }, 10000000);
});

// Add this function at the end of the file
async function generateProof(
  circuit: string,
  privateInputs: any,
  publicInputs: any
): Promise<{ proof: Buffer; publicSignals: anchor.BN[] }> {
  // This is a placeholder. You need to implement the actual proof generation
  // using a ZK proving system like SnarkJS or a custom prover
  console.log("Generating proof for inputs:", { privateInputs, publicInputs });
  
  // Simulate proof generation (replace with actual implementation)
  const proof = Buffer.from("simulated_proof_data");
  const publicSignals = Object.values(publicInputs).map(
    (value) => new anchor.BN(value)
  );

  return { proof, publicSignals };
}
