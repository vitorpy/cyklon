import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Cyklon } from '../target/types/cyklon';
import { createMint, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

const convertToSigner = (wallet: anchor.Wallet): anchor.web3.Signer => ({
  publicKey: wallet.publicKey,
  secretKey: wallet.payer.secretKey,
});

describe('cyklon', () => {
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
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    const signer = convertToSigner(payer);
    tokenMint0 = await createMint(provider.connection, signer, signer.publicKey, null, 6);
    tokenMint1 = await createMint(provider.connection, signer, signer.publicKey, null, 6);

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
        .initializePool()
        .accounts({
          pool: poolPubkey,
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
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
  
  it('Add Liquidity', async () => {
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

    const amount0 = 1000000; // 1 token with 6 decimals
    const amount1 = 2000000; // 2 tokens with 6 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenMint0, userTokenAccount0.address, convertToSigner(payer), amount0);
    await mintTo(provider.connection, convertToSigner(payer), tokenMint1, userTokenAccount1.address, convertToSigner(payer), amount1);

    try {
      await program.methods
        .addLiquidity(
          new anchor.BN(amount0),
          new anchor.BN(amount1)
        )
        .accounts({
          pool: poolPubkey,
          userTokenAccount0: userTokenAccount0.address,
          userTokenAccount1: userTokenAccount1.address,
          poolTokenAccount0: poolTokenAccount0.address,
          poolTokenAccount1: poolTokenAccount1.address,
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
          user: payer.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const updatedPoolAccount = await program.account.pool.fetch(poolPubkey);

      expect(updatedPoolAccount.reserve0.toNumber()).toBe(amount0);
      expect(updatedPoolAccount.reserve1.toNumber()).toBe(amount1);

      const userAccount0Info = await getAccount(provider.connection, userTokenAccount0.address);
      const userAccount1Info = await getAccount(provider.connection, userTokenAccount1.address);

      expect(Number(userAccount0Info.amount)).toBe(0);
      expect(Number(userAccount1Info.amount)).toBe(0);

    } catch (error) {
      console.error("Error adding liquidity:", error);
      throw error;
    }
  });

  it('Confidential Swap', async () => {
    const poolAccount = await program.account.pool.fetch(poolPubkey);

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

    const amountToMint = 1000000; // 1 token with 6 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenMint0, userTokenAccount0.address, convertToSigner(payer), amountToMint);

    const privateAmountIn = 100000; // 0.1 token
    const privateZeroForOne = 1; // Swapping token0 for token1
    
    const amountIn = new anchor.BN(privateAmountIn);
    const publicInputs = {
      publicReserve0: poolAccount.reserve0.toString(),
      publicReserve1: poolAccount.reserve1.toString(),
      publicAmountInMax: (2 * amountIn).toString(),
      publicMinimumAmountOut: "0" // Set a minimum amount out if desired
    };

    const privateInputs = {
      privateAmountIn: privateAmountIn.toString(),
      privateSlippage: "100", // 1% slippage
      privateZeroForOne: privateZeroForOne.toString()
    };

    const { proof, publicSignals } = await generateProof(
      'swap',
      privateInputs,
      publicInputs
    );

    try {
      await program.methods
        .confidentialSwap(
          proof,
          publicSignals
        )
        .accounts({
          pool: poolPubkey,
          userTokenAccountIn: userTokenAccount0.address,
          userTokenAccountOut: userTokenAccount1.address,
          poolTokenAccount0: poolTokenAccount0.address,
          poolTokenAccount1: poolTokenAccount1.address,
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
          user: payer.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const userAccount0AfterSwap = await getAccount(provider.connection, userTokenAccount0.address);
      const userAccount1AfterSwap = await getAccount(provider.connection, userTokenAccount1.address);

      expect(Number(userAccount0AfterSwap.amount)).toBeLessThan(amountToMint);
      expect(Number(userAccount1AfterSwap.amount)).toBeGreaterThan(0);

      const poolAccount0AfterSwap = await getAccount(provider.connection, poolTokenAccount0.address);
      const poolAccount1AfterSwap = await getAccount(provider.connection, poolTokenAccount1.address);

      expect(Number(poolAccount0AfterSwap.amount)).toBeGreaterThan(0);
      expect(Number(poolAccount1AfterSwap.amount)).toBeGreaterThan(0);

    } catch (error) {
      console.error("Error performing confidential swap:", error);
      throw error;
    }
  });
});

async function generateProof(
  circuit: string,
  privateInputs: any,
  publicInputs: any
): Promise<{ proof: Buffer; publicSignals: anchor.BN[] }> {
  console.log("Generating proof for inputs:", { privateInputs, publicInputs });
  
  const proof = Buffer.from("simulated_proof_data");
  const publicSignals = Object.values(publicInputs).map(
    (value) => new anchor.BN(value)
  );

  return { proof, publicSignals };
}
