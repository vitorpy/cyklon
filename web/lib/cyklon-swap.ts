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
    
    console.log(`Token order:
      token0: ${token0.toBase58()} (decimals: ${sourceToken.equals(token0) ? sourceDecimals : destDecimals})
      token1: ${token1.toBase58()} (decimals: ${sourceToken.equals(token0) ? destDecimals : sourceDecimals})
    `);

    // Fetch pool account data
    const poolAccount = await program.account.pool.fetch(poolPubkey);
    console.log(`Pool account data:
      reserve0: ${poolAccount.reserve0.toString()}
      reserve1: ${poolAccount.reserve1.toString()}
    `);

    // Determine if we're swapping from token0 to token1 or vice versa
    const isSwapXtoY = sourceToken.equals(token0) ? 1 : 0;
    console.log(`isSwapXtoY: ${isSwapXtoY}`);

    // Prepare inputs for proof generation
    const publicInputs = {
      publicBalanceX: poolAccount.reserve0.toString(),
      publicBalanceY: poolAccount.reserve1.toString(),
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

    // Ensure the correct order of token accounts in the instruction
    const [orderedUserTokenAccountIn, orderedUserTokenAccountOut] = isSwapXtoY
      ? [userSourceTokenAccount, userDestTokenAccount]
      : [userDestTokenAccount, userSourceTokenAccount];

    const [orderedPoolTokenAccount0, orderedPoolTokenAccount1] = isSwapXtoY
      ? [poolSourceTokenAccount, poolDestTokenAccount]
      : [poolDestTokenAccount, poolSourceTokenAccount];

    const accounts = {
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
    };
    
    for (const [key, value] of Object.entries(accounts)) {
      console.log(`Account ${key}: ${value.toBase58()}`);
    }

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
        .accounts(accounts)
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
