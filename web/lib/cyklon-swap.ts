import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getCyklonProgram, getCyklonProgramId } from '@blackpool/anchor';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { useCluster } from '../components/cluster/cluster-data-access';

export interface SwapResult {
  success: boolean;
  amount?: number;
  error?: string;
}

export async function performConfidentialSwap(
  provider: AnchorProvider,
  programId: PublicKey,
  sourceToken: string,
  destToken: string,
  amount: number
): Promise<SwapResult> {
  try {
    const program = getCyklonProgram(provider);

    // This is a placeholder for the actual confidential swap method
    // You'll need to replace this with the actual method call from your Cyklon program
    const result = await program.methods.confidentialSwap(
    // @ts-expect-error TODO
      sourceToken,
      destToken,
      amount
    ).rpc();

    // Assuming the swap was successful if we reach this point
    return { success: true, amount: amount };
  } catch (error) {
    console.error('Error performing confidential swap:', error);
    // @ts-expect-error TODO
    return { success: false, error: error.message };
  }
}

export function useConfidentialSwap() {
  const provider = useAnchorProvider();
  const { cluster } = useCluster();
  // @ts-expect-error TODO
  const programId = getCyklonProgramId(cluster.network);

  return async (sourceToken: string, destToken: string, amount: number): Promise<SwapResult> => {
    return performConfidentialSwap(provider, programId, sourceToken, destToken, amount);
  };
}