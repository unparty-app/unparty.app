import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useBreadcrumbs } from './useBreadcrumbs';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import storiesManifest from '../../data/storiesManifest.json';
import articleCoversManifest from '../../data/articleCoversManifest.json';
import { resolveCoverSrc } from '../components/editorial/CoverImageBackground';
import { getPageConfig } from '../config/pageConfig';

export interface NavigationItem {
  pathname: string;
  title: string;
  color: string;
  category: string;
  isCurrentPage: boolean;
  isUnpppPage: boolean;
  coverSrc?: string;
}

// Resolved from pathname at render time (not from stored breadcrumb config) so
// it works retroactively for history recorded before covers existed.
function resolveBreadcrumbCoverSrc(pathname: string, unpppCover?: string): string | undefined {
  if (unpppCover) return resolveCoverSrc(unpppCover);

  const story = pathname.match(/^\/story\/([^/]+)\/?$/);
  if (story) {
    const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[decodeURIComponent(story[1])];
    if (coverId) return resolveCoverSrc(coverId);
  }

  const article = pathname.match(/^\/article\/([^/]+)\/?$/);
  if (article) {
    const cover = (articleCoversManifest.slugToCover as Record<string, string>)[decodeURIComponent(article[1])];
    if (cover) return resolveCoverSrc(cover);
  }

  const configCover = getPageConfig(pathname).cover;
  return configCover ? resolveCoverSrc(configCover) : undefined;
}

interface SmartNavigation {
  showDropdown: boolean;
  menuItems: NavigationItem[];
}

export function useSmartNavigation(): SmartNavigation {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs();

  return useMemo(() => {
    if (breadcrumbs.length === 0) {
      return {
        showDropdown: false,
        menuItems: []
      };
    }

    const menuItems: NavigationItem[] = breadcrumbs.map(breadcrumb => {
      // Find unppp data for color
      const unpppData = UnpppsConfig.unppps.find(unppp =>
        (unppp.id === 'theunpartyapp' ? '/' : `/${unppp.id}`) === breadcrumb.pathname
      );

      return {
        pathname: breadcrumb.pathname,
        title: unpppData?.name || breadcrumb.config.title,
        color: unpppData?.color || '#F9C22E', // Fallback to unparty yellow
        category: unpppData ? 'unppp' : breadcrumb.config.category || 'other',
        isCurrentPage: breadcrumb.pathname === pathname,
        isUnpppPage: !!unpppData,
        coverSrc: resolveBreadcrumbCoverSrc(breadcrumb.pathname, unpppData?.cover)
      };
    });

    return {
      showDropdown: true,
      menuItems
    };
  }, [breadcrumbs, pathname]);
}
