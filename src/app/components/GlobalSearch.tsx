'use client';

import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';

/**
 * GlobalSearch - Provides global Cmd+K / Ctrl+K keyboard shortcut
 *
 * This component should be added to the root layout to make search
 * accessible from anywhere in the application.
 *
 * Features:
 * - Cmd+K (Mac) / Ctrl+K (Windows/Linux) to open search
 * - Custom 'openGlobalSearch' event to programmatically open search
 * - ESC to close (handled by SearchModal)
 * - Prevents default browser behavior for Cmd+K
 *
 * Usage:
 * Add to layout.tsx:
 * <GlobalSearch />
 *
 * Programmatically open from any component, optionally with a query:
 * window.dispatchEvent(new CustomEvent('openGlobalSearch'))
 * window.dispatchEvent(new CustomEvent('openGlobalSearch', { detail: { query: 'theme' } }))
 */
export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setInitialQuery('');
        setIsOpen(true);
      }
    };

    const handleOpenSearch = (e: Event) => {
      const query = (e as CustomEvent<{ query?: string }>).detail?.query;
      setInitialQuery(typeof query === 'string' ? query : '');
      setIsOpen(true);
    };

    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Add custom event listener for programmatic opening
    window.addEventListener('openGlobalSearch', handleOpenSearch);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openGlobalSearch', handleOpenSearch);
    };
  }, []);

  return (
    <SearchModal
      isOpen={isOpen}
      initialQuery={initialQuery}
      onClose={() => setIsOpen(false)}
    />
  );
}
