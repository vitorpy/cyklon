import { g1Uncompressed, negateAndSerializeG1, g2Uncompressed, to32ByteBuffer } from "@blackpool/anchor";
import { list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

async function getOrDownloadFile(filename: string): Promise<string> {
    // Ensure the filename is properly sanitized to prevent directory traversal
    // eslint-disable-next-line no-useless-escape
    const sanitizedFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
    const tempFilePath = path.join('/tmp', sanitizedFilename);
  
    try {
      // Check if the file already exists in /tmp
      await fs.access(tempFilePath);
      console.log(`File ${sanitizedFilename} found in /tmp`);
      return tempFilePath;
    } catch (error) {
      // File doesn't exist in /tmp, download it from Blob storage
      console.log(`File ${sanitizedFilename} not found in /tmp, downloading from Blob storage`);
  
      try {
        // List blobs to find the file
        const { blobs } = await list({ prefix: path.dirname(sanitizedFilename) });
        const blob = blobs.find(b => b.pathname === sanitizedFilename);
  
        if (!blob) {
          throw new Error(`File ${sanitizedFilename} not found in Blob storage`);
        }
  
        // Download the file
        const response = await fetch(blob.url);
        const buffer = await response.arrayBuffer();
  
        // Ensure the directory exists
        await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
  
        // Write the file to /tmp
        await fs.writeFile(tempFilePath, Buffer.from(buffer));
  
        console.log(`File ${sanitizedFilename} downloaded and saved to /tmp`);
        return tempFilePath;
      } catch (downloadError) {
        console.error(`Error downloading file ${sanitizedFilename}:`, downloadError);
        throw downloadError;
      }
    }
  }

export async function generateProof(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  privateInputs: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicInputs: any
): Promise<{ proofA: Uint8Array, proofB: Uint8Array, proofC: Uint8Array, publicSignals: Uint8Array[] }> {
  // Remove the 'use server' directive here as it's already at the top of the file
  
  // Use dynamic imports for modules that might cause issues in server context
  // @ts-expect-error ffjavascript is not typed.
  const { buildBn128, utils: ffUtils } = await import('ffjavascript');
  const snarkjs = await import('snarkjs');

  const { unstringifyBigInts } = ffUtils;

  console.log("Generating proof for inputs:", { privateInputs, publicInputs });

  const wasmPath = await getOrDownloadFile("zk/swap.wasm");
  const zkeyPath = await getOrDownloadFile("zk/swap_final.zkey");

  const input = {
    privateAmount: privateInputs.privateAmount.toString(),
    privateMinReceived: privateInputs.privateMinReceived.toString(),
    publicBalanceX: publicInputs.publicBalanceX.toString(),
    publicBalanceY: publicInputs.publicBalanceY.toString(),
    isSwapXtoY: publicInputs.isSwapXtoY.toString(),
    totalLiquidity: publicInputs.totalLiquidity.toString()
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