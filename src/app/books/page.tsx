'use client';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import BooksGallery from '../components/BooksGallery';
import { Grid3x3, List, Filter, LockIcon } from '@/app/components/icons';

const BooksPage = () => {
  const { colorValue } = useTheme();
  const [viewMode, setViewMode] = useState<1 | 2 | 3 | 4>(3);
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'quotes'>('all');

  return (
    <div className="min-h-screen w-full p-6" style={{ backgroundColor: 'var(--background)' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: `${colorValue}20`, border: `1px solid ${colorValue}` }}>
              <LockIcon size={24} style={{ color: colorValue }} />
            </div>
            <div>
              <h1 className="font-google-sans-code text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                BOOK.
              </h1>
              <p className="font-google-sans-code text-sm opacity-60" style={{ color: 'var(--foreground)' }}>
                To UNLOCK ➕BOOK. OR 🧗🏾‍♂️LANDMARK.
              </p>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-300/20 p-4"
               style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
            {/* Filter Mode */}
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: colorValue }} />
              <span className="font-vt323 text-xs font-semibold opacity-70" style={{ color: 'var(--foreground)' }}>
                
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    filterMode === 'all'
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={filterMode === 'all' ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  BOOKS.
                </button>
                <button
                  onClick={() => setFilterMode('available')}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    filterMode === 'available'
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={filterMode === 'available' ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  📮
                </button>
                <button
                  onClick={() => setFilterMode('quotes')}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    filterMode === 'quotes'
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={filterMode === 'quotes' ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  🟡
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300/20"></div>

            {/* Grid Layout */}
            <div className="flex items-center gap-2">
              <Grid3x3 size={16} style={{ color: colorValue }} />
              <span className="font-vt323 text-xs font-semibold opacity-70" style={{ color: 'var(--foreground)' }}>
                
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode(1)}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    viewMode === 1
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={viewMode === 1 ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  <List size={14} className="inline" /> 
                </button>
                <button
                  onClick={() => setViewMode(2)}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    viewMode === 2
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={viewMode === 2 ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  ②
                </button>
                <button
                  onClick={() => setViewMode(3)}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    viewMode === 3
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={viewMode === 3 ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  ③
                </button>
                <button
                  onClick={() => setViewMode(4)}
                  className={`rounded px-3 py-1 font-vt323 text-xs font-medium transition-all ${
                    viewMode === 4
                      ? 'text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={viewMode === 4 ? { backgroundColor: colorValue } : { color: 'var(--foreground)' }}
                >
                  ④
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Books Gallery */}
        <BooksGallery
          gridColumns={viewMode}
          showAvailableOnly={filterMode === 'available'}
          showQuotesOnly={filterMode === 'quotes'}
        />

        {/* Footer Info */}
        <div className="mt-8 rounded-lg border border-gray-300/20 p-4"
             style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
          <p className="font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
            📚 BOOKS. are reference sources only. 
          </p>
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
