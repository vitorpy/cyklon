import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useTransactionToast } from '@/hooks/useToast';

export function useSolanaFaucet() {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  const requestAirdrop = async (address: PublicKey, amount: number = 1) => {
    const [latestBlockhash, signature] = await Promise.all([
      connection.getLatestBlockhash(),
      connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
    ]);

    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      'confirmed'
    );

    transactionToast(signature);

    return signature;
  };

  return { requestAirdrop };
}
