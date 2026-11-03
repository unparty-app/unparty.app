import CoverSourcesConfig from '../data/cover-photo-sources.json';
import { SITE_URL } from '@/app/constants/organization';

export interface CoverSource {
  photographer: string;
  url: string;
  icon?: string;
  title?: string;
}

export interface CoverSourcesData {
  version: number;
  covers: Record<string, CoverSource>;
}

export interface SecureCoverSource extends CoverSource {
  isVerified: boolean;
  safeUrl: string;
}

class CoverSchema {
  private static data: CoverSourcesData = CoverSourcesConfig;
  
  // Allowlist of verified Instagram usernames
  private static VERIFIED_INSTAGRAM_USERS: string[] = [];
  
  // The founder - links to founders page
  private static FOUNDERS_USERS: string[] = ['founder'];
  
  // Fallback URL for unverified or generic profiles
  private static FALLBACK_URL = `${SITE_URL}/founders`;

  private static isVerifiedInstagramUrl(url: string, photographer: string): boolean {
    // Check if it's a valid Instagram URL format
    const instagramPattern = /^https:\/\/instagram\.com\/([a-zA-Z0-9._]+)$/;
    const match = url.match(instagramPattern);
    
    if (!match) return false;
    
    const urlUsername = match[1];
    
    // Verify the username matches the photographer and is in our allowlist
    return urlUsername === photographer && this.VERIFIED_INSTAGRAM_USERS.includes(photographer);
  }

  private static isFoundersUser(photographer: string): boolean {
    return this.FOUNDERS_USERS.includes(photographer);
  }

  static getCoverSource(coverId: string): CoverSource | null {
    return this.data.covers[coverId] || null;
  }

  static getSecureCoverSource(coverId: string): SecureCoverSource | null {
    const source = this.getCoverSource(coverId);
    if (!source) return null;

    const isVerifiedInstagram = this.isVerifiedInstagramUrl(source.url, source.photographer);
    const isFounder = this.isFoundersUser(source.photographer);
    
    return {
      ...source,
      isVerified: isVerifiedInstagram || isFounder,
      safeUrl: isVerifiedInstagram ? source.url : this.FALLBACK_URL
    };
  }

  static getAllCoverSources(): Record<string, CoverSource> {
    return this.data.covers;
  }

  static hasCoverSource(coverId: string): boolean {
    return coverId in this.data.covers;
  }

  static getPhotographerName(coverId: string): string | null {
    const source = this.getCoverSource(coverId);
    return source?.photographer || null;
  }

  static getPhotographerUrl(coverId: string): string | null {
    const secureSource = this.getSecureCoverSource(coverId);
    return secureSource?.safeUrl || null;
  }

  static isPhotographerVerified(coverId: string): boolean {
    const secureSource = this.getSecureCoverSource(coverId);
    return secureSource?.isVerified || false;
  }

  static getCoverIcon(coverId: string): string | null {
    const source = this.getCoverSource(coverId);
    return source?.icon || null;
  }

  static getCoverIconPath(coverId: string): string | null {
    const icon = this.getCoverIcon(coverId);
    return icon ? `/svgs/unparty/${icon}` : null;
  }

  static getCoverTitle(coverId: string): string | null {
    const source = this.getCoverSource(coverId);
    return source?.title || null;
  }

  // Get all unique icons used across covers
  static getAllCoverIcons(): string[] {
    const icons = new Set<string>();
    Object.values(this.data.covers).forEach(cover => {
      if (cover.icon) {
        icons.add(cover.icon);
      }
    });
    return Array.from(icons);
  }

  // Get covers that use a specific icon
  static getCoversByIcon(iconName: string): string[] {
    return Object.entries(this.data.covers)
      .filter(([, cover]) => cover.icon === iconName)
      .map(([coverId]) => coverId);
  }

  // Get covers by photographer name
  static getCoversByPhotographer(photographer: string): string[] {
    return Object.entries(this.data.covers)
      .filter(([, cover]) => cover.photographer.toLowerCase() === photographer.toLowerCase())
      .map(([coverId]) => coverId)
      .sort(); // Sort for consistent ordering
  }

  // Get all unique photographer names
  static getAllPhotographers(): string[] {
    const photographers = new Set<string>();
    Object.values(this.data.covers).forEach(cover => {
      if (cover.photographer) {
        photographers.add(cover.photographer);
      }
    });
    return Array.from(photographers).sort();
  }
}

export default CoverSchema;