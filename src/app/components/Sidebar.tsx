'use client';
import { useState } from 'react';
import Link from 'next/link';

import { ChevronDown, ChevronUp, Layers, ArrowRight } from '@/app/components/icons';
import { SECTION_CONFIG } from './CTA';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar() {
  const { colorValue } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<keyof typeof SECTION_CONFIG | null>(null);

  return (
    <div className="sidebar-container w-full">
      {/* Sidebar Header */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:border-gray-700 dark:from-black/10 dark:to-black/20">
        <div className="mb-3 flex items-center gap-2">
          <Layers size={16} style={{ color: colorValue }} />
          <h2 className="font-google-sans-code text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Site Navigation
          </h2>
        </div>
        <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
          Explore all sections and pages
        </p>
      </div>

      {/* Quick Section Access */}
      <div className="mb-4 space-y-2">
        {Object.entries(SECTION_CONFIG).map(([key, section]) => {
          const Icon = section.icon;
          const isActive = activeFilter === key;
          return (
            <div key={key}>
              <button
                onClick={() => setActiveFilter(isActive ? null : key as keyof typeof SECTION_CONFIG)}
                className={`group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  isActive 
                    ? 'border-gray-300 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-black/20' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 hover:shadow-sm dark:border-gray-700 dark:bg-black/10 dark:hover:border-gray-600 dark:hover:bg-black/20'
                }`}
              >
                <div 
                  className="rounded-md p-2"
                  style={{ backgroundColor: `${section.color}15` }}
                >
                  <Icon size={16} style={{ color: section.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-google-sans-code text-sm font-bold" style={{ color: section.color }}>
                    {section.title}
                  </h3>
                  <p className="truncate font-google-sans-code text-xs text-gray-500 dark:text-gray-400">
                    {section.pages.length} pages
                  </p>
                </div>
                {isActive ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ArrowRight size={14} className="text-gray-400 transition-transform group-hover:translate-x-1" />
                )}
              </button>
              
              {/* Active Filter Section - appears directly under the clicked button */}
              {isActive && (
                <div className="animate-in slide-in-from-top-2 mt-2 rounded-lg border border-gray-200 bg-white p-3 duration-200 dark:border-gray-700 dark:bg-black/5">
                  <div className="mb-3 border-b border-gray-100 pb-2 dark:border-gray-700">
                    <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {section.pages.map((page: string) => (
                      <Link
                        key={page}
                        href={`/${page}`}
                        className="group flex items-center gap-2 rounded-md p-2 font-google-sans-code text-xs text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <ArrowRight size={8} className="opacity-50 group-hover:opacity-100" />
                        <span className="truncate capitalize">{page}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All Pages Overview */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 duration-200 dark:border-gray-700 dark:bg-black/10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: `${colorValue}15` }}>
              <Layers size={20} style={{ color: colorValue }} />
            </div>
            <div>
              <h3 className="font-google-sans-code font-bold text-gray-900 dark:text-white">
                ALL PAGES
              </h3>
              <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                Complete site discovery
              </p>
            </div>
          </div>
          
          {/* Mobile-optimized single column layout */}
          <div className="space-y-4">
            {Object.entries(SECTION_CONFIG).map(([key, section]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                  <section.icon size={12} style={{ color: section.color }} />
                  <h4 className="font-google-sans-code text-xs font-bold uppercase tracking-wide" style={{ color: section.color }}>
                    {section.title}
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {section.pages.slice(0, 4).map((page: string) => (
                    <Link
                      key={page}
                      href={`/${page}`}
                      className="group flex items-center gap-2 rounded-md p-2 font-google-sans-code text-xs text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <ArrowRight size={8} className="opacity-50 group-hover:opacity-100" />
                      <span className="truncate capitalize">{page}</span>
                    </Link>
                  ))}
                  {section.pages.length > 4 && (
                    <button
                      onClick={() => setActiveFilter(key as keyof typeof SECTION_CONFIG)}
                      className="flex items-center gap-2 rounded-md p-2 font-google-sans-code text-xs text-gray-500 transition-all hover:text-gray-900 dark:text-gray-500 dark:hover:text-white"
                    >
                      <span>+{section.pages.length - 4} more</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle All Pages Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 font-google-sans-code text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 hover:shadow-sm dark:border-gray-700 dark:bg-black/20 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-black/40 dark:hover:text-white"
        >
          <Layers size={14} />
          <span>{isExpanded ? 'Hide' : 'Explore'} All Pages</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
}