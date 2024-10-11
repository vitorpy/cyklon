import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Cyklon } from '../target/types/cyklon';
import { createMint, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as snarkjs from "snarkjs";
import * as path from "path";
import { buildBn128, utils } from "ffjavascript";
const { unstringifyBigInts } = utils;
import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "../src/utils";

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
  let tokenX: anchor.web3.PublicKey;
  let tokenY: anchor.web3.PublicKey;
  const tokenMint0Decimals = 6;
  const tokenMint1Decimals = 9;  // Updated to 9 decimals

  const setupMint = async () => {
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    const signer = convertToSigner(payer);
    const tokenMint0 = await createMint(provider.connection, signer, signer.publicKey, null, tokenMint0Decimals);
    const tokenMint1 = await createMint(provider.connection, signer, signer.publicKey, null, tokenMint1Decimals);

    // Sort token mints by address
    if (tokenMint0.toBuffer().compare(tokenMint1.toBuffer()) < 0) {
      tokenX = tokenMint0;
      tokenY = tokenMint1;
    } else {
      tokenX = tokenMint1;
      tokenY = tokenMint0;
    }

    [poolPubkey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenX.toBuffer(), tokenY.toBuffer()],
      program.programId
    );
    
    console.log(
      `Payer: ${payer.publicKey.toBase58()}
Pool PDA: ${poolPubkey.toBase58()}
Token X: ${tokenX.toBase58()}
Token Y: ${tokenY.toBase58()}`
    );
  };
  
  const setupPool = async () => {
    try {
      await program.methods
        .initializePool()
        .accounts({
          tokenMint0: tokenX,
          tokenMint1: tokenY,
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
    expect(poolAccount.tokenMint0.equals(tokenX)).toBe(true);
    expect(poolAccount.tokenMint1.equals(tokenY)).toBe(true);
  });
  
  it('Add Liquidity', async () => {
    const userTokenAccountX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenX,
      payer.publicKey
    );
    const userTokenAccountY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenY,
      payer.publicKey
    );

    const poolTokenAccountX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenX,
      poolPubkey,
      true
    );
    const poolTokenAccountY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenY,
      poolPubkey,
      true
    );

    const amountX = 1_000_000; // 1 token with 6 decimals
    const amountY = 2_000_000_000; // 2 tokens with 9 decimals
    await mintTo(provider.connection, convertToSigner(payer), tokenX, userTokenAccountX.address, convertToSigner(payer), amountX);
    await mintTo(provider.connection, convertToSigner(payer), tokenY, userTokenAccountY.address, convertToSigner(payer), amountY);

    try {
      await program.methods
        .addLiquidity(
          new anchor.BN(amountX),
          new anchor.BN(amountY)
        )
        .accounts({
          pool: poolPubkey,
          userTokenAccount0: userTokenAccountX.address,
          userTokenAccount1: userTokenAccountY.address,
          poolTokenAccount0: poolTokenAccountX.address,
          poolTokenAccount1: poolTokenAccountY.address,
          tokenMint0: tokenX,
          tokenMint1: tokenY,
          user: payer.publicKey,
          tokenMint0Program: anchor.utils.token.TOKEN_PROGRAM_ID,
          tokenMint1Program: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .rpc();

      const updatedPoolAccount = await program.account.pool.fetch(poolPubkey);

      expect(updatedPoolAccount.reserve0.toNumber()).toBe(amountX);
      expect(updatedPoolAccount.reserve1.toNumber()).toBe(amountY);

      const userAccountXInfo = await getAccount(provider.connection, userTokenAccountX.address);
      const userAccountYInfo = await getAccount(provider.connection, userTokenAccountY.address);

      expect(Number(userAccountXInfo.amount)).toBe(0);
      expect(Number(userAccountYInfo.amount)).toBe(0);

    } catch (error) {
      console.error("Error adding liquidity:", error);
      throw error;
    }
  });

  it('Confidential Swap', async () => {
    const poolAccount = await program.account.pool.fetch(poolPubkey);

    const userTokenAccountX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenX,
      payer.publicKey
    );
    const userTokenAccountY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenY,
      payer.publicKey
    );

    const poolTokenAccountX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenX,
      poolPubkey,
      true
    );
    const poolTokenAccountY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      convertToSigner(payer),
      tokenY,
      poolPubkey,
      true
    );
    
    const amountToMint = 1_000_000; // 1 token with 6 decimals for tokenX
    await mintTo(provider.connection, convertToSigner(payer), tokenX, userTokenAccountX.address, convertToSigner(payer), amountToMint);

    const publicInputs = {
      publicBalanceX: poolAccount.reserve0.toString(),
      publicBalanceY: poolAccount.reserve1.toString(),
      isSwapXtoY: 1 // Swapping tokenX for tokenY
    };

    const privateInputs = {
      privateInputAmount: "100000", // 0.1 token of tokenX
      privateMinReceived: "180000000" // Adjust this based on your expected output
    };

    const { proofA, proofB, proofC, publicSignals } = await generateProof(
      privateInputs,
      publicInputs
    );
    
    console.log("Accounts passed to the transaction:");
    console.log({
      pool: poolPubkey.toBase58(),
      userTokenAccountIn: userTokenAccountX.address.toBase58(),
      userTokenAccountOut: userTokenAccountY.address.toBase58(),
      poolTokenAccount0: poolTokenAccountX.address.toBase58(),
      poolTokenAccount1: poolTokenAccountY.address.toBase58(),
      tokenMint0: tokenX.toBase58(),
      tokenMint1: tokenY.toBase58(),
    });

    try {
      const tx = await program.methods
        .confidentialSwap(
          Array.from(proofA),
          Array.from(proofB),
          Array.from(proofC),
          publicSignals.map(signal => Array.from(signal))
        )
        .accounts({
          // @ts-expect-error Anchor is annoying as fuck.
          pool: poolPubkey,
          userTokenAccountIn: userTokenAccountX.address,
          userTokenAccountOut: userTokenAccountY.address,
          poolTokenAccount0: poolTokenAccountX.address,
          poolTokenAccount1: poolTokenAccountY.address,
          tokenMint0: tokenX,
          tokenMint1: tokenY,
          user: payer.publicKey,
          tokenMint0Program: anchor.utils.token.TOKEN_PROGRAM_ID,
          tokenMint1Program: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .transaction();

      tx.instructions.unshift(
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 2_000_000 })
      );

      await provider.sendAndConfirm(tx);

      const userAccountXAfterSwap = await getAccount(provider.connection, userTokenAccountX.address);
      const userAccountYAfterSwap = await getAccount(provider.connection, userTokenAccountY.address);

      expect(Number(userAccountXAfterSwap.amount)).toBeLessThan(amountToMint);
      expect(Number(userAccountYAfterSwap.amount)).toBeGreaterThan(0);

      const poolAccountXAfterSwap = await getAccount(provider.connection, poolTokenAccountX.address);
      const poolAccountYAfterSwap = await getAccount(provider.connection, poolTokenAccountY.address);

      expect(Number(poolAccountXAfterSwap.amount)).toBeGreaterThan(0);
      expect(Number(poolAccountYAfterSwap.amount)).toBeGreaterThan(0);

    } catch (error) {
      console.error("Error performing confidential swap:", error);
      throw error;
    }
  }, 10000000);
});

