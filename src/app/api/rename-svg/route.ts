import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SVG_DIR, safeSvgName, svgWriteGuard } from '@/lib/svg-files';

// POST method to handle renaming the SVG
export async function POST(req: Request) {
  const denied = await svgWriteGuard();
  if (denied) return denied;

  try {
    // Parse the request body
    const body = await req.json();
    const oldName = safeSvgName(body.oldName);
    const newName = safeSvgName(body.newName);
    if (!oldName || !newName) {
      return NextResponse.json({ message: 'Both names must be plain .svg file names, like star.svg' }, { status: 400 });
    }

    // Build the full file paths for the old and new names
    const oldPath = path.join(SVG_DIR, oldName);
    const newPath = path.join(SVG_DIR, newName);

    // Rename the file
    fs.renameSync(oldPath, newPath);

    return NextResponse.json({ message: 'File renamed successfully' });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ message: 'Error renaming file' }, { status: 500 });
  }
}