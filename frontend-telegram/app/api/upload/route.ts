import { NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Lighthouse API key not found.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files were uploaded.' }, { status: 400 });
    }

    // The Lighthouse SDK needs a path for the upload. Since we are in a serverless
    // environment, we will convert the files to buffers.
    const fileObjects = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          path: file.name,
          content: Buffer.from(buffer),
        };
      })
    );

    // Upload the files to Lighthouse
    const response = await lighthouse.upload(fileObjects, apiKey);

    // The CID is located in response.data.Hash
    const cid = response.data.Hash;

    if (!cid) {
      throw new Error('Upload failed, CID not returned.');
    }

    return NextResponse.json({ cid: cid });
  } catch (error) {
    console.error('Error uploading to Lighthouse:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `File upload failed: ${errorMessage}` }, { status: 500 });
  }
}