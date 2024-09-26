import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Cyklon } from '../target/types/cyklon';
import { createMint, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as snarkjs from "snarkjs";
import * as path from "path";
import { buildBn128, utils } from "ffjavascript";
const { unstringifyBigInts } = utils;

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
          tokenMint0: tokenMint0,
          tokenMint1: tokenMint1,
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
    
    const amountToMint = 1000000; // 1 token with 6 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenMint0, userTokenAccount0.address, convertToSigner(payer), amountToMint);

    const privateAmount = 100000; // 0.1 token
    const privateMinReceived = 99000; // 0.099 token (1% slippage)
    const isSwapXtoY = 1; // Swapping token0 for token1
    
    const publicInputs = {
      publicBalanceX: poolAccount.reserve0.toNumber(),
      publicBalanceY: poolAccount.reserve1.toNumber(),
      isSwapXtoY: isSwapXtoY,
      totalLiquidity: poolAccount.reserve0.toNumber() + poolAccount.reserve1.toNumber()
    };

    const privateInputs = {
      privateAmount: privateAmount,
      privateMinReceived: privateMinReceived
    };

    const { proofA, proofB, proofC, publicSignals } = await generateProof(
      privateInputs,
      publicInputs
    );

    try {
      await program.methods
        .confidentialSwap(
          Array.from(proofA),
          Array.from(proofB),
          Array.from(proofC),
          publicSignals.map(signal => Array.from(signal))
        )
        .accounts({
          // @ts-expect-error Anchor is annoying as fuck.
          pool: poolPubkey,
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
  }, 10000000);
});

async function generateProof(
  privateInputs: any,
  publicInputs: any
): Promise<{ proofA: Uint8Array, proofB: Uint8Array, proofC: Uint8Array, publicSignals: Uint8Array[] }> {
  console.log("Generating proof for inputs:", { privateInputs, publicInputs });

  const wasmPath = path.join(__dirname, "../../swap_js", "swap.wasm");
  const zkeyPath = path.join(__dirname, "../../", "swap_final.zkey");

  const input = {
    privateAmount: privateInputs.privateAmount.toString(),
    privateMinReceived: privateInputs.privateMinReceived.toString(),
    publicBalanceX: publicInputs.publicBalanceX.toString(),
    publicBalanceY: publicInputs.publicBalanceY.toString(),
    isSwapXtoY: publicInputs.isSwapXtoY.toString(),
    totalLiquidity: publicInputs.totalLiquidity.toString()
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  const curve = await buildBn128();
  const proofProc = unstringifyBigInts(proof);
  const publicSignalsProc = unstringifyBigInts(publicSignals);

  const proofA = curve.G1.toUncompressed(curve.G1.fromObject(proofProc.pi_a));
  const proofB = curve.G2.toUncompressed(curve.G2.fromObject(proofProc.pi_b));
  const proofC = curve.G1.toUncompressed(curve.G1.fromObject(proofProc.pi_c));

  // Create two 32-byte arrays for public signals
  const formattedPublicSignals = [
    new Uint8Array(32),
    new Uint8Array(32)
  ];

  // Fill the last 8 bytes of each public signal with the actual values
  const newBalanceX = new anchor.BN(publicSignalsProc[0]).toArray('be', 8);
  const newBalanceY = new anchor.BN(publicSignalsProc[1]).toArray('be', 8);

  formattedPublicSignals[0].set(newBalanceX, 24);
  formattedPublicSignals[1].set(newBalanceY, 24);

  return { 
    proofA: new Uint8Array(proofA.slice(0, 64)), 
    proofB: new Uint8Array(proofB), 
    proofC: new Uint8Array(proofC.slice(0, 64)), 
    publicSignals: formattedPublicSignals 
  };
}
