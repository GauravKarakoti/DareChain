import { NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Lighthouse API key not found.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const response = await lighthouse.uploadBuffer(Buffer.from(buffer), apiKey);
    const cid = response.data.Hash;

    if (!cid) {
      throw new Error('Upload failed, CID not returned.');
    }
    console.log('File uploaded successfully. CID:', cid);

    return NextResponse.json({ cid });

  } catch (error) {
    console.error('Error uploading to Lighthouse:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `File upload failed: ${errorMessage}` }, { status: 500 });
  }
}