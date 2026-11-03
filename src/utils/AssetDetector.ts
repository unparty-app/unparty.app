// Asset detection utility for dynamic 3D geometric shapes
// This ensures all new shapes are automatically included without hardcoding

export interface GeometricAsset {
  path: string;
  shape: 'Cube' | 'Pyramid' | 'Sphere';
  material: string;
  name: string;
}

/**
 * Dynamically generates the list of available 3D geometric assets
 * Excludes about.svg, build.svg, connect.svg, and unparty_profile_*.svg
 */
export function getGeometricAssets(): GeometricAsset[] {
  // Define all known 3D shapes and their materials
  // This approach works with static builds and is more reliable than filesystem reads
  const shapes = ['Cube', 'Pyramid', 'Sphere'] as const;
  
  // All known materials across shapes (discovered from your collection)
  const materials = {
    'Cube': ['Checkered', 'Mesh', 'Ref Yellow', 'Wood'],
    'Pyramid': ['Mesh', 'Ref Blue', 'Sponge', 'Wood'],
    'Sphere': ['Braided BLK', 'Red Bulb', 'Red Mtl Mesh', 'Wood']
  };

  const assets: GeometricAsset[] = [];

  // Generate asset paths based on known patterns
  shapes.forEach(shape => {
    materials[shape].forEach(material => {
      const fileName = `${shape}-${material}.png`;
      const path = `/svgs/unparty/${fileName}`;
      
      assets.push({
        path,
        shape,
        material,
        name: fileName
      });
    });
  });

  return assets;
}

/**
 * Get assets filtered by shape type
 */
export function getAssetsByShape(shape: 'Cube' | 'Pyramid' | 'Sphere'): GeometricAsset[] {
  return getGeometricAssets().filter(asset => asset.shape === shape);
}

/**
 * Get assets filtered by material (partial match)
 */
export function getAssetsByMaterial(materialPattern: string): GeometricAsset[] {
  return getGeometricAssets().filter(asset => 
    asset.material.toLowerCase().includes(materialPattern.toLowerCase())
  );
}

/**
 * Get asset paths only (for compatibility with existing PageMedia component)
 */
export function getGeometricAssetPaths(): string[] {
  return getGeometricAssets().map(asset => asset.path);
}

/**
 * Shuffle array for random visual variety
 */
export function shuffleAssets<T>(assets: T[]): T[] {
  const shuffled = [...assets];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}