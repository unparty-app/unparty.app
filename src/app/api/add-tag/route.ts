import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SVG_DIR, safeSvgName, svgWriteGuard } from '@/lib/svg-files';

// POST method to handle adding a tag to an SVG
export async function POST(req: Request) {
  const denied = await svgWriteGuard();
  if (denied) return denied;

  try {
    const body = await req.json();
    const fileName = safeSvgName(body.fileName);
    const newTag = typeof body.newTag === 'string' ? body.newTag.trim() : '';
    if (!fileName || !newTag) {
      return NextResponse.json({ message: 'A plain .svg file name and a tag are required' }, { status: 400 });
    }

    // Path to the tags.json file
    const tagsFilePath = path.join(SVG_DIR, 'tags.json');

    // Read the current tags data
    interface TagsData {
      [key: string]: string[];
    }

    let tagsData: TagsData = {};
    if (fs.existsSync(tagsFilePath)) {
      const fileContent = fs.readFileSync(tagsFilePath, 'utf8');
      tagsData = JSON.parse(fileContent);
    }

    // Add the new tag to the file's tag array, or create a new entry
    if (!tagsData[fileName]) {
      tagsData[fileName] = [];
    }

    if (!tagsData[fileName].includes(newTag)) {
      tagsData[fileName].push(newTag);
    }

    // Write the updated data back to the JSON file
    fs.writeFileSync(tagsFilePath, JSON.stringify(tagsData, null, 2));

    return NextResponse.json({ message: 'Tag added successfully', tags: tagsData[fileName] });
  } catch (error) {
    console.error('Error adding tag:', error);
    return NextResponse.json({ message: 'Error adding tag' }, { status: 500 });
  }
}