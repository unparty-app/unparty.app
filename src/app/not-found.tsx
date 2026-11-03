import type { Metadata } from 'next';
import { headers } from 'next/headers';
import NotFoundView from './components/NotFoundView';
import errorMessages from '../data/404-errors.json';
import { FOUNDER_CTA } from './constants/organization';
import { classifyPath, suggestRoutes } from '@/lib/not-found';

const fallbackMessage = 'Cannot find this page right now. Human error, probably ours.';

export const metadata: Metadata = {
  title: 'Not found',
};

/**
 * The 404 page. Rendered on the server, so a URL no route matches ships its
 * content in the HTML. A page's notFound() would get Next's empty shell
 * instead, so the middleware sends a missing /article, /story, /watch, /html
 * or /unppp slug down the unmatched path first (src/lib/known-routes.ts). It
 * also passes the requested path as `x-pathname`.
 *
 * - One line from 404-errors.json, picked per request
 * - "did you mean": up to three real pages close to the missing path
 * - The site's one ask ("build yours", FoundersConfig founder.cta) and search
 * - Counted by NotFoundView once it's on screen (POST /api/not-found;
 *   NotFoundHit, no personal data). Not here: Next renders this component on
 *   every request, as the fallback every page ships with
 *
 * Probes for software this site doesn't run (.php, .env, wp-admin) get the
 * plain page: no suggestions, no ask.
 */
export default async function NotFound() {
  const h = await headers();
  const path = h.get('x-pathname') || '';
  const kind = classifyPath(path);
  const suggestions = path && kind === 'page' ? suggestRoutes(path) : [];

  const lines = Array.isArray(errorMessages) && errorMessages.length > 0 ? errorMessages : [fallbackMessage];
  const line = lines[Math.floor(Math.random() * lines.length)];

  return (
    <NotFoundView
      path={path}
      line={line}
      suggestions={suggestions}
      cta={kind === 'page' ? FOUNDER_CTA : null}
    />
  );
}