async function generateProof(
  privateInputs: { privateInputAmount: string, privateMinReceived: string },
  publicInputs: { publicBalanceX: string, publicBalanceY: string, isSwapXtoY: number }
): Promise<{ proofA: Uint8Array, proofB: Uint8Array, proofC: Uint8Array, publicSignals: Uint8Array[] }> {
  console.log("Generating proof for inputs:", { privateInputs, publicInputs });

  const wasmPath = path.join(__dirname, "../../circuits/swap_js", "swap.wasm");
  const zkeyPath = path.join(__dirname, "../../circuits", "swap_0001.zkey");

  const input = {
    privateInputAmount: privateInputs.privateInputAmount,
    privateMinReceived: privateInputs.privateMinReceived,
    publicBalanceX: publicInputs.publicBalanceX,
    publicBalanceY: publicInputs.publicBalanceY,
    isSwapXtoY: publicInputs.isSwapXtoY.toString()
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  console.log("Original proof:", JSON.stringify(proof, null, 2));
  console.log("Public signals:", JSON.stringify(publicSignals, null, 2));

  const curve = await buildBn128();
  const proofProc = unstringifyBigInts(proof);
  const publicSignalsUnstrigified = unstringifyBigInts(publicSignals);

  let proofA = g1Uncompressed(curve, proofProc.pi_a);
  proofA = await negateAndSerializeG1(curve, proofA);

  const proofB = g2Uncompressed(curve, proofProc.pi_b);
  const proofC = g1Uncompressed(curve, proofProc.pi_c);

  const formattedPublicSignals = publicSignalsUnstrigified.map(signal => {
    return to32ByteBuffer(BigInt(signal));
  });

  return { 
    proofA: new Uint8Array(proofA), 
    proofB: new Uint8Array(proofB), 
    proofC: new Uint8Array(proofC), 
    publicSignals: formattedPublicSignals 
  };
}