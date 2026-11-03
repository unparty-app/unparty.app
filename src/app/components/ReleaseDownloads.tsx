'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

// A released file's address: /releases/<prefix>/<version>/<file>
const FILE = /^\/releases\/([^/]+)\/([^/]+)\/([^/?#]+)$/;

/**
 * ReleaseDownloads - counts downloads of released files (#1310 4c), the
 * honest measure next to builds: one listener for the whole site, so a file
 * is counted wherever its link is (a release's chapter on /releases, a link
 * in its notes, the RELEASES. row). Sends `release_downloaded` with the
 * prefix, version and file, through the same consent-gated analytics as
 * `cta_clicked`: nothing is sent until the visitor accepts. Renders nothing.
 */
export default function ReleaseDownloads() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return;
      const match = FILE.exec(link.pathname);
      if (!match) return;
      const [, prefix, version, file] = match;
      track('release_downloaded', { prefix, version, file: decodeURIComponent(file), page: window.location.pathname });
    };
    // Capture, so it counts even when a link's own handler stops the click
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
  return null;
}
