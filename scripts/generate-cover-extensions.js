import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coversDir = path.join(__dirname, '../public/covers');
const outputPath = path.join(__dirname, '../src/app/covers/cover-extensions.json');

const coverExtensions = {};

try {
  const files = fs.readdirSync(coversDir);
  
  files.forEach(file => {
    const match = file.match(/^(cover-[\w-]+|gatekeeper-[\w-]+|theunpartyapp-[\w-]+|water-is-wet|basketball-hoop)\.(jpg|jpeg|png|svg|JPG|JPEG)$/i);
    if (match) {
      const coverId = match[1];
      const extension = match[2].toLowerCase();
      coverExtensions[coverId] = extension;
    }
  });
  
  fs.writeFileSync(outputPath, JSON.stringify(coverExtensions, null, 2));
  console.log('✅ Generated cover-extensions.json with', Object.keys(coverExtensions).length, 'entries');
} catch (error) {
  console.error('❌ Error generating cover extensions:', error);
  process.exit(1);
}
