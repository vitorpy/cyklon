import * as snarkjs from "snarkjs";
import * as path from "path";
import { buildBn128, utils, Curve } from "ffjavascript";
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "../src/utils";

const { unstringifyBigInts } = utils;

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
    const publicSignalsUnstrigified = unstringifyBigInts(publicSignals);

    let pi_a : Buffer | Uint8Array = g1Uncompressed(curve, proofProc.pi_a);
    //pi_a = reverseEndianness(pi_a)
    pi_a = await negateAndSerializeG1(curve, pi_a);
    const pi_a_0_u8_array = Array.from(pi_a);
    console.log(pi_a_0_u8_array);

    const pi_b = g2Uncompressed(curve, proofProc.pi_b);
    const pi_b_0_u8_array = Array.from(pi_b);
    console.log(pi_b_0_u8_array.slice(0, 64));
    console.log(pi_b_0_u8_array.slice(64, 128));

    const pi_c = g1Uncompressed(curve, proofProc.pi_c);
    const pi_c_0_u8_array = Array.from(pi_c);
    console.log(pi_c_0_u8_array);

    // Format public inputs for verification
    const public_signal_0_u8_array = publicSignalsUnstrigified.map(signal => {
      const signalBuffer = to32ByteBuffer(BigInt(signal));
      return Array.from(signalBuffer);
    });

    /*
    // Verify the original proof
    const vKey = JSON.parse(fs.readFileSync(path.join(__dirname, "../../verification_key.json"), "utf8"));
    console.log("Verification Key:", JSON.stringify(vKey, null, 2));
    console.log("Public Inputs for Verification:", public_signal_0_u8_array);

    let verificationResult;
    try {
      verificationResult = await snarkjs.groth16.verify(vKey, public_signal_0_u8_array, proof);
      console.log("Verification result:", verificationResult);
    } catch (error) {
      console.error("Error during verification:", error);
      throw error;
    }

    // Assert that the proof is valid
    expect(verificationResult).toBe(true);

    console.log("Regenerated proof verified successfully");
    */

    // Create a temporary file to store the proof and public inputs
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'zk_proof_output.json');

    const outputData = {
      pi_a: pi_a_0_u8_array,
      pi_b: pi_b_0_u8_array,
      pi_c: pi_c_0_u8_array,
      publicInputs: public_signal_0_u8_array
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
