"use client";

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import PhotoGallery, { ImageMetadata } from './PhotoGallery';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import CoverAssetMapper from '../../utils/CoverAssetMapper';

/**
 * ContextAwarePageMedia
 * 
 * Enhanced interactive media gallery that automatically detects the current route
 * and displays unppp-specific media with clickable preview capabilities.
 * 
 * Route Detection:
 * - "/" or "/unppp" → theunpartyapp unppp
 * - "/theunpartybrand" → theunpartybrand unppp
 * - "/theunpartycloud" → theunpartycloud unppp
 * - Admin/auth pages → decorative assets (no unppp media)
 * - Unknown routes → decorative assets
 * 
 * Media Sources:
 * - Unppp-specific: From UnpppsConfig.json media arrays
 * - Decorative fallback: CoverAssetMapper geometric icons
 * 
 * Features:
 * - Click to view images in modal with metadata
 * - Navigate between images with arrow keys or buttons
 * - Action button to navigate to unppp details page
 */
const ContextAwarePageMedia: React.FC = () => {
    const pathname = usePathname();

    const { images, metadata } = useMemo(() => {
        // Skip unppp media for admin and auth routes - use decorative assets
        if (pathname.startsWith('/admin') || 
            pathname.startsWith('/sign-in') || 
            pathname.startsWith('/sign-up')) {
            const decorativeAssets = CoverAssetMapper.getUniqueAssetPaths();
            return {
                images: decorativeAssets.slice(0, 12),
                metadata: {}
            };
        }

        // Map pathname to unppp ID
        let detectedUnpppId: string | null = null;

        if (pathname === '/' || pathname === '/unppp') {
            detectedUnpppId = 'theunpartyapp';
        } else {
            // Extract the last segment from pathname (e.g., "/theunpartybrand" → "theunpartybrand")
            const segments = pathname.split('/').filter(Boolean);
            if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                // Check if this matches an unppp ID directly
                const matchingUnppp = UnpppsConfig.unppps.find(u => u.id === lastSegment);
                if (matchingUnppp) {
                    detectedUnpppId = lastSegment;
                }
            }
        }

        // Find the unppp and extract its media
        if (detectedUnpppId) {
            const unppp = UnpppsConfig.unppps.find(u => u.id === detectedUnpppId);
            if (unppp && unppp.media && Array.isArray(unppp.media)) {
                // Transform media for PhotoGallery
                const mediaImages = unppp.media.map(item => item.src);
                const mediaMetadata: Record<string, Partial<ImageMetadata>> = {};
                
                unppp.media.forEach(item => {
                    const itemType = ('type' in item && (item.type === 'cover' || item.type === 'supporting'))
                        ? item.type 
                        : 'supporting';
                    
                    mediaMetadata[item.src] = {
                        customData: {
                            'Type': itemType === 'cover' ? '🤳🏾 Cover' : '📸 Supporting',
                            'Unppp': detectedUnpppId
                        }
                    };
                });

                return {
                    images: mediaImages,
                    metadata: mediaMetadata
                };
            }
        }

        // No matching unppp or no media configured - use decorative assets
        const decorativeAssets = CoverAssetMapper.getUniqueAssetPaths();
        return {
            images: decorativeAssets.slice(0, 12),
            metadata: {}
        };
    }, [pathname]);

    return (
        <PhotoGallery 
            images={images}
            basePath=""
            aspectRatio="16:9"
            enablePhotoModal={true}
            imageMetadata={metadata}
        />
    );
};

export default ContextAwarePageMedia;
