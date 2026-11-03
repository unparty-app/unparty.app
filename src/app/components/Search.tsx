'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PAGE_CATEGORIES } from './CTA';

type SearchResult = {
  page: string;
  category: 'about' | 'build' | 'connect';
  href: string;
};

type SearchProps = {
  placeholder?: string;
  className?: string;
};

export default function Search({ 
  placeholder = "Search pages...", 
  className = "" 
}: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all pages with their categories for searching
  const allSearchablePages = useMemo(() => {
    const pages: SearchResult[] = [];
    Object.entries(PAGE_CATEGORIES).forEach(([category, pageList]) => {
      pageList.forEach((page) => {
        pages.push({
          page,
          category: category as 'about' | 'build' | 'connect',
          href: `/${page}`
        });
      });
    });
    return pages;
  }, []);

  // Filter pages based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return allSearchablePages.filter(({ page, category }) => 
      page.toLowerCase().includes(query) || 
      category.toLowerCase().includes(query)
    );
  }, [searchQuery, allSearchablePages]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="app-modal-input w-full rounded-xl px-4 py-3 font-google-sans-code text-white transition placeholder:text-gray-400 focus:outline-none"
      />

      {/* Search Results Dropdown */}
      {searchQuery.trim() && (
        <div className="vh-card absolute inset-x-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(249, 194, 46, 0.2)' }}>
          {filteredResults.length > 0 ? (
            <div className="p-2">
              {filteredResults.map(({ page, category, href }) => (
                <Link
                  key={page}
                  href={href}
                  onClick={() => {
                    setSearchQuery('');
                    // Close parent modal if it exists
                    const closeEvent = new CustomEvent('closeSearchModal');
                    window.dispatchEvent(closeEvent);
                  }}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-[var(--background-highlight)]"
                >
                  <span className="font-google-sans-code group-hover:text-[#F9C22E]" style={{ color: 'var(--foreground)' }}>
                    {page}
                  </span>
                  <span className="rounded px-2 py-1 font-google-sans-code text-xs" style={{ backgroundColor: 'var(--background-highlight)', color: 'var(--text-muted)' }}>
                    {category}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-left font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
              👾 ummm...nothing here for  &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}