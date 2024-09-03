import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Cyklon } from '../target/types/cyklon';

describe('cyklon', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Cyklon as Program<Cyklon>;

  const counterKeypair = Keypair.generate();

  it('Initialize Cyklon', async () => {
    await program.methods
      .initialize()
      .accounts({
        counter: counterKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([counterKeypair])
      .rpc();

    const currentCount = await program.account.counter.fetch(
      counterKeypair.publicKey
    );

    expect(currentCount.count).toEqual(0);
  });
});
