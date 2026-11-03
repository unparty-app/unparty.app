import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SVG_DIR, safeSvgName, svgWriteGuard } from '@/lib/svg-files';

export async function POST(req: Request) {
  const denied = await svgWriteGuard();
  if (denied) return denied;

  try {
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const fileName = safeSvgName(file.name);
    if (!fileName) {
      return NextResponse.json({ message: 'Only .svg files with a plain name, like star.svg' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save the file to the public/svgs directory
    const filePath = path.join(SVG_DIR, fileName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ message: 'File uploaded successfully', fileName });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ message: 'Error uploading file' }, { status: 500 });
  }
}