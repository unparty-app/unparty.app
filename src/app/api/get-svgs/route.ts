import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the directory path for the SVG files
    const dirPath = path.join(process.cwd(), 'public','svgs');

    // Read all the files in the directory
    const files = fs.readdirSync(dirPath);

    // Filter to include only .svg files
    const svgFiles = files.filter((file) => path.extname(file) === '.svg');

    // Return the list of .svg files as a JSON response
    return NextResponse.json(svgFiles);
  } catch (error) {
    console.error('Error reading SVG directory:', error);
    return NextResponse.json({ message: 'Error reading directory' }, { status: 500 });
  }
}