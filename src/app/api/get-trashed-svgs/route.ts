import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const trashDir = path.join(process.cwd(), 'public', 'svgs', 'trash');
    
    // Check if trash directory exists
    if (!fs.existsSync(trashDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(trashDir)
      .filter(file => file.toLowerCase().endsWith('.svg'));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error getting trashed SVGs:', error);
    return NextResponse.json({ error: 'Failed to get trashed SVGs' }, { status: 500 });
  }
}