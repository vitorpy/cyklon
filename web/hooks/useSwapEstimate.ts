import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { Token } from '@/types/token';
import { useAnchorProvider } from '../components/solana/solana-provider';
import { getCyklonProgram } from '@blackpool/anchor';
import { NATIVE_MINT } from '@solana/spl-token';

export function useSwapEstimate(sourceToken: Token, destToken: Token, sourceAmount: string) {
  const [estimatedDestAmount, setEstimatedDestAmount] = useState<string>('');
  const { connection } = useConnection();
  const provider = useAnchorProvider();

  useEffect(() => {
    const estimateSwap = async () => {
      if (!sourceAmount || isNaN(parseFloat(sourceAmount))) {
        setEstimatedDestAmount('');
        return;
      }

      try {
        const program = getCyklonProgram(provider);

        // Handle NATIVE token and sort token public keys
        const sourceAddress = sourceToken.address === 'NATIVE' ? NATIVE_MINT : new PublicKey(sourceToken.address);
        const destAddress = destToken.address === 'NATIVE' ? NATIVE_MINT : new PublicKey(destToken.address);
        const [tokenX, tokenY] = [sourceAddress, destAddress].sort((a, b) => 
          a.toBuffer().compare(b.toBuffer())
        );

        // Determine if we're swapping from X to Y
        const isXtoY = sourceAddress.equals(tokenX);

        // Find pool PDA
        const [poolPubkey] = PublicKey.findProgramAddressSync(
          [Buffer.from("pool"), tokenX.toBuffer(), tokenY.toBuffer()],
          program.programId
        );

        // Fetch pool account data
        const poolAccount = await program.account.pool.fetch(poolPubkey);

        // Get reserves directly from the pool account
        const reserveX = poolAccount.reserveX;
        const reserveY = poolAccount.reserveY;

        // Calculate the estimated amount based on the pool reserves
        const sourceReserve = isXtoY ? reserveX : reserveY;
        const destReserve = isXtoY ? reserveY : reserveX;
        const sourceAmountBN = BigInt(Math.floor(parseFloat(sourceAmount) * 10 ** sourceToken.decimals));

        // Use the constant product formula: x * y = k
        const k = sourceReserve * destReserve;
        const newSourceReserve = sourceReserve + sourceAmountBN;
        const newDestReserve = k / newSourceReserve;
        const estimatedAmountBN = destReserve - newDestReserve;

        // Convert back to human-readable format
        const estimatedAmount = Number(estimatedAmountBN) / 10 ** destToken.decimals;
        setEstimatedDestAmount(estimatedAmount.toFixed(destToken.decimals));
      } catch (error) {
        console.error('Error estimating swap:', error);
        setEstimatedDestAmount('');
      }
    };

    estimateSwap();
  }, [sourceToken, destToken, sourceAmount, connection, provider]);

  return estimatedDestAmount;
}
