import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get image dimensions (for PNG files)
function getImageDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // PNG signature check
    if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      // PNG IHDR chunk starts at byte 16
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    
    // JPG/JPEG detection could be added here if needed
    // For now, return null for unsupported formats
    return null;
  } catch (error) {
    console.error(`Error reading image ${filePath}:`, error.message);
    return null;
  }
}

// Discover images following naming convention
function discoverImages() {
  const publicDir = path.join(__dirname, '../public');
  const files = fs.readdirSync(publicDir);
  
  // Look for image-*-cover.png pattern (following your naming convention)
  const imagePattern = /^image-(.+)-cover\.(png|jpg|jpeg)$/i;
  const imageManifest = {};
  
  files.forEach(file => {
    const match = file.match(imagePattern);
    if (match) {
      const imageName = match[1]; // e.g., "theunpartyapp" from "image-theunpartyapp-cover.png"
      const filePath = path.join(publicDir, file);
      const dimensions = getImageDimensions(filePath);
      
      if (dimensions) {
        imageManifest[file] = {
          name: imageName,
          path: `/${file}`,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: (dimensions.width / dimensions.height).toFixed(3)
        };
        
      }
    }
  });
  
  return imageManifest;
}

// Generate image manifest
function generateImageManifest() {
  const imageManifest = discoverImages();
  
  const manifest = {
    images: imageManifest,
    generatedAt: new Date().toISOString(),
    totalImages: Object.keys(imageManifest).length
  };
  
  const manifestPath = path.join(__dirname, '../src/data/imageManifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Image manifest generated at:', manifestPath);
  console.log('🖼️  Total images discovered:', manifest.totalImages);
}

// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateImageManifest();
}

export { generateImageManifest, discoverImages, getImageDimensions };