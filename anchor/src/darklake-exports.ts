// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';
import DarklakeIDL from '../target/idl/darklake.json';
import type { Darklake } from '../target/types/darklake';

// Re-export the generated IDL and type
export { Darklake, DarklakeIDL };

// The programId is imported from the program IDL.
export const DARKLAKE_PROGRAM_ID = new PublicKey(DarklakeIDL.address);

// This is a helper function to get the Counter Anchor program.
export function getDarklakeProgram(provider: AnchorProvider) {
  return new Program(DarklakeIDL as Darklake, provider);
}

// This is a helper function to get the program ID for the Darklake program depending on the cluster.
export function getDarklakeProgramId(cluster: Cluster | 'localnet') {
  switch (cluster) {
    case 'localnet':
      return new PublicKey('CQW1DNS35zc9F8KvzYjf2ZKtmRp6ntxNdfRo2dZTXp2B');
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return DARKLAKE_PROGRAM_ID;
    case 'mainnet-beta':
    default:
      return DARKLAKE_PROGRAM_ID;
  }
}
