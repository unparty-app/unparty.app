/**
 * Cover Photo Gallery Data
 * Metadata for all available cover photos in /public/covers/
 */

export interface CoverImage {
  filename: string;
  format: 'svg' | 'png' | 'jpg' | 'JPG';
  category?: 'unparty' | 'gatekeeper' | 'dtla' | 'core'| 'brand'| 'budget' | 'grow' | 'product' | 'risk'| 'llm';
  description?: string;
}

export interface CoverColors {
  [coverId: string]: string[]; // Array of hex colors extracted from cover
}

export const COVER_IMAGES: CoverImage[] = [
  // Numbered covers (001-037)
  { filename: 'cover-001.png', format: 'png', category: 'unparty' },
  { filename: 'cover-002.png', format: 'png', category: 'unparty' },
  { filename: 'cover-003.png', format: 'png', category: 'unparty' },
  { filename: 'cover-004.png', format: 'png', category: 'unparty' },
  { filename: 'cover-005.png', format: 'png', category: 'unparty' },
  { filename: 'cover-006.png', format: 'png', category: 'unparty' },
  { filename: 'cover-007.png', format: 'png', category: 'unparty' },
  { filename: 'cover-008.png', format: 'png', category: 'unparty' },
  { filename: 'cover-009.png', format: 'png', category: 'unparty' },
  { filename: 'cover-010.png', format: 'png', category: 'unparty' },
  { filename: 'cover-011.png', format: 'png', category: 'unparty' },
  { filename: 'cover-012.png', format: 'png', category: 'unparty' },
  { filename: 'cover-013.png', format: 'png', category: 'unparty' },
  { filename: 'cover-014.png', format: 'png', category: 'unparty' },
  { filename: 'cover-015.png', format: 'png', category: 'unparty' },
  { filename: 'cover-017.png', format: 'png', category: 'unparty' },
  { filename: 'cover-018.png', format: 'png', category: 'unparty' },
  { filename: 'cover-019.png', format: 'png', category: 'unparty' },
  { filename: 'cover-020.png', format: 'png', category: 'unparty' },
  { filename: 'cover-021.png', format: 'png', category: 'unparty' },
  { filename: 'cover-022.png', format: 'png', category: 'unparty' },
  { filename: 'cover-023.png', format: 'png', category: 'unparty' },
  { filename: 'cover-024.png', format: 'png', category: 'unparty' },
  { filename: 'cover-025.png', format: 'png', category: 'unparty' },
  { filename: 'cover-026.png', format: 'png', category: 'unparty' },
  { filename: 'cover-027.png', format: 'png', category: 'unparty' },
  { filename: 'cover-028.png', format: 'png', category: 'unparty' },
  { filename: 'cover-029.png', format: 'png', category: 'unparty' },
  { filename: 'cover-030.png', format: 'png', category: 'unparty' },
  { filename: 'cover-031.png', format: 'png', category: 'unparty' },
  { filename: 'cover-032.png', format: 'png', category: 'unparty' },
  { filename: 'cover-033.png', format: 'png', category: 'unparty' },
  { filename: 'cover-034.png', format: 'png', category: 'unparty' },
  { filename: 'cover-035.png', format: 'png', category: 'dtla' },
  { filename: 'cover-036.png', format: 'png', category: 'unparty' },
  { filename: 'cover-038.png', format: 'png', category: 'unparty' },
  { filename: 'cover-043.png', format: 'png', category: 'unparty'},
  { filename: 'cover-044.png', format: 'png', category: 'unparty'},
  { filename: 'cover-045.png', format: 'png', category: 'llm'},
  { filename: 'cover-046.png', format: 'png', category: 'core'},
  { filename: 'cover-047.png', format: 'png', category: 'core'},
  { filename: 'cover-048.png', format: 'png', category: 'core'},
  { filename: 'cover-049.png', format: 'png', category: 'core'},
  { filename: 'cover-050.png', format: 'png', category: 'core'},
  { filename: 'cover-051.png', format: 'png', category: 'core'},


  // Gatekeeper icons
  { filename: 'gatekeeper-brand-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Brand Gatekeeper Icon' },
  { filename: 'gatekeeper-budget-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Budget Gatekeeper Icon' },
  { filename: 'gatekeeper-core-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Core Gatekeeper Icon' },
  { filename: 'gatekeeper-grow-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Grow Gatekeeper Icon' },
  { filename: 'gatekeeper-product-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Product Gatekeeper Icon' },
  { filename: 'gatekeeper-risk-icon.svg', format: 'svg', category: 'gatekeeper', description: 'Risk Gatekeeper Icon' },

  // DTLA covers
  { filename: 'cover-broadway-arcade.png', format: 'png', category: 'dtla', description: 'BROADWAY.' },
  { filename: 'cover-flower-cloud.png', format: 'png', category: 'dtla', description: 'FLOWER.' },
  { filename: 'cover-grand-gehry.png', format: 'png', category: 'dtla', description: 'GRAND.' },
  { filename: 'cover-grand-molina-flag.png', format: 'png', category: 'dtla', description: 'PARK.' },
  { filename: 'cover-flower-sky.png', format: 'png', category: 'dtla', description: 'SKY.' },
  { filename: 'cover-main-gray.png', format: 'png', category: 'dtla', description: 'MAIN.' },
  { filename: 'cover-paseo-plaza.png', format: 'png', category: 'dtla', description: 'PASEO.' },

  // Crawler analysis covers - theunpartycrawler Spotify visualizations
  { filename: 'cover-crawler-dashboard.png', format: 'png', category: 'unparty', description: 'CRAWLER DASHBOARD.' },
  { filename: 'cover-crawler-comparison.png', format: 'png', category: 'unparty', description: 'CRAWLER COMPARISON.' },
  { filename: 'cover-crawler-consistency.png', format: 'png', category: 'unparty', description: 'CRAWLER CONSISTENCY.' },
  { filename: 'cover-crawler-timeline.png', format: 'png', category: 'unparty', description: 'CRAWLER TIMELINE.' },
  { filename: 'cover-crawler-heatmap.png', format: 'png', category: 'unparty', description: 'CRAWLER HEATMAP.' },

];

