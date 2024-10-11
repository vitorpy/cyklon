'use client'

import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "@blackpool/anchor";

declare const snarkjs: {
  groth16: {
    fullProve: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: any,
      wasmPath: string,
      zkeyPath: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Promise<{ proof: any; publicSignals: any }>
  }
};

export async function generateProof(
  privateInputs: { privateInputAmount: bigint, privateMinReceived: bigint },
  publicInputs: { publicBalanceX: bigint, publicBalanceY: bigint, isSwapXtoY: number }
): Promise<{ proofA: Uint8Array, proofB: Uint8Array, proofC: Uint8Array, publicSignals: Uint8Array[] }> {
  // Remove the 'use server' directive here as it's already at the top of the file
  
  // Use dynamic imports for modules that might cause issues in server context
  // @ts-expect-error ffjavascript is not typed.
  const { buildBn128, utils: ffUtils } = await import('ffjavascript');
  const { unstringifyBigInts } = ffUtils;

  console.log("Generating proof for inputs:", { privateInputs, publicInputs });

  const wasmPath = "zk/swap.wasm";
  const zkeyPath = "zk/swap_final.zkey";

  const input = {
    privateInputAmount: privateInputs.privateInputAmount.toString(),
    privateMinReceived: privateInputs.privateMinReceived.toString(),
    publicBalanceX: publicInputs.publicBalanceX.toString(),
    publicBalanceY: publicInputs.publicBalanceY.toString(),
    isSwapXtoY: publicInputs.isSwapXtoY.toString()
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  console.log("Original proof:", JSON.stringify(proof, null, 2));
  console.log("Public signals:", JSON.stringify(publicSignals, null, 2));

  const curve = await buildBn128();
  const proofProc = unstringifyBigInts(proof);
  const publicSignalsUnstrigified = unstringifyBigInts(publicSignals);

  let proofA = g1Uncompressed(curve, proofProc.pi_a);
  proofA = await negateAndSerializeG1(curve, proofA);

  const proofB = g2Uncompressed(curve, proofProc.pi_b);
  const proofC = g1Uncompressed(curve, proofProc.pi_c);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedPublicSignals = publicSignalsUnstrigified.map((signal: any) => {
    return to32ByteBuffer(BigInt(signal));
  });

  return { 
    proofA: new Uint8Array(proofA), 
    proofB: new Uint8Array(proofB), 
    proofC: new Uint8Array(proofC), 
    publicSignals: formattedPublicSignals 
  };
}