// components/CTA.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import colors, { palette } from '../constants/colors';

import { Info, Users, ChevronDown, ChevronUp, ArrowRight, Hammer, Sparkles } from '@/app/components/icons';

// Enhanced sections with icons and descriptions
export const SECTION_CONFIG = {
  about: {
    icon: Info,
    title: 'ABOUT',
    description: 'Our story, team, and mission',
    color: palette.brand,
    pages: ['about', 'founders', 'privacy', 'terms', 'audience', 'resilience']
  },
  build: {
    icon: Hammer,
    title: 'BUILD',
    description: 'Tools, apps, and innovation',
    color: colors.electricPurple,
    pages: ['build', 'ai', 'color','generate',  'uncolor',  'unppp', 'ideas', 'concept']
  },
  connect: {
    icon: Users,
    title: 'CONNECT',
    description: 'Community and collaboration',
    color: colors.neonPink,
    pages: ['connect', 'business', 'platform', 'problem']
  }
} as const;

// Legacy compatibility
export const PAGE_CATEGORIES = {
  about: SECTION_CONFIG.about.pages,
  build: SECTION_CONFIG.build.pages,
  connect: SECTION_CONFIG.connect.pages
} as const;

// Define page-specific CTA content
const pageCTAs: Record<string, {
  primaryText: string;
  secondaryText?: string;
  thirdText?: string;
  primaryHref: string;
  secondaryHref?: string;
  thirdHref?: string;
  allPages?: boolean;
}> = {
  '/': {
    primaryText: 'about.',
    secondaryText: 'build',
    thirdText: 'connect',
    primaryHref: '/about',
    secondaryHref: '/build',
    thirdHref: '/connect',
    allPages: true
  }
  // Add more routes as needed
};

type CTAProps = {
  primaryText?: string;
  secondaryText?: string;
  thirdText?: string;
  primaryHref?: string;
  secondaryHref?: string;
  thirdHref?: string;
  
};

export default function CTA({
  primaryText: propsPrimaryText,
  secondaryText: propsSecondaryText,
  thirdText: propsThirdText,
  primaryHref: propsPrimaryHref,
  secondaryHref: propsSecondaryHref,
  thirdHref: propsThirdHref
}: CTAProps) {
  const pathname = usePathname();
  const { colorValue } = useTheme();
  
  // Page-specific content from pageCTAs, with any props taking precedence
  const pageSpecificCTA = pageCTAs[pathname];
  const ctaContent = {
    primaryText: propsPrimaryText || pageSpecificCTA?.primaryText || '',
    secondaryText: propsSecondaryText || pageSpecificCTA?.secondaryText || '',
    thirdText: propsThirdText || pageSpecificCTA?.thirdText || '',
    primaryHref: propsPrimaryHref || pageSpecificCTA?.primaryHref || '',
    secondaryHref: propsSecondaryHref || pageSpecificCTA?.secondaryHref || '',
    thirdHref: propsThirdHref || pageSpecificCTA?.thirdHref || ''
  };
  
  const [activeFilter, setActiveFilter] = useState<keyof typeof SECTION_CONFIG | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  // Only show CTA on paths that are explicitly defined in pageCTAs
  if (!pageCTAs[pathname] && !(propsPrimaryText && propsSecondaryText && propsPrimaryHref)) {
    return null;
  }
  
  // If we don't have content yet, don't render anything
  if (!ctaContent.primaryText || !ctaContent.secondaryText || !ctaContent.primaryHref) {
    return null;
  }

  // Check if we should show all pages
  const shouldShowAllPages = pageCTAs[pathname]?.allPages;

  return (
    <div className="w-full">
      {/* Premium CTA Navigation Bar */}
      <div className="vh-content-container mb-4 w-full rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-black/20">
        <div className="flex w-full flex-wrap items-center gap-2 overflow-hidden font-google-sans-code text-sm">
          {/* CTA Branding */}
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: colorValue }} className="vh-supporting-element-brand" />
            <span className="hidden font-bold uppercase text-white sm:inline">EXPLORE</span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
          </div>

          {/* Main Section Navigation */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {Object.entries(SECTION_CONFIG).map(([key, section]) => {
              const Icon = section.icon
              const isActive = activeFilter === key
              const isHovered = hoveredSection === key
              
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveFilter(isActive ? null : key as keyof typeof SECTION_CONFIG)
                  }}
                  onMouseEnter={() => setHoveredSection(key)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`group relative flex items-center gap-1 overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 ${
                    isActive
                      ? 'vh-primary-interactive border font-bold text-black shadow-lg'
                      : 'vh-secondary-interactive border border-transparent text-gray-600 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                  style={isActive ? { 
                    backgroundColor: section.color, 
                    borderColor: section.color,
                    boxShadow: `0 0 20px ${section.color}30`
                  } : {}}
                  title={section.description}
                >
                  {/* Animated background gradient */}
                  {!isActive && (
                    <div 
                      className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10`}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                  
                  <Icon size={14} style={{ color: isActive ? 'black' : (isHovered ? section.color : undefined) }} className="vh-supporting-element" />
                  <span className="hidden sm:inline">
                    {section.title}
                  </span>
                  
                  
                  {/* Active indicator */}
                  {isActive && (
                    <ChevronUp size={12} className="text-black" />
                  )}
                  {!isActive && (
                    <ChevronDown size={12} className="opacity-50 group-hover:opacity-100" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status & Stats */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            {activeFilter && (
              <span className="font-google-sans-code">
                {SECTION_CONFIG[activeFilter].pages.length} pages
              </span>
            )}
           
            
          </div>
        </div>
      </div>

      {/* Expanded Section Content */}
      {shouldShowAllPages && activeFilter && (
        <div className="animate-in slide-in-from-top-2 vh-content-container mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 duration-200 dark:border-gray-700 dark:bg-black/10">
          <div className="mb-4 flex items-center gap-3">
            <div className="vh-supporting-element-brand rounded-lg p-2" style={{ backgroundColor: `${SECTION_CONFIG[activeFilter].color}20` }}>
              {React.createElement(SECTION_CONFIG[activeFilter].icon, { size: 20, style: { color: SECTION_CONFIG[activeFilter].color } })}
            </div>
            <div>
              <h3 className="font-google-sans-code font-bold text-white" style={{ color: SECTION_CONFIG[activeFilter].color }}>
                {SECTION_CONFIG[activeFilter].title}
              </h3>
              <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                {SECTION_CONFIG[activeFilter].description}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {SECTION_CONFIG[activeFilter].pages.map((page: string) => (
              <Link
                key={page}
                href={`/${page}`}
                className="vh-secondary-interactive group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 p-3 font-google-sans-code text-sm text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:border-gray-700 dark:bg-black/20 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-black/40 dark:hover:text-white"
              >
                <ArrowRight size={12} className="vh-supporting-element opacity-50 transition-opacity group-hover:opacity-100" />
                <span className="capitalize">{page}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
