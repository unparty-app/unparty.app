'use client';

import { useMemo, useState } from 'react';
import HorizontalRow from '../../components/HorizontalRow';
import CoverImageItem from '../components/CoverImageItem';
import CategoryModal from '../components/CategoryModal';
import CoverPreviewModal from '../components/CoverPreviewModal';
import { COVER_IMAGES, getCoversByCategory, getCoverIdFromFilename } from './covers-data';
import { useTheme } from '../contexts/ThemeContext';
import { useStepImageRegistry } from '@/hooks/useStepImageRegistry';

// Category configuration - easy to reorder, add, or remove categories
const CATEGORY_CONFIG = [
  { key: 'unparty', label: 'unparty', filterFn: () => getCoversByCategory('unparty') },
  { key: 'gatekeeper', label: 'gatekeeper', filterFn: () => getCoversByCategory('gatekeeper') },
  { key: 'dtla', label: 'dtla', filterFn: () => getCoversByCategory('dtla') },
  { key: 'core', label: 'CORE.', filterFn: () => getCoversByCategory('core') },
  { key: 'llm', label: 'LLM.', filterFn: () => getCoversByCategory('llm') },
];

export default function CoversGalleryPage() {
  const { colorValue } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<{ key: string; label: string; covers: string[] } | null>(null);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);

  const handleStoryClick = (coverId: string) => {
    setSelectedCoverId(coverId);
  };

  // Registry lookup only for the on-page rows (each capped at 5 items below)
  // - the "MORE" overflow (CategoryModal/PhotoGallery) isn't wired to the
  // registry yet.
  const visibleCoverIds = useMemo(
    () =>
      CATEGORY_CONFIG.flatMap((category) =>
        category.filterFn().slice(0, 5).map((cover) => getCoverIdFromFilename(cover.filename))
      ),
    []
  );
  const stepRegistry = useStepImageRegistry(visibleCoverIds);

  return (
    <main className="min-h-screen px-4 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12 text-left">
          <h1 
            className="mb-4 font-google-sans-code text-4xl font-bold uppercase tracking-tight md:text-5xl lg:text-6xl"
            style={{ color: colorValue }}
          >
            COVERS.
          </h1>
          <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
            Browse covers by category. Click on any cover to view its story.
          </p>
        </header>

        {/* Category Rows */}
        <div className="space-y-12">
          {CATEGORY_CONFIG.map((category) => {
            const covers = category.filterFn();
            const coverFilenames = covers.map(c => c.filename);

            // Show row even if empty, with a message
            if (coverFilenames.length === 0) {
              return (
                <div key={category.key} className="w-full">
                  <h2 
                    className="mb-4 font-google-sans-code text-xl font-bold uppercase tracking-wide"
                    style={{ color: colorValue }}
                  >
                    {category.label}
                  </h2>
                  <div className="py-8 px-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="font-google-sans-code text-sm text-gray-500 dark:text-gray-400">
                      👾 No covers yet in this category.
                    </p>
                  </div>
                </div>
              );
            }

            // Create CoverImageItem components for HorizontalRow
            const coverItems = coverFilenames.slice(0, 5).map((filename, index) => (
              <CoverImageItem
                key={`${category.key}-${index}`}
                filename={filename}
                basePath="/covers"
                alt={`${category.label} cover`}
                aspectRatio="16:9"
                enableStories={true}
                onStoryClick={handleStoryClick}
                stepEntry={stepRegistry[getCoverIdFromFilename(filename)]}
              />
            ));

            return (
              <HorizontalRow
                key={category.key}
                title={`${category.label} (${coverFilenames.length})`}
                items={coverItems}
                moreLink="#"
                maxItems={5}
                onMoreClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory({
                    key: category.key,
                    label: category.label,
                    covers: coverFilenames
                  });
                }}
              />
            );
          })}
        </div>

        {/* Footer Info */}
        <footer className="mt-16 border-t border-gray-200 pt-8 text-center dark:border-gray-800">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-google-sans-code text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                SCORE.
              </h3>
              <p className="font-google-sans-code text-2xl font-bold" style={{ color: colorValue }}>
                {COVER_IMAGES.length}
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-google-sans-code text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                PRIORITY.
              </h3>
              <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
                YAH.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-google-sans-code text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                UNPARTY.
              </h3>
              <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
                🟡
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Category Modal */}
      {selectedCategory && (
        <CategoryModal
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory.key}
          categoryLabel={selectedCategory.label}
          covers={selectedCategory.covers}
        />
      )}

      {/* Cover Story Modal */}
      {selectedCoverId && (
        <CoverPreviewModal
          coverId={selectedCoverId}
          isOpen={!!selectedCoverId}
          onClose={() => setSelectedCoverId(null)}
        />
      )}
    </main>
  );
}
