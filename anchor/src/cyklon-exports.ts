// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';
import CyklonIDL from '../target/idl/cyklon.json';
import type { Cyklon } from '../target/types/cyklon';

// Re-export the generated IDL and type
export { Cyklon, CyklonIDL };

// The programId is imported from the program IDL.
export const CYKLON_PROGRAM_ID = new PublicKey(CyklonIDL.address);

// This is a helper function to get the Counter Anchor program.
export function getCyklonProgram(provider: AnchorProvider) {
  return new Program(CyklonIDL as Cyklon, provider);
}

// This is a helper function to get the program ID for the Cyklon program depending on the cluster.
export function getCyklonProgramId(cluster: Cluster | 'localnet') {
  switch (cluster) {
    case 'localnet':
      return new PublicKey('CQW1DNS35zc9F8KvzYjf2ZKtmRp6ntxNdfRo2dZTXp2B');
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return CYKLON_PROGRAM_ID;
    case 'mainnet-beta':
    default:
      return CYKLON_PROGRAM_ID;
  }
}
