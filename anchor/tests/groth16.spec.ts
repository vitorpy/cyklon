import * as snarkjs from "snarkjs";
import * as path from "path";
import { buildBn128, utils, Curve } from "ffjavascript";
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

const { unstringifyBigInts, leInt2Buff } = utils;

describe('ZKConstantSumAMM Verifier', () => {
  let curve: Curve;

  beforeAll(async () => {
    curve = await buildBn128();
  });

  afterAll(async () => {
    if (curve) {
      await curve.terminate();
    }
  });

  it('should generate a valid proof', async () => {
    const wasmPath = path.join(__dirname, "../../swap_js", "swap.wasm");
    const zkeyPath = path.join(__dirname, "../../", "swap_final.zkey");

    // Generate proof
    const input = {
      privateAmount: 100000,  // Example value
      privateMinReceived: 99000,  // Example value
      publicBalanceX: 1100000,  // Changed from 1000000 to match public signal
      publicBalanceY: 1900000,  // Changed from 2000000 to match public signal
      isSwapXtoY: 1,  // Swapping X to Y
      totalLiquidity: 3000000  // Example value, should be publicBalanceX + publicBalanceY
    };

    console.log("Input:", JSON.stringify(input, null, 2));

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

    console.log("Original proof:", JSON.stringify(proof, null, 2));
    console.log("Public signals:", JSON.stringify(publicSignals, null, 2));

    const proofProc = unstringifyBigInts(proof);

    // Format proof
    let pi_a = formatG1(curve, proofProc.pi_a);
    let buf_pi_a = reverseEndianness(pi_a)
    buf_pi_a = await negateAndSerializeG1(curve, buf_pi_a);
    pi_a = Array.from(buf_pi_a)
    const pi_b = formatG2(curve, proofProc.pi_b);
    const pi_c = formatG1(curve, proofProc.pi_c);

    // Format public inputs for verification
    const publicInputsForVerification = publicSignals.map(signal => BigInt(signal));

    // Verify the original proof
    const vKey = JSON.parse(fs.readFileSync(path.join(__dirname, "../../verification_key.json"), "utf8"));
    console.log("Verification Key:", JSON.stringify(vKey, null, 2));
    console.log("Public Inputs for Verification:", publicInputsForVerification);

    let verificationResult;
    try {
      verificationResult = await snarkjs.groth16.verify(vKey, publicInputsForVerification, proof);
      console.log("Verification result:", verificationResult);
    } catch (error) {
      console.error("Error during verification:", error);
      throw error;
    }

    // Assert that the proof is valid
    expect(verificationResult).toBe(true);

    console.log("Regenerated proof verified successfully");

    // Create a temporary file to store the proof and public inputs
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'zk_proof_output.json');

    const outputData = {
      pi_a,
      pi_b,
      pi_c,
      publicInputs: publicInputsForVerification.map(formatPublicInput)
    };

    fs.writeFileSync(tempFilePath, JSON.stringify(outputData, null, 2));

    console.log(`Proof and public inputs written to: ${tempFilePath}`);

    console.log("Public signals:", publicSignals);
    expect(publicSignals).toEqual(["1200000", "1800000", "100000"]);
  });

  it('should generate and verify a valid proof using snarkjs library', async () => {
    const input = {
      privateAmount: 100000,
      privateMinReceived: 99000,
      publicBalanceX: 1100000,
      publicBalanceY: 1900000,
      isSwapXtoY: 1,
      totalLiquidity: 3000000
    };

    const wasmPath = path.join(__dirname, "../../swap_js", "swap.wasm");
    const zkeyPath = path.join(__dirname, "../../", "swap_final.zkey");
    const vKeyPath = path.join(__dirname, "../../verification_key.json");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

    const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf8"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    expect(res).toBe(true);
  });

  it('should generate and verify a valid proof using snarkjs CLI', async () => {
    const input = {
      privateAmount: 100000,
      privateMinReceived: 99000,
      publicBalanceX: 1100000,
      publicBalanceY: 1900000,
      isSwapXtoY: 1,
      totalLiquidity: 3000000
    };

    const snarkjsCli = path.join(__dirname, "../../snarkjs/build/cli.cjs");
    const zkeyPath = path.join(__dirname, "../../", "swap_final.zkey");
    const vKeyPath = path.join(__dirname, "../../verification_key.json");
    const wasmPath = path.join(__dirname, "../../swap_js", "swap.wasm");

    const inputPath = path.join(__dirname, "../../input.json");
    const witnessPath = path.join(__dirname, "../../witness.wtns");
    const proofPath = path.join(__dirname, "../../proof.json");
    const publicPath = path.join(__dirname, "../../public.json");

    // Write input to file
    fs.writeFileSync(inputPath, JSON.stringify(input));
    
    console.log("AAAAAA");

    // Generate the witness
    execSync(`node ${snarkjsCli} wtns calculate ${wasmPath} ${inputPath} ${witnessPath}`);

    // Generate the proof
    execSync(`node ${snarkjsCli} groth16 prove ${zkeyPath} ${witnessPath} ${proofPath} ${publicPath}`);

    // Verify the proof
    const result = execSync(`node ${snarkjsCli} groth16 verify ${vKeyPath} ${publicPath} ${proofPath}`);

    expect(result.toString()).toContain("OK!");

    // Clean up temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(witnessPath);
    fs.unlinkSync(proofPath);
    fs.unlinkSync(publicPath);
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
  return Array.from(leInt2Buff(input, 32));
}

// Function to reverse endianness of a buffer
function reverseEndianness(buffer) {
  return Buffer.from(buffer.reverse());
}

async function negateAndSerializeG1(curve, reversedP1Uncompressed) {
  if (!reversedP1Uncompressed || !(reversedP1Uncompressed instanceof Uint8Array || Buffer.isBuffer(reversedP1Uncompressed))) {
    console.error('Invalid input to negateAndSerializeG1:', reversedP1Uncompressed);
    throw new Error('Invalid input to negateAndSerializeG1');
  }
  // Negate the G1 point
  const p1 = curve.G1.toAffine(curve.G1.fromRprUncompressed(reversedP1Uncompressed, 0));
  const negatedP1 = curve.G1.neg(p1);

  // Serialize the negated point
  // The serialization method depends on your specific library
  const serializedNegatedP1 = new Uint8Array(64); // 32 bytes for x and 32 bytes for y
  curve.G1.toRprUncompressed(serializedNegatedP1, 0, negatedP1);
  // curve.G1.toRprUncompressed(serializedNegatedP1, 32, negatedP1.y);
  console.log(serializedNegatedP1)

  // Change endianness if necessary
  const proof_a = reverseEndianness(serializedNegatedP1);

  return proof_a;
}