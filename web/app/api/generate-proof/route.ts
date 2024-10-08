import { generateProof } from '@/lib/prepare-proof';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { privateInputs, publicInputs } = await request.json();

    if (!privateInputs || !publicInputs) {
      return NextResponse.json({ error: 'Missing required inputs' }, { status: 400 });
    }

    // Deserialize string values back to BigInt
    const deserializedPrivateInputs = {
      privateAmount: BigInt(privateInputs.privateAmount),
      privateMinReceived: BigInt(privateInputs.privateMinReceived)
    };

    const deserializedPublicInputs = {
      ...publicInputs,
      publicBalanceX: BigInt(publicInputs.publicBalanceX),
      publicBalanceY: BigInt(publicInputs.publicBalanceY),
      totalLiquidity: BigInt(publicInputs.totalLiquidity)
    };

    const proof = await generateProof(deserializedPrivateInputs, deserializedPublicInputs);
    return NextResponse.json(proof);
  } catch (error) {
    console.error('Error generating proof:', error);
    return NextResponse.json({ error: 'Failed to generate proof' }, { status: 500 });
  }
}