import { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useCluster } from '../components/cluster/cluster-data-access';

export function useTokenBalance(walletAddress: PublicKey | null, tokenAddress: string) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cluster } = useCluster();

  useEffect(() => {
    async function fetchBalance() {
      if (!walletAddress || !tokenAddress) {
        setBalance(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let response;
        if (tokenAddress === 'NATIVE') {
          response = await fetch(cluster.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [walletAddress.toBase58()],
            }),
          });
        } else {
          response = await fetch(cluster.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getTokenAccountsByOwner',
              params: [
                walletAddress.toBase58(),
                { mint: tokenAddress },
                { encoding: 'jsonParsed' }
              ],
            }),
          });
        }

        const data = await response.json();

        if (data.error) {
          console.log('Error fetching token balance: cluser: ', cluster.endpoint, ' walletAddress: ', walletAddress.toBase58(), ' tokenAddress: ', tokenAddress);
          console.log(data.error);
          throw new Error(data.error.message);
        }

        if (tokenAddress === 'NATIVE') {
          const nativeBalance = data.result.value / LAMPORTS_PER_SOL;
          setBalance(nativeBalance);
        } else {
          if (data.result.value.length > 0) {
            const tokenAccount = data.result.value[0];
            const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
            setBalance(tokenBalance);
          } else {
            setBalance(0);
          }
        }
      } catch (err) {
        console.error('Error fetching token balance:', err);
        setError('Failed to fetch token balance');
        setBalance(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [walletAddress, tokenAddress, cluster.endpoint]);

  return { balance, loading, error };
}
