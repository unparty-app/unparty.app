import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SVG_DIR, SVG_TRASH_DIR, safeSvgName, svgWriteGuard } from '@/lib/svg-files';

export async function POST(req: Request) {
  const denied = await svgWriteGuard();
  if (denied) return denied;

  try {
    // Parse the request body to get the file name
    const body = await req.json();
    
    // A plain .svg file name, never a path
    const fileName = safeSvgName(body.fileName);
    if (!fileName) {
      return NextResponse.json(
        { error: 'A plain .svg file name is required, like star.svg' },
        { status: 400 }
      );
    }

    // Define complete file paths
    const trashFilePath = path.join(SVG_TRASH_DIR, fileName);
    const restoreFilePath = path.join(SVG_DIR, fileName);

    // Check if source file exists in trash
    if (!fs.existsSync(trashFilePath)) {
      console.error(`File not found in trash: ${fileName}`);
      return NextResponse.json(
        { error: `File ${fileName} not found in trash` },
        { status: 404 }
      );
    }

    // Check if destination file already exists
    if (fs.existsSync(restoreFilePath)) {
      console.error(`File already exists in destination: ${fileName}`);
      return NextResponse.json(
        { error: `File ${fileName} already exists in destination` },
        { status: 409 }
      );
    }

    // Check if destination directory exists
    if (!fs.existsSync(SVG_DIR)) {
      console.error('Destination directory does not exist');
      return NextResponse.json(
        { error: 'Destination directory does not exist' },
        { status: 500 }
      );
    }

    try {
      // Move the file back to the main svgs folder
      fs.renameSync(trashFilePath, restoreFilePath);
      console.log(`File restored successfully: ${fileName}`);
      
      return NextResponse.json({
        message: 'File restored successfully',
        file: fileName
      });
    } catch (error) {
      console.error(`Error during file restoration of ${fileName}:`, error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          return NextResponse.json(
            { error: 'Permission denied while restoring file' },
            { status: 403 }
          );
        }
        if (error.message.includes('no such file or directory')) {
          return NextResponse.json(
            { error: 'File or directory not found' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Error restoring file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing restore request:', error);
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error while processing request' },
      { status: 500 }
    );
  }
}