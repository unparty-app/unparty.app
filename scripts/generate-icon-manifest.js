import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Levenshtein distance for semantic matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Simple fallback - only for genuine mismatches
function findBestMatch(stepType, availableIcons) {
  // Exact match first
  if (availableIcons.includes(stepType)) {
    return stepType;
  }
  
  // High-confidence semantic fallback only (80%+ similarity)
  const distances = availableIcons.map(icon => ({
    icon,
    similarity: 1 - (levenshteinDistance(stepType.toLowerCase(), icon.toLowerCase()) / Math.max(stepType.length, icon.length))
  }));
  
  const bestMatch = distances.sort((a, b) => b.similarity - a.similarity)[0];
  
  // Very conservative threshold - only for obvious typos/variations
  return bestMatch.similarity > 0.8 ? bestMatch.icon : null;
}

// Discover available icons
function discoverIcons() {
  const svgDir = path.join(__dirname, '../public/svgs');
  const files = fs.readdirSync(svgDir);
  
  // Extract icon names from icon-*-step.svg pattern
  const iconPattern = /^icon-(.+)-step\.svg$/;
  const availableIcons = files
    .filter(file => iconPattern.test(file))
    .map(file => file.match(iconPattern)[1]);
  
  console.log('📦 Discovered icons:', availableIcons);
  return availableIcons;
}

// Generate icon manifest
function generateIconManifest() {
  const availableIcons = discoverIcons();
  
  const manifest = {
    availableIcons,
    generatedAt: new Date().toISOString(),
    findBestMatch: findBestMatch.toString() // Include matching function
  };
  
  const manifestPath = path.join(__dirname, '../src/data/iconManifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
 
}

// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateIconManifest();
}

export { generateIconManifest, findBestMatch, discoverIcons };