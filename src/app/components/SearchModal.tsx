'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

import { X, Search, AlertCircle, FileText, Loader2, CheckSquare, ExternalLink, Book, Database } from '@/app/components/icons';
import type { SearchResult } from '../api/search/route';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string; // Opens already searching for this (e.g. the 404 page's missing path)
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  cached: boolean;
  sources: {
    local: number;
    external: number;
  };
  externalEnabled: boolean;
  limitedResults?: boolean;
}

export default function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const { colorValue } = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMeta, setSearchMeta] = useState<Pick<SearchResponse, 'cached' | 'sources' | 'externalEnabled' | 'limitedResults'> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Bumped by every search: a response that comes back after a newer search
  // started is dropped, so a slow first query can't replace what was typed
  const searchIdRef = useRef(0);

  // Focus input when modal opens; on close, drop any search still in flight
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) searchIdRef.current++;
  }, [isOpen]);

  // Opened with a query: show it and search straight away
  const [openedWith, setOpenedWith] = useState<string | null>(null);
  if (isOpen && initialQuery && openedWith !== initialQuery) {
    setOpenedWith(initialQuery);
    setQuery(initialQuery);
  }
  if (!isOpen && openedWith !== null) {
    setOpenedWith(null);
  }

  // Reset state when the modal closes (adjusting state during render on the
  // isOpen change, however the parent closed it)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setSelectedIndex(0);
      setSearchMeta(null);
    }
  }

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    const id = ++searchIdRef.current;
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchMeta(null);
      setLoading(false); // A dropped search in flight won't clear it
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      if (id !== searchIdRef.current) return;
      setResults(data.results);
      setSearchMeta({
        cached: data.cached,
        sources: data.sources,
        externalEnabled: data.externalEnabled,
        limitedResults: data.limitedResults
      });
      setSelectedIndex(0);
    } catch (err) {
      if (id !== searchIdRef.current) return;
      console.error('Search error:', err);
      setError('Search temporarily unavailable. Please try again.');
      setResults([]);
    } finally {
      if (id === searchIdRef.current) setLoading(false);
    }
  }, []);

  // Run the query the modal was opened with
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the modal with a query starts that search: an effect responding to the modal opening
    if (isOpen && openedWith) performSearch(openedWith);
  }, [isOpen, openedWith, performSearch]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    searchIdRef.current++; // What's in flight is for the old text

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  }, [performSearch]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    onClose();
    if (result.url.startsWith('http')) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      router.push(result.url);
    }
  }, [onClose, router]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, results, onClose, handleResultSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsContainerRef.current && results.length > 0) {
      const selectedElement = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results]);

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <FileText className="w-4 h-4" />;
      case 'article':
        return <Book className="w-4 h-4" />;
      case 'story':
        return <ExternalLink className="w-4 h-4" />;
      case 'step':
        return <CheckSquare className="w-4 h-4" />;
      case 'wiki':
      case 'runway':
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get type badge color
  const getTypeBadgeStyle = (type: string) => {
    const baseClasses = "px-2 py-0.5 rounded text-xs font-google-sans-code uppercase";
    switch (type) {
      case 'page':
        return `${baseClasses} bg-blue-500/20 text-blue-300`;
      case 'article':
        return `${baseClasses} bg-purple-500/20 text-purple-300`;
      case 'story':
        return `${baseClasses} bg-orange-500/20 text-orange-300`;
      case 'step':
        return `${baseClasses} bg-green-500/20 text-green-300`;
      case 'wiki':
      case 'runway':
        return `${baseClasses} bg-yellow-500/20 text-yellow-300`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-300`;
    }
  };

  // Highlight matching text in title
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          className="bg-transparent font-bold"
          style={{ color: colorValue }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--background)] border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200"
        style={{ borderColor: `${colorValue}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: `${colorValue}20` }}>
          <Search className="w-5 h-5 text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="What are you looking for?"
            className="flex-1 bg-transparent outline-none font-vt323 text-[var(--foreground)] placeholder:text-gray-500"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: colorValue }} />}
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--background-highlight)] rounded transition"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Meta Info */}
        {searchMeta && results.length > 0 && (
          <div className="px-4 py-2 text-xs font-google-sans-code text-gray-500 border-b flex items-center justify-between" style={{ borderColor: `${colorValue}10` }}>
            <div className="flex items-center gap-3">
              <span>{results.length} thought{results.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{searchMeta.sources.local} APP</span>
              {searchMeta.externalEnabled && (
                <>
                  <span>•</span>
                  <span>{searchMeta.sources.external} API</span>
                </>
              )}
              {searchMeta.cached && (
                <>
                  <span>•</span>
                  <span className="text-green-400">⚡ cached</span>
                </>
              )}
            </div>
            {searchMeta.limitedResults && (
              <span className="text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Limited results (search API unavailable)
              </span>
            )}
          </div>
        )}

        {/* Results */}
        <div
          ref={resultsContainerRef}
          className="max-h-[500px] overflow-y-auto"
        >
          {error && (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p className="font-google-sans-code text-sm text-gray-400">{error}</p>
            </div>
          )}

          {!error && loading && query.trim() && (
            <div className="px-4 py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" style={{ color: colorValue }} />
              <p className="font-vt323 uppercase text-sm" style={{ color: colorValue }}>
                unparty-app is thinking.
              </p>
            </div>
          )}

          {!error && !loading && query.trim() && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="font-google-sans-code text-sm text-gray-400">
                No results found for <span className="font-bold" style={{ color: colorValue }}>{query}</span>
              </p>
            </div>
          )}

          {!error && !loading && !query.trim() && (
            <div className="px-4 py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="font-vt323 uppercase text-sm" style={{ color: colorValue }}>
                Search can not and will not talk to you. 
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↑</kbd>
                <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↓</kbd>
                <span>navigate</span>
                <span>•</span>
                <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↵</kbd>
                <span>select</span>
                <span>•</span>
                <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">ESC</kbd>
                <span>close</span>
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--background-highlight)] transition border-b text-left ${
                index === selectedIndex ? 'bg-[var(--background-highlight)]' : ''
              }`}
              style={{ borderColor: `${colorValue}10` }}
              onClick={() => handleResultSelect(result)}
            >
              {/* Icon */}
              <div
                className="mt-1 flex-shrink-0 p-2 rounded"
                style={{
                  backgroundColor: index === selectedIndex ? `${colorValue}20` : 'transparent',
                  color: index === selectedIndex ? colorValue : 'var(--text-muted)'
                }}
              >
                {getResultIcon(result.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-google-sans-code font-semibold text-sm text-[var(--foreground)] truncate">
                    {highlightMatch(result.title, query)}
                  </h3>
                  <span className={getTypeBadgeStyle(result.type)}>
                    {result.type}
                  </span>
                  {result.source === 'external' && (
                    <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  )}
                </div>

                {/* Snippet - Rendered with markdown formatting */}
                <p className="text-xs text-gray-400 line-clamp-2 font-google-sans-code">             
                        {result.content.substring(0, 150)}                                                 
                        {result.content.length > 150 && '...'}                                             
                      </p>

                {/* Metadata */}
                {result.metadata && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    {result.metadata.category && (
                      <span className="font-google-sans-code">{result.metadata.category}</span>
                    )}
                    {result.metadata.author && (
                      <>
                        <span>•</span>
                        <span>{result.metadata.author}</span>
                      </>
                    )}
                    {result.relevance > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-12 h-1 rounded-full bg-gray-700 overflow-hidden">
                            <span
                              className="block h-full"
                              style={{
                                width: `${result.relevance * 100}%`,
                                backgroundColor: colorValue
                              }}
                            />
                          </span>
                          <span>{(result.relevance * 100).toFixed(0)}%</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-gray-500 font-google-sans-code" style={{ borderColor: `${colorValue}20` }}>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↑</kbd>
              <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↓</kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--background-highlight)] border border-gray-700">↵</kbd>
              <span>to select</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
