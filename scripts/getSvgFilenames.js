import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Define the path to your SVGs directory
const svgDirectory = join(process.cwd(), 'public', 'svgs');

// Read the directory and filter for SVG files
const getSvgFilenames = () => {
  try {
    const files = readdirSync(svgDirectory);
    const svgFiles = files.filter((file) => file.endsWith('.svg'));

    console.log('SVG Filenames:', svgFiles);
    return svgFiles;
  } catch (error) {
    console.error('Error reading SVG directory:', error);
    return [];
  }
};

// Write filenames to a JSON file
const outputDirectory = join(process.cwd(), 'src', 'data');
mkdirSync(outputDirectory, { recursive: true }); // Ensure the directory exists

const svgFiles = getSvgFilenames();
writeFileSync(
  join(outputDirectory, 'svgFiles.json'),
  JSON.stringify(svgFiles, null, 2)
);

console.log('SVG filenames written to src/data/svgFiles.json');
