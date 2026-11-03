import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize pageMedia.json into production-ready structure
 * 
 * Transforms flat project-* properties into structured arrays:
 * Before: { "project-cover": "/img1.png", "project-brand": "/img2.png" }
 * After: { images: [{ src: "/img1.png", alt: "...", type: "cover" }] }
 * 
 * Benefits:
 * - Eliminates runtime extraction 
 * - Stable array references (no infinite rerenders)
 * - Type-safe structure
 * - Ready for database/API integration
 */

function normalizeMediaData() {
  const inputPath = path.join(__dirname, '../src/data/pageMedia.json');
  const outputPath = path.join(__dirname, '../src/data/normalizedPageMedia.json');
  
  // Read current pageMedia
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  const normalized = {};
  
  Object.entries(rawData).forEach(([route, media]) => {
    // Extract metadata
    const { 
      title, 
      tag, 
      steps, 
      'project-description': description,
      alt: defaultAlt,
      ...rest 
    } = media;
    
    // Extract and normalize images
    const images = [];
    const processedKeys = new Set();
    
    Object.entries(rest).forEach(([key, value]) => {
      if (key.startsWith('project-') && !key.endsWith('-alt') && typeof value === 'string') {
        const altKey = `${key}-alt`;
        const type = key === 'project-cover' ? 'cover' : 'supporting';
        // A route-level `alt` describes the cover when no project-cover-alt is set
        const alt = rest[altKey] || (type === 'cover' && defaultAlt) || `${key.replace('project-', '')} image`;
        
        images.push({
          src: value,
          alt: alt,
          type: type
        });
        
        processedKeys.add(key);
        processedKeys.add(altKey);
      }
    });
    
    // Sort to ensure cover comes first (stable order)
    images.sort((a, b) => a.type === 'cover' ? -1 : b.type === 'cover' ? 1 : 0);
    
    // Create normalized structure
    normalized[route] = {
      meta: {
        title,
        tag,
        description
      },
      images,
      steps: [...steps] // Ensure array is copied
    };
  });
  
  // Write normalized data
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
  
  console.log('✅ Page data normalized successfully');
  console.log(`📊 Routes processed: ${Object.keys(normalized).length}`);
  
 
}

// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  normalizeMediaData();
}

export { normalizeMediaData };