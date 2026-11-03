"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import CoverAssetMapper from '../../utils/CoverAssetMapper';

interface MediaItem {
    src: string;
    alt: string;
    type: 'cover' | 'supporting';
}

interface PageMediaProps {
    media?: MediaItem[];
}

const PageMedia: React.FC<PageMediaProps> = ({ media = [] }) => {
    // Get assets associated with covers - ensures we never exceed actual asset count
    // Each cover has validated icon metadata linking to existing 3D geometric assets
    const decorativeAssets = useMemo(() => {
        // Get only unique, validated asset paths
        const safeAssetPaths = CoverAssetMapper.getUniqueAssetPaths();
        // Use only assets that are actually associated with covers and exist
        return safeAssetPaths; // Use shuffleAssets(safeAssetPaths) for random order
    }, []);

    // Display unppp media if provided, otherwise show decorative assets
    const hasUnpppMedia = media.length > 0;

    if (hasUnpppMedia) {
        return (
            <div className="w-full">
                {/* Unppp-specific Media Grid */}
                <div className="relative overflow-hidden rounded-lg">
                    <div className="grid grid-cols-2 gap-4 p-3 md:grid-cols-3">
                        {media.map((item) => (
                            <div 
                                key={item.src}
                                className="relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="relative aspect-video w-full">
                                    <Image
                                        src={item.src}
                                        alt={item.alt}
                                        fill
                                        className="object-cover transition-transform duration-200 hover:scale-105"
                                        loading="lazy"
                                        quality={85}
                                    />
                                </div>
                                {item.type === 'cover' && (
                                    <div className="absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-xs font-google-sans-code text-white">
                                        🤳🏾
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Compact 4x3 Decorative Asset Grid (fallback) */}
            <div className="relative overflow-hidden rounded-lg">
                <div className="grid grid-cols-4 gap-2 p-3">
                    {decorativeAssets.slice(0, 12).map((asset, index) => (
                        <div 
                            key={asset}
                            className="relative flex aspect-square items-center justify-center rounded opacity-80 transition-opacity duration-200 hover:opacity-100"
                        >
                            <Image
                                src={asset}
                                alt={`Asset ${index + 1}`}
                                width={100}
                                height={100}
                                className="size-full object-contain transition-transform duration-200 hover:scale-105"
                                loading="lazy"
                                quality={95}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageMedia;