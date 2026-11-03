import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import { existsSync, readFileSync } from 'fs';

// The slugs each dynamic route serves (src/lib/known-routes.ts), handed to
// the middleware at build time instead of imported, so a missing file can't
// break dev or tsc. `npm run build` always makes it first; without it the list
// is empty and missing slugs fall back to the page's own notFound()
const routeManifestPath = 'src/data/routeManifest.json';
const routeManifest = existsSync(routeManifestPath) ? readFileSync(routeManifestPath, 'utf8') : '{}';

// The owner's releases (scripts/generate-releases.mjs, run by `npm run build`
// before next build), handed to the app the same way: Vercel's functions don't
// carry public/, so nothing reads the file at request time. Read through
// src/lib/releases.ts; without the file there are no releases
const releasesPath = 'public/releases.json';
const releases = existsSync(releasesPath) ? readFileSync(releasesPath, 'utf8') : '{"releases":[]}';

// Where the owner's hours went (scripts/generate-focus.mjs), handed over the
// same way and read through src/lib/focus.ts; without the file there's none
const focusPath = 'src/data/focus.json';
const focus = existsSync(focusPath) ? readFileSync(focusPath, 'utf8') : '{"weeks":[],"repos":[]}';


const nextConfig: NextConfig = {
  env: {
    ROUTE_MANIFEST: routeManifest,
    RELEASES_JSON: releases,
    FOCUS_JSON: focus,
    // A copy still on unparty's site.url uses this address (src/lib/site-address.ts)
    PRODUCTION_HOST: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '',
  },
  allowedDevOrigins: ['192.168.1.207'],
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // The link preview (/api/og) reads its fonts, covers and author photos from
  // disk, so every deploy draws them, previews and a copy without a domain
  // included. On Vercel, public/ is served from the CDN and isn't in a
  // function unless it's named here
  outputFileTracingIncludes: {
    '/api/og': [
      './src/app/api/og/fonts/*.woff',
      './public/covers/*.{png,jpg,jpeg,gif,svg}',
      './public/*.{png,jpg,jpeg}',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'o0taaguaxcxz7rhu.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      // Clerk user avatars (and Clerk's default avatar fallback)
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      }
    ],
    // Configure allowed quality values for Next.js 16 compatibility
    // Includes common values + 85 used by CoverPhoto component
    qualities: [50, 75, 85, 90, 95],
  },
  // Webpack configuration for handling Node.js modules in client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback for Node.js modules that shouldn't be in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Note: OpenTelemetry instrumentation is enabled via instrumentation.ts
  // Next.js 13.2+ automatically loads this file at startup
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Wrap with Workflow SDK to enable "use workflow" and "use step" directives
export default (withMDX(nextConfig));
