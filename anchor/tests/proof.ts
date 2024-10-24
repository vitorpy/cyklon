import * as snarkjs from 'snarkjs';
import * as path from 'path';
import { buildBn128, utils } from 'ffjavascript';
const { unstringifyBigInts } = utils;
import {
  g1Uncompressed,
  negateAndSerializeG1,
  g2Uncompressed,
  to32ByteBuffer,
} from '../src/utils';

export async function generateProof(
  privateInputs: { privateInputAmount: string; privateMinReceived: string },
  publicInputs: {
    publicBalanceX: string;
    publicBalanceY: string;
    isSwapXtoY: number;
  }
): Promise<{
  proofA: Uint8Array;
  proofB: Uint8Array;
  proofC: Uint8Array;
  publicSignals: Uint8Array[];
}> {
  console.log('Generating proof for inputs:', { privateInputs, publicInputs });

  const wasmPath = path.join(__dirname, '../../circuits/swap_js', 'swap.wasm');
  const zkeyPath = path.join(__dirname, '../../circuits', 'swap_0001.zkey');

  const input = {
    privateInputAmount: privateInputs.privateInputAmount,
    privateMinReceived: privateInputs.privateMinReceived,
    publicBalanceX: publicInputs.publicBalanceX,
    publicBalanceY: publicInputs.publicBalanceY,
    isSwapXtoY: publicInputs.isSwapXtoY.toString(),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log('Original proof:', JSON.stringify(proof, null, 2));
  console.log('Public signals:', JSON.stringify(publicSignals, null, 2));

  const curve = await buildBn128();
  const proofProc = unstringifyBigInts(proof);
  const publicSignalsUnstrigified = unstringifyBigInts(publicSignals);

  let proofA = g1Uncompressed(curve, proofProc.pi_a);
  proofA = await negateAndSerializeG1(curve, proofA);

  const proofB = g2Uncompressed(curve, proofProc.pi_b);
  const proofC = g1Uncompressed(curve, proofProc.pi_c);

  await curve.terminate();

  const formattedPublicSignals = publicSignalsUnstrigified.map((signal) => {
    return to32ByteBuffer(BigInt(signal));
  });

  return {
    proofA: new Uint8Array(proofA),
    proofB: new Uint8Array(proofB),
    proofC: new Uint8Array(proofC),
    publicSignals: formattedPublicSignals,
  };
}