/**
 * Get all cover image filenames
 */
export function getAllCoverFilenames(): string[] {
  return COVER_IMAGES.map(cover => cover.filename);
}

/**
 * Get cover images by category
 */
export function getCoversByCategory(category: NonNullable<CoverImage['category']>): CoverImage[] {
  return COVER_IMAGES.filter(cover => cover.category === category);
}

/**
 * Get cover images by format
 */
export function getCoversByFormat(format: 'svg' | 'png' | 'jpg' | 'JPG'): CoverImage[] {
  return COVER_IMAGES.filter(cover => cover.format === format);
}

/**
 * Load pre-computed colors for covers
 * Colors are extracted using Vision framework in precompute-colors.swift
 */
export async function loadCoverColors(): Promise<CoverColors> {
  try {
    const colors = await import('./cover-colors.json');
    return colors.default as CoverColors;
  } catch {
    console.warn('Cover colors not found. Run: swift scripts/precompute-colors.swift');
    return {};
  }
}

/**
 * Get colors for a specific cover ID
 * @param coverId - Cover ID without extension (e.g., 'cover-001', 'gatekeeper-brand-icon')
 * @returns Array of hex color strings, or fallback colors if not found
 */
export function getCoverColors(coverId: string, coverColorsData?: CoverColors): string[] {
  const fallbackColors = ['#F9C22E', '#334D66', '#4D6647', '#66474D', '#80664D'];
  
  if (!coverColorsData) {
    return fallbackColors;
  }
  
  return coverColorsData[coverId] || fallbackColors;
}

/**
 * Extract cover ID from filename
 * @param filename - Full filename with extension (e.g., 'cover-001.JPG')
 * @returns Cover ID without extension (e.g., 'cover-001')
 */
export function getCoverIdFromFilename(filename: string): string {
  return filename
    .replace('.JPG', '')
    .replace('.jpg', '')
    .replace('.png', '')
    .replace('.svg', '');
}
