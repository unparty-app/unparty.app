import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getPageConfig, type PageConfig } from '../config/pageConfig';
import { readSessionStorage, useSessionStorageValue, writeSessionStorage } from '@/hooks/useLocalStorage';

interface BreadcrumbItem {
  pathname: string;
  config: PageConfig;
  timestamp: number;
}

const BREADCRUMB_STORAGE_KEY = 'unparty-breadcrumbs';
const MAX_BREADCRUMBS = 6;

function parseBreadcrumbs(raw: string | null): BreadcrumbItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load breadcrumbs from session storage:', error);
    return [];
  }
}

/** Most recent first, deduped by path, capped, and always including home */
function addBreadcrumb(prev: BreadcrumbItem[], pathname: string): BreadcrumbItem[] {
  const newItem: BreadcrumbItem = {
    pathname,
    config: getPageConfig(pathname),
    timestamp: Date.now()
  };

  // Remove existing entry for this path if it exists
  const filtered = prev.filter(item => item.pathname !== pathname);
  
  // Add new item to the beginning
  const updated = [newItem, ...filtered];
  
  // Keep only the most recent MAX_BREADCRUMBS items
  const limited = updated.slice(0, MAX_BREADCRUMBS);
  
  // Always ensure home is included if not already present
  const hasHome = limited.some(item => item.pathname === '/');
  if (!hasHome && limited.length === MAX_BREADCRUMBS) {
    // Replace the oldest item with home
    limited[MAX_BREADCRUMBS - 1] = {
      pathname: '/',
      config: getPageConfig('/'),
      timestamp: Date.now() - 1000 // Slightly older timestamp
    };
  } else if (!hasHome) {
    // Add home to the end
    limited.push({
      pathname: '/',
      config: getPageConfig('/'),
      timestamp: Date.now() - 1000
    });
  }

  return limited;
}

export function useBreadcrumbs() {
  const pathname = usePathname();
  // sessionStorage is the source of truth (empty during SSR/hydration)
  const stored = useSessionStorageValue(BREADCRUMB_STORAGE_KEY);
  const breadcrumbs = useMemo(() => parseBreadcrumbs(stored), [stored]);

  // Record the current page when the pathname changes
  useEffect(() => {
    if (!pathname) return;
    const current = parseBreadcrumbs(readSessionStorage(BREADCRUMB_STORAGE_KEY));
    writeSessionStorage(BREADCRUMB_STORAGE_KEY, JSON.stringify(addBreadcrumb(current, pathname)));
  }, [pathname]);

  return breadcrumbs;
}
