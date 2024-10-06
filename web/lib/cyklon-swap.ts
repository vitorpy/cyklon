import { AnchorProvider, utils } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getCyklonProgram, getCyklonProgramId } from '@blackpool/anchor';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { useCluster } from '../components/cluster/cluster-data-access';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as snarkjs from 'snarkjs';
import * as path from 'path';
// @ts-expect-error ffjavascript is not typed.
import { buildBn128, utils as ffUtils } from 'ffjavascript';
import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "@blackpool/anchor";

const { unstringifyBigInts } = ffUtils;

export interface SwapResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

async function generateProof(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  privateInputs: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  console.log("Original proof:", JSON.stringify(proof, null, 2));
  console.log("Public signals:", JSON.stringify(publicSignals, null, 2));

  const curve = await buildBn128();
  const proofProc = unstringifyBigInts(proof);
  const publicSignalsUnstrigified = unstringifyBigInts(publicSignals);

  let proofA = g1Uncompressed(curve, proofProc.pi_a);
  proofA = await negateAndSerializeG1(curve, proofA);

  const proofB = g2Uncompressed(curve, proofProc.pi_b);
  const proofC = g1Uncompressed(curve, proofProc.pi_c);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedPublicSignals = publicSignalsUnstrigified.map((signal: any) => {
    return to32ByteBuffer(BigInt(signal));
  });

  return { 
    proofA: new Uint8Array(proofA), 
    proofB: new Uint8Array(proofB), 
    proofC: new Uint8Array(proofC), 
    publicSignals: formattedPublicSignals 
  };
}

export async function prepareConfidentialSwap(
  provider: AnchorProvider,
  programId: PublicKey,
  sourceToken: PublicKey,
  destToken: PublicKey,
  amount: number,
  minReceived: number
): Promise<SwapResult> {
  try {
    const program = getCyklonProgram(provider);
    const payer = provider.wallet;

    // Find pool PDA
    const [poolPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), sourceToken.toBuffer(), destToken.toBuffer()],
      programId
    );

    // Get user token accounts
    const userTokenAccountIn = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      // @ts-expect-error Anchor is finnick.
      payer.payer,
      sourceToken,
      payer.publicKey
    );
    const userTokenAccountOut = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      // @ts-expect-error Anchor is finnick.
      payer.payer,
      destToken,
      payer.publicKey
    );

    // Get pool token accounts
    const poolTokenAccount0 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      // @ts-expect-error Anchor is finnick.
      payer.payer,
      sourceToken,
      poolPubkey,
      true
    );
    const poolTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      // @ts-expect-error Anchor is finnick.
      payer.payer,
      destToken,
      poolPubkey,
      true
    );

    // Fetch pool account data
    const poolAccount = await program.account.pool.fetch(poolPubkey);

    // Prepare inputs for proof generation
    const publicInputs = {
      publicBalanceX: poolAccount.reserve0.toNumber(),
      publicBalanceY: poolAccount.reserve1.toNumber(),
      isSwapXtoY: 1, // Assuming we're always swapping from token0 to token1
      totalLiquidity: poolAccount.reserve0.toNumber() + poolAccount.reserve1.toNumber()
    };

    const privateInputs = {
      privateAmount: amount,
      privateMinReceived: minReceived
    };

    // Generate proof
    const { proofA, proofB, proofC, publicSignals } = await generateProof(
      privateInputs,
      publicInputs
    );

    // Create the transaction
    const transaction = new Transaction();

    // Add the confidential swap instruction to the transaction
    transaction.add(
      await program.methods
        .confidentialSwap(
          Array.from(proofA),
          Array.from(proofB),
          Array.from(proofC),
          publicSignals.map(signal => Array.from(signal))
        )
        .accounts({
          // @ts-expect-error Anchor is finnick.
          pool: poolPubkey,
          userTokenAccountIn: userTokenAccountIn.address,
          userTokenAccountOut: userTokenAccountOut.address,
          poolTokenAccount0: poolTokenAccount0.address,
          poolTokenAccount1: poolTokenAccount1.address,
          tokenMint0: sourceToken,
          tokenMint1: destToken,
          user: payer.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );

    return { success: true, transaction };
  } catch (error) {
    console.error('Error preparing confidential swap:', error);
    return { success: false, error: error as string };
  }
}

export function useConfidentialSwap() {
  const provider = useAnchorProvider();
  const { cluster } = useCluster();

  // @ts-expect-error Weird typing issues.
  const programId = getCyklonProgramId(cluster);

  return async (sourceToken: PublicKey, destToken: PublicKey, amount: number, minReceived: number): Promise<SwapResult> => {
    return prepareConfidentialSwap(provider, programId, sourceToken, destToken, amount, minReceived);
  };
}