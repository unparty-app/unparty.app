'use client';

import Spline from '@splinetool/react-spline';

interface SplineEmbedProps {
  scene: string;
  width?: string;
  height?: string;
  className?: string;
}

/**
 * SplineEmbed - Embeds any Spline 3D scene
 * 
 * Used in stories via: :::component[name=SplineEmbed,scene=URL]:::
 * 
 * Props:
 * - scene: URL to the Spline scene (required)
 *   Examples:
 *   - Local: "/scene.splinecode"
 *   - Hosted: "https://prod.spline.design/tLK98DRBRgvzrMYb/scene.splinecode"
 * - width: Optional width override (default: responsive)
 * - height: Optional height override (default: responsive)
 * - className: Optional additional CSS classes
 * 
 * Features:
 * - Theme-aware styling with gradient backgrounds
 * - Responsive container that maintains aspect ratio
 * - Border and shadow for visual polish
 * - Handles both local and external Spline scenes
 */
export default function SplineEmbed({ 
  scene, 
  width, 
  height, 
  className = '' 
}: SplineEmbedProps) {
  return (
    <div className="w-full flex justify-center my-8 px-4">
      <div 
        className={`relative w-full max-w-[500px] aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black ${className}`}
        style={{
          width: width || undefined,
          height: height || undefined,
        }}
      >
        <Spline scene={scene} />
      </div>
    </div>
  );
}
