import * as snarkjs from "snarkjs";
import * as path from "path";
import { buildBn128, utils } from "ffjavascript";
import * as fs from 'fs';
import * as os from 'os';

const { unstringifyBigInts } = utils;

describe('ZKConstantSumAMM Verifier', () => {
  it('should generate a valid proof', async () => {
    const wasmPath = path.join(__dirname, "../../swap_js", "swap.wasm");
    const zkeyPath = path.join(__dirname, "../../", "swap_final.zkey");

    // Generate proof
    const input = {
      privateAmount: 100000,  // Example value
      privateMinReceived: 99000,  // Example value
      publicBalanceX: 1000000,  // Example value
      publicBalanceY: 2000000,  // Example value
      isSwapXtoY: 1,  // Swapping X to Y
      totalLiquidity: 3000000  // Example value, should be publicBalanceX + publicBalanceY
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

    const curve = await buildBn128();
    const proofProc = unstringifyBigInts(proof);

    // Format proof
    const pi_a = formatG1(curve, proofProc.pi_a);
    const pi_b = formatG2(curve, proofProc.pi_b);
    const pi_c = formatG1(curve, proofProc.pi_c);

    // Format public inputs
    const publicInputs = publicSignals.map(signal => formatPublicInput(BigInt(signal)));

    // Create a temporary file to store the proof and public inputs
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'zk_proof_output.json');

    const outputData = {
      pi_a,
      pi_b,
      pi_c,
      publicInputs
    };

    fs.writeFileSync(tempFilePath, JSON.stringify(outputData, null, 2));

    console.log(`Proof and public inputs written to: ${tempFilePath}`);

    // Here you would typically send these values to your Solana program
    // For now, we've written them to a temporary file
  });
});

function formatG1(curve, point) {
  const p = curve.G1.fromObject(point);
  const buff = new Uint8Array(64);
  curve.G1.toRprUncompressed(buff, 0, p);
  return Array.from(buff);
}

function formatG2(curve, point) {
  const p = curve.G2.fromObject(point);
  const buff = new Uint8Array(128);
  curve.G2.toRprUncompressed(buff, 0, p);
  return Array.from(buff);
}

function formatPublicInput(input: bigint): number[] {
  return Array.from(to32ByteBuffer(input));
}

function to32ByteBuffer(bigInt: bigint): Uint8Array {
  return new Uint8Array(Buffer.from(bigInt.toString(16).padStart(64, '0'), 'hex'));
}