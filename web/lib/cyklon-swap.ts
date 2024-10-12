'use client'

import { AnchorProvider, utils } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getCyklonProgram, getCyklonProgramId } from '@blackpool/anchor';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { useCluster } from '../components/cluster/cluster-data-access';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { generateProof } from './prepare-proof';

export interface SwapResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export async function prepareConfidentialSwap(
  provider: AnchorProvider,
  programId: PublicKey,
  sourceToken: PublicKey,
  destToken: PublicKey,
  amount: bigint,
  minReceived: bigint,
  sourceTokenProgram: string,
  destTokenProgram: string,
  sourceDecimals: number,
  destDecimals: number
): Promise<SwapResult> {
  try {
    console.log(`Swap parameters:
      sourceToken: ${sourceToken.toBase58()}
      destToken: ${destToken.toBase58()}
      amount: ${amount}
      minReceived: ${minReceived}
      sourceDecimals: ${sourceDecimals}
      destDecimals: ${destDecimals}
    `);

    const program = getCyklonProgram(provider);
    const payer = provider.wallet;

    // Sort token public keys to ensure consistent pool seed calculation
    const [tokenX, tokenY] = [sourceToken, destToken].sort((a, b) => 
      a.toBuffer().compare(b.toBuffer())
    );

    // Determine if we're swapping from X to Y
    const isSwapXtoY = sourceToken.equals(tokenX) ? 1 : 0;

    // Find pool PDA using sorted token public keys
    const [poolPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenX.toBuffer(), tokenY.toBuffer()],
      programId
    );

    // Determine the token program for each token
    const tokenXProgramId = tokenX.equals(sourceToken) ? (sourceTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID) : (destTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID);
    const tokenYProgramId = tokenY.equals(destToken) ? (destTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID) : (sourceTokenProgram === 'Token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID);

    // Get user token account addresses
    const userTokenAccountX = await getAssociatedTokenAddress(
      tokenX,
      payer.publicKey,
      false,
      tokenXProgramId
    );
    const userTokenAccountY = await getAssociatedTokenAddress(
      tokenY,
      payer.publicKey,
      false,
      tokenYProgramId
    );

    // Get pool token account addresses
    const poolTokenAccountX = await getAssociatedTokenAddress(
      tokenX,
      poolPubkey,
      true,
      tokenXProgramId
    );
    const poolTokenAccountY = await getAssociatedTokenAddress(
      tokenY,
      poolPubkey,
      true,
      tokenYProgramId
    );
    
    // Fetch pool account data
    const poolAccount = await program.account.pool.fetch(poolPubkey);
    console.log(`Pool account data:
      reserveX: ${poolAccount.reserveX.toString()}
      reserveY: ${poolAccount.reserveY.toString()}
    `);

    console.log(`Token order:
      tokenX: ${tokenX.toBase58()} (decimals: ${tokenX.equals(sourceToken) ? sourceDecimals : destDecimals})
      tokenY: ${tokenY.toBase58()} (decimals: ${tokenY.equals(destToken) ? destDecimals : sourceDecimals})
      isSwapXtoY: ${isSwapXtoY}
    `);

    // Prepare inputs for proof generation
    const publicInputs = {
      publicBalanceX: poolAccount.reserveX.toString(),
      publicBalanceY: poolAccount.reserveY.toString(),
      isSwapXtoY: isSwapXtoY
    };

    const privateInputs = {
      privateInputAmount: amount.toString(),
      privateMinReceived: minReceived.toString()
    };

    console.log(`Circuit inputs:
      privateInputAmount: ${privateInputs.privateInputAmount}
      privateMinReceived: ${privateInputs.privateMinReceived}
      publicBalanceX: ${publicInputs.publicBalanceX}
      publicBalanceY: ${publicInputs.publicBalanceY}
      isSwapXtoY: ${publicInputs.isSwapXtoY}
    `);

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          publicSignals.map((signal: any) => Array.from(signal))
        )
        .accountsPartial({
          tokenMintX: tokenX,
          tokenMintY: tokenY,
          tokenMintXProgram: tokenXProgramId,
          tokenMintYProgram: tokenYProgramId,
          pool: poolPubkey,
          userTokenAccountX: userTokenAccountX,
          userTokenAccountY: userTokenAccountY,
          poolTokenAccountX: poolTokenAccountX,
          poolTokenAccountY: poolTokenAccountY,
          user: payer.publicKey,
          associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );

    return { success: true, transaction };
  } catch (error) {
    console.error('Error preparing confidential swap:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function useConfidentialSwap() {
  const provider = useAnchorProvider();
  const { cluster } = useCluster();

  // @ts-expect-error Weird typing issues.
  const programId = getCyklonProgramId(cluster);

  return async (sourceToken: PublicKey, destToken: PublicKey, amount: bigint, minReceived: bigint, sourceTokenProgram: string, destTokenProgram: string, sourceDecimals: number, destDecimals: number): Promise<SwapResult> => {
    return prepareConfidentialSwap(provider, programId, sourceToken, destToken, amount, minReceived, sourceTokenProgram, destTokenProgram, sourceDecimals, destDecimals);
  };
}
