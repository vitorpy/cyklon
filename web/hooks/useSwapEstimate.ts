import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { Token } from '@/types/token';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { useCluster } from '../components/cluster/cluster-data-access';
import { getDarklakeProgram, getDarklakeProgramId } from '@darklakefi/anchor';
import { NATIVE_MINT } from '@solana/spl-token';
import { generateProof } from '../lib/prepare-proof';

export function useSwapEstimate(
  sourceToken: Token,
  destToken: Token,
  sourceAmount: string
) {
  const [estimatedDestAmount, setEstimatedDestAmount] = useState<string>('');
  const { connection } = useConnection();
  const provider = useAnchorProvider();
  const { cluster } = useCluster();
  // @ts-expect-error Weird typing issues.
  const programId = getDarklakeProgramId(cluster);

  useEffect(() => {
    const estimateSwap = async () => {
      if (!sourceAmount || isNaN(parseFloat(sourceAmount))) {
        setEstimatedDestAmount('');
        return;
      }

      try {
        const program = getDarklakeProgram(provider);

        // Sort token public keys to ensure consistent pool seed calculation
        const sourceAddress =
          sourceToken.address === 'NATIVE'
            ? NATIVE_MINT
            : new PublicKey(sourceToken.address);
        const destAddress =
          destToken.address === 'NATIVE'
            ? NATIVE_MINT
            : new PublicKey(destToken.address);
        const [tokenX, tokenY] = [sourceAddress, destAddress].sort((a, b) =>
          a.toBuffer().compare(b.toBuffer())
        );

        // Determine if we're swapping from X to Y
        const isSwapXtoY = sourceAddress.equals(tokenX) ? 1 : 0;

        // Find pool PDA using sorted token public keys
        const [poolPubkey] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenX.toBuffer(), tokenY.toBuffer()],
          programId
        );

        // Fetch pool account data
        const poolAccount = await program.account.pool.fetch(poolPubkey);

        // Prepare inputs for proof generation
        const publicInputs = {
          publicBalanceX: poolAccount.reserveX.toString(),
          publicBalanceY: poolAccount.reserveY.toString(),
          isSwapXtoY: isSwapXtoY,
        };

        const sourceAmountBN = BigInt(
          Math.floor(parseFloat(sourceAmount) * 10 ** sourceToken.decimals)
        );

        const privateInputs = {
          privateInputAmount: sourceAmountBN.toString(),
          privateMinReceived: '0', // We're not enforcing a minimum for estimation
        };

        // Generate proof
        const { publicSignals } = await generateProof(
          privateInputs,
          publicInputs
        );

        // Extract the third element (index 2) from publicSignals
        const amountReceivedSignal = publicSignals[2];

        // Convert the last 8 bytes of the Uint8Array to a BigInt
        const estimatedAmountBN = amountReceivedSignal
          .slice(-8)
          .reduce((acc, value, index) => {
            return acc + (BigInt(value) << BigInt(8 * (7 - index)));
          }, BigInt(0));

        // Convert back to human-readable format
        const estimatedAmount =
          Number(estimatedAmountBN) / 10 ** destToken.decimals;
        setEstimatedDestAmount(estimatedAmount.toFixed(destToken.decimals));
      } catch (error) {
        console.error('Error estimating swap:', error);
        setEstimatedDestAmount('');
      }
    };

    estimateSwap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceToken, destToken, sourceAmount, connection, provider]);

  return estimatedDestAmount;
}
