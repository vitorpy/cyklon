import { useState } from 'react';

interface FaucetResponse {
  success: boolean;
  message: string;
}

const usePyusdFaucet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPyusd = async (
    walletAddress: string
  ): Promise<FaucetResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = {
        address: walletAddress,
        network: 'SOLANA',
        token: 'PYUSD',
      };

      const response = await fetch(
        'https://api.sandbox.paxos.com/v2/treasury/faucet/transfers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsLoading(false);
      return { success: true, message: 'PYUSD tokens requested successfully' };
    } catch (err) {
      setIsLoading(false);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      return { success: false, message: 'Failed to request PYUSD tokens' };
    }
  };

  return { requestPyusd, isLoading, error };
};

export default usePyusdFaucet;
