/**
 * The site's public address, for src/app/constants/organization.ts.
 *
 * site.url in FoundersConfig ships as unparty's. A copy that hasn't changed it
 * must not tell search engines its pages belong to unparty.app, so while it's
 * still unparty's, a site on Vercel uses its own production address.
 * next.config.ts hands that over at build time as PRODUCTION_HOST, the same on
 * the server and in the browser. unparty.app itself stays on its configured
 * address, whether Vercel names it with www or without (a real copy got its
 * www address, so a site's production domain can go either way).
 */

// unparty.app, where builds are told: the one unparty address meant to stay in
// every copy (allowlisted in scripts/generate-unparty-refs.js)
export const UPSTREAM = 'https://www.unparty.app';

const bareHost = (host: string) => host.replace(/^www\./, '');

export function resolveSiteUrl(configured: string, productionHost?: string): string {
  const url = configured.replace(/\/+$/, '');
  if (url !== UPSTREAM || !productionHost) return url;
  return bareHost(productionHost) === bareHost(new URL(UPSTREAM).host) ? url : `https://${productionHost}`;
}
