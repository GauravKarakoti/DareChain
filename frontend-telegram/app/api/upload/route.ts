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

    // 1. Upload each file individually to get their CIDs
    const uploadResponses = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const response = await lighthouse.uploadBuffer(Buffer.from(buffer), apiKey);
        return {
          name: file.name,
          cid: response.data.Hash,
          size: response.data.Size,
        };
      })
    );

    // 2. Create a JSON manifest of the uploaded files
    const manifest = {
      name: 'DareX Proof Submission',
      description: `Submission containing ${files.length} files.`,
      files: uploadResponses,
      timestamp: new Date().toISOString(),
    };

    const manifestBuffer = Buffer.from(JSON.stringify(manifest));

    // 3. Upload the manifest JSON to get a single root CID
    const manifestUploadResponse = await lighthouse.uploadBuffer(manifestBuffer, apiKey);
    const rootCid = manifestUploadResponse.data.Hash;

    if (!rootCid) {
      throw new Error('Upload failed, root CID not returned.');
    }

    // 4. Return the single root CID
    return NextResponse.json({ cid: rootCid });

  } catch (error) {
    console.error('Error uploading to Lighthouse:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `File upload failed: ${errorMessage}` }, { status: 500 });
  }
}