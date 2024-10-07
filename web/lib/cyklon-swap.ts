'use server'

import { AnchorProvider, utils } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getCyklonProgram, getCyklonProgramId } from '@blackpool/anchor';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { useCluster } from '../components/cluster/cluster-data-access';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import * as snarkjs from 'snarkjs';
import * as path from 'path';
// @ts-expect-error ffjavascript is not typed.
import { buildBn128, utils as ffUtils } from 'ffjavascript';
import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "@blackpool/anchor";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

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
  minReceived: number,
  sourceTokenProgram: string,
  destTokenProgram: string
): Promise<SwapResult> {
  'use server'
  
  try {
    const program = getCyklonProgram(provider);
    const payer = provider.wallet;

    // Sort token public keys to ensure consistent pool seed calculation
    const [token0, token1] = [sourceToken, destToken].sort((a, b) => 
      a.toBuffer().compare(b.toBuffer())
    );

    // Find pool PDA using sorted token public keys
    const [poolPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), token0.toBuffer(), token1.toBuffer()],
      programId
    );

    // Determine the token program for each token
    const sourceTokenProgramId = sourceTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    const destTokenProgramId = destTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    // Get user token account addresses
    const userSourceTokenAccount = await getAssociatedTokenAddress(
      sourceToken,
      payer.publicKey,
      false,
      sourceTokenProgramId
    );
    const userDestTokenAccount = await getAssociatedTokenAddress(
      destToken,
      payer.publicKey,
      false,
      destTokenProgramId
    );

    // Get pool token account addresses
    const poolSourceTokenAccount = await getAssociatedTokenAddress(
      sourceToken,
      poolPubkey,
      true,
      sourceTokenProgramId
    );
    const poolDestTokenAccount = await getAssociatedTokenAddress(
      destToken,
      poolPubkey,
      true,
      destTokenProgramId
    );

    // Fetch pool account data
    const poolAccount = await program.account.pool.fetch(poolPubkey);

    // Determine if we're swapping from token0 to token1 or vice versa
    const isSwapXtoY = sourceToken.equals(token0) ? 1 : 0;

    // Prepare inputs for proof generation
    const publicInputs = {
      publicBalanceX: poolAccount.reserve0.toNumber(),
      publicBalanceY: poolAccount.reserve1.toNumber(),
      isSwapXtoY: isSwapXtoY,
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
    
    

    // Ensure the correct order of token accounts in the instruction
    const [orderedUserTokenAccountIn, orderedUserTokenAccountOut] = isSwapXtoY
      ? [userSourceTokenAccount, userDestTokenAccount]
      : [userDestTokenAccount, userSourceTokenAccount];

    const [orderedPoolTokenAccount0, orderedPoolTokenAccount1] = isSwapXtoY
      ? [poolSourceTokenAccount, poolDestTokenAccount]
      : [poolDestTokenAccount, poolSourceTokenAccount];

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
          userTokenAccountIn: orderedUserTokenAccountIn,
          userTokenAccountOut: orderedUserTokenAccountOut,
          poolTokenAccount0: orderedPoolTokenAccount0,
          poolTokenAccount1: orderedPoolTokenAccount1,
          tokenMint0: token0,
          tokenMint1: token1,
          user: payer.publicKey,
          tokenMint0Program: token0.equals(sourceToken) ? sourceTokenProgramId : destTokenProgramId,
          tokenMint1Program: token1.equals(destToken) ? destTokenProgramId : sourceTokenProgramId,
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

  return async (sourceToken: PublicKey, destToken: PublicKey, amount: number, minReceived: number, sourceTokenProgram: string, destTokenProgram: string): Promise<SwapResult> => {
    return prepareConfidentialSwap(provider, programId, sourceToken, destToken, amount, minReceived, sourceTokenProgram, destTokenProgram);
  };
}