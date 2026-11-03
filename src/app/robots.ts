import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/constants/organization';

// Served at /robots.txt — previously this path fell through to the 404 page's
// HTML, which gave crawlers nothing to work with.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/party/',
        '/api/',
        '/blobupload/',
        '/checkout/',
        '/sign-in',
        '/sign-up',
        '/business-test/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
