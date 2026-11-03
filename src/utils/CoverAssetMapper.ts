import CoverSchema from './CoverSchema';
import { getGeometricAssets, GeometricAsset } from './AssetDetector';

export interface CoverAssetMapping {
  coverId: string;
  photographer: string;
  title: string;
  iconFileName: string;
  iconPath: string;
  asset: GeometricAsset | null;
  isValidAsset: boolean;
}

/**
 * Maps cover photos to their associated 3D geometric assets
 * Provides validation and detailed mapping information
 */
export class CoverAssetMapper {
  private static geometricAssets = getGeometricAssets();
  
  /**
   * Get all cover-to-asset mappings with validation
   */
  static getAllMappings(): CoverAssetMapping[] {
    const coverIds = Object.keys(CoverSchema.getAllCoverSources());
    
    return coverIds.map(coverId => {
      const source = CoverSchema.getCoverSource(coverId);
      const iconFileName = source?.icon || '';
      const iconPath = CoverSchema.getCoverIconPath(coverId) || '';
      
      // Find matching geometric asset
      const asset = this.geometricAssets.find(a => a.name === iconFileName) || null;
      
      return {
        coverId,
        photographer: source?.photographer || '',
        title: source?.title || 'Untitled',
        iconFileName,
        iconPath,
        asset,
        isValidAsset: asset !== null
      };
    });
  }
  
  /**
   * Get only covers with valid asset associations
   */
  static getValidMappings(): CoverAssetMapping[] {
    return this.getAllMappings().filter(mapping => mapping.isValidAsset);
  }
  
  /**
   * Get covers missing asset associations
   */
  static getMissingMappings(): CoverAssetMapping[] {
    return this.getAllMappings().filter(mapping => !mapping.iconFileName || !mapping.isValidAsset);
  }
  
  /**
   * Get asset paths that are safe to use in PageMedia
   * Ensures we never reference non-existent assets
   */
  static getSafeAssetPaths(): string[] {
    return this.getValidMappings().map(mapping => mapping.iconPath);
  }
  
  /**
   * Get unique asset paths (deduplicated)
   */
  static getUniqueAssetPaths(): string[] {
    const paths = new Set(this.getSafeAssetPaths());
    return Array.from(paths);
  }
  
  /**
   * Get mapping statistics for debugging
   */
  static getStats() {
    const all = this.getAllMappings();
    const valid = this.getValidMappings();
    const missing = this.getMissingMappings();
    
    return {
      totalCovers: all.length,
      validMappings: valid.length,
      missingMappings: missing.length,
      uniqueAssets: this.getUniqueAssetPaths().length,
      coveragePercentage: Math.round((valid.length / all.length) * 100)
    };
  }
  
  /**
   * Get assets grouped by shape for analysis
   */
  static getAssetsByShape() {
    const validMappings = this.getValidMappings();
    
    return validMappings.reduce((acc, mapping) => {
      if (mapping.asset) {
        const shape = mapping.asset.shape;
        if (!acc[shape]) acc[shape] = [];
        acc[shape].push(mapping);
      }
      return acc;
    }, {} as Record<string, CoverAssetMapping[]>);
  }
}

export default CoverAssetMapper;