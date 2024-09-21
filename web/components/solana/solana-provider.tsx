'use client';

import dynamic from 'next/dynamic';
import { AnchorProvider } from '@coral-xyz/anchor';
import { WalletError } from '@solana/wallet-adapter-base';
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ReactNode, useCallback, useMemo } from 'react';
import { useCluster } from '../cluster/cluster-data-access';

require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster();
  const endpoint = useMemo(() => cluster.endpoint, [cluster]);
  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>
          <style jsx global>{`
            .wallet-adapter-button {
              background-color: #a1a1aa !important;
              border-radius: 0.5rem !important; /* Adjust this value to match SolanaSwapperComponent */
            }
            .wallet-adapter-button:hover {
              background-color: #71717a !important;
            }
            .wallet-adapter-button-trigger {
              background-color: #a1a1aa !important;
            }
            .wallet-adapter-button-trigger:hover {
              background-color: #71717a !important;
            }
            .wallet-adapter-button-start-icon {
              border-radius: 0.5rem !important; /* Match the button's border radius */
              filter: grayscale(100%) !important;
            }
          `}</style>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: 'confirmed',
  });
}
