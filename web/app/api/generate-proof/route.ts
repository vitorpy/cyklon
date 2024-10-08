import { generateProof } from '@/lib/prepare-proof';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { privateInputs, publicInputs } = await request.json();

    if (!privateInputs || !publicInputs) {
      return NextResponse.json({ error: 'Missing required inputs' }, { status: 400 });
    }

    const proof = await generateProof(privateInputs, publicInputs);
    return NextResponse.json(proof);
  } catch (error) {
    console.error('Error generating proof:', error);
    return NextResponse.json({ error: 'Failed to generate proof' }, { status: 500 });
  }
}