'use client';

import Link from "next/link";
import clsx from "clsx";
import { useTheme } from "../contexts/ThemeContext";
import { VStack, HStack } from "./Stacks";
import { ZStack } from "./Stacks";

type BadgeType = "NEW" | "EXPERIMENTAL" | "BETA" | "TESTING"| "BORED"| "UPDATING";

interface FeatureWrapperProps {
  title: string;
  subtitle?: string;
  linkHref: string;
  children: React.ReactNode;
  badge?: BadgeType;
  color?: string; // Custom color override
}

// Badge styles are now using theme colors directly

// Pattern background component to mimic the iOS PatternBackground
const PatternBackground = () => (
  <div className="absolute inset-0 opacity-5">
    <div className="relative size-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
  </div>
);

export default function FeatureWrapper({
  title,
  subtitle = "UNPARTY COMPONENT",
  linkHref,
  children,
  badge,
  color,
}: FeatureWrapperProps) {
  const { colorValue } = useTheme();
  
  // Use provided color or default to theme color
  const themeColor = color || colorValue;
  
  return (
    <VStack
      className="relative min-h-[400px] w-full max-w-md overflow-hidden rounded-2xl border border-gray-300/20 bg-white/10 shadow-md backdrop-blur-sm dark:bg-black/30"
      style={{ borderColor: `${themeColor}` }}
      spacing={0}
    >  
      {/* Header section with color band - similar to iOS */}
      <VStack spacing={0} className="w-full">
        {/* Color band at top */}
        <div className="relative h-10 w-full overflow-hidden rounded-t-2xl" style={{ backgroundColor: `${themeColor}20` }}>
          <PatternBackground />
        </div>
        
        {/* Title section */}
        <VStack spacing={4} className="w-full px-6 pb-2 pt-4">
          {/* Top HStack with Title only */}
          <p className="font-google-sans-code text-xs uppercase text-gray-500">
                  {title}
                </p>
          <HStack className="w-full">
            <h2 className="font-rounded text-2xl font-bold opacity-30" style={{ color: themeColor }}>
              {subtitle}
            </h2>
          </HStack>
          
          {/* Bottom HStack with badge, subtitle and link */}
          <VStack spacing={2} className="w-full">
            <HStack spacing={2} className="w-full justify-between">
              <Link
                href={linkHref}
                className="flex items-center whitespace-nowrap font-rounded text-sm transition-opacity hover:opacity-80"
                style={{ color: themeColor }}
              >
                <span className="mr-1 inline-block size-4 rounded-full bg-current"></span>
                UNPARTY
              </Link>
              
            
                
                {badge && (
                  <span 
                    className={clsx("inline-flex h-6 items-center justify-center rounded-full border border-gray-300/20 bg-transparent px-2 py-1 font-google-sans-code text-xs")}
                    style={{ borderColor: themeColor, color: themeColor }}
                  >
                    {badge}
                  </span>
                )}
              </HStack>
            
            
            <hr className="w-full border-t border-gray-200 dark:border-gray-800" />
            
            
          </VStack>
        </VStack>
      </VStack>

      {/* Preview */}
      <ZStack className="mx-6 mb-4 grow overflow-hidden rounded-xl bg-white/5 dark:bg-black/20">
        <div className="origin-top scale-[0.75]">
          {children}
        </div>
      </ZStack>
    </VStack>
  );
}
