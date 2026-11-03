import { FOUNDER_CTA, ORGANIZATION_DESCRIPTION, SITE_HEADLINE, SITE_NAME, SITE_URL } from '@/app/constants/organization';
import { getPortfolio } from '@/lib/component-portfolio';
import { allReleases, componentOfRelease, fileSize, releaseHref, releaseSummary, releaseToolName } from '@/lib/releases';

/**
 * /llms.txt: the site for an AI agent, in the llms.txt format (a title, a
 * summary, then sections of links with a line each). A visitor sees the
 * site; their agent reads this and gets the same things as words: where to
 * start building, every tool released (what it does, its files, where to try
 * it) and every component, each with its own article. Built with the site
 * (releases come from RELEASES_JSON, src/lib/releases.ts).
 */

export const dynamic = 'force-static';

const url = (path: string) => (/^https?:/.test(path) ? path : `${SITE_URL}${path}`);
const line = (text: string) => text.replace(/\s+/g, ' ').trim();

export function GET() {
  const out: string[] = [`# ${SITE_NAME}`, '', `> ${line(SITE_HEADLINE)}`, '', line(ORGANIZATION_DESCRIPTION), ''];

  out.push('## Start here', '');
  if (FOUNDER_CTA) out.push(`- [${FOUNDER_CTA.label}](${url(FOUNDER_CTA.href)}): ${line(FOUNDER_CTA.pitch ?? 'where to start building your own')}`);
  out.push(`- [Price a build](${url('/goal-budget')}): what the work is worth, from real measured hours, and what it costs to run`, '');

  const latest = allReleases().filter((r) => r.latest);
  if (latest.length) {
    out.push('## Releases', '', `Every tool released here, free to use. All of it as JSON: ${url('/releases.json')}`, '');
    for (const release of latest) {
      const paired = componentOfRelease(release);
      const summary = releaseSummary(release);
      out.push(`- [${releaseToolName(release)} (${release.tag})](${url(releaseHref(release))}): ${summary || `version ${release.version}`}`);
      for (const file of release.files) out.push(`  - file: [${file.name}](${url(file.url)}) (${fileSize(file.size)})`);
      if (paired?.href) out.push(`  - try it: ${url(paired.href)}`);
    }
    out.push('');
  }

  const components = getPortfolio().filter((c) => c.home?.published);
  if (components.length) {
    out.push('## Components', '', 'Pieces of the site, each with an article where it runs live.', '');
    for (const c of components) {
      const needs = c.needs.length ? ` Runs on: ${c.needs.join(', ')}.` : '';
      out.push(`- [${c.label}](${url(`/article/${c.home!.slug}`)}): ${line(c.home!.blurb)}${needs}`);
    }
    out.push('');
  }

  out.push('## Optional', '', `- [Articles](${url('/article')}): guides and stories`, `- [Releases, as a page](${url('/releases')})`, '');

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
