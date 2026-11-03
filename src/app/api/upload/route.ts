import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { blobStoreConnected } from '@/lib/blob-store';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';

// Admin-only upload to the site's Vercel Blob store, used by /blobupload.
// Blob files are public and the owner pays for the storage, so only an admin
// may add them.
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!blobStoreConnected()) {
    return NextResponse.json(
      { error: "No Blob store connected. Connect one in Vercel (see /article/setup-file-uploads)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "Missing file body" }, { status: 400 });
  }

  if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `Files up to ${MAX_UPLOAD_LABEL}` }, { status: 413 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
      // Uploading the same name twice keeps both instead of failing
      addRandomSuffix: true,
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Blob upload failed:', error);
    return NextResponse.json({ error: "Upload failed. Check the store is connected to this project" }, { status: 500 });
  }
}
