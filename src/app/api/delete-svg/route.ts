import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SVG_DIR, SVG_TRASH_DIR, safeSvgName, svgWriteGuard } from '@/lib/svg-files';

export async function DELETE(req: Request) {
  const denied = await svgWriteGuard();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const fileName = safeSvgName(searchParams.get('fileName'));

    if (!fileName) {
      return NextResponse.json({ message: 'No valid .svg file name provided' }, { status: 400 });
    }

    // Path to the original SVG file
    const filePath = path.join(SVG_DIR, fileName);
    // Path to the trash folder (create if doesn't exist)
    const trashPath = path.join(SVG_TRASH_DIR, fileName);

    // Ensure the trash folder exists
    if (!fs.existsSync(SVG_TRASH_DIR)) {
      fs.mkdirSync(SVG_TRASH_DIR);
    }

    // Move the file to the trash folder
    fs.renameSync(filePath, trashPath);

    return NextResponse.json({ message: 'File moved to trash successfully' });
  } catch (error) {
    console.error('Error moving file to trash:', error);
    return NextResponse.json({ message: 'Error moving file to trash' }, { status: 500 });
  }
}