import type { Metadata } from 'next';
import UnpppsConfig from '@/data/UnpppsConfig.json';
import UnpppTypesConfig from '@/data/UnpppTypesConfig.json';
import { FOUNDER_PROJECTS, SITE_HEADLINE, SITE_NAME } from '../constants/organization';
import { generatePageMetadata } from '../utils/ogMetadata';
import { getPortfolio } from '@/lib/component-portfolio';
import { FAQ_PUBLISHED, FAQ_QUESTIONS } from '@/lib/faq';
import { getTypeGroups } from '../utils/unpppDataAdapter';
import { getRepoNameForUnppp } from '@/utils/unppp-repo-mapping';
import { resolveCoverSrc } from '../utils/coverPath';
import type { HubRow } from '@/lib/type-hub';
import AboutClient, { type AboutData } from './AboutClient';

export const metadata: Metadata = generatePageMetadata({
  title: `about | ${SITE_NAME}`,
  description: `${SITE_HEADLINE}. Where the work goes, what is being built, and what you can build with it.`,
  path: '/about',
});

// How many of the busiest projects /about shows beside the owner's own
const BUSIEST = 6;

const usable = (value: string | null | undefined) => (value && value !== 'null' ? value.trim() : undefined);
const typeColor = (type: string) => UnpppTypesConfig.types.find((t) => t.id === type)?.color;

/**
 * /about - the site's work, shown rather than told, to drive what's next: the
 * owner's projects and the busiest ones by effort, where the work goes by
 * kind of build, what anyone can build with it, what it stands for, the
 * questions people ask, and the one ask. /founders tells the founder's story;
 * this shows the work. Gathered here on the server, laid out by AboutClient.
 */
export default function AboutPage() {
  const unppps = new Map(UnpppsConfig.unppps.map((u) => [u.id, u]));

  // The owner's projects, in their order; an entry that points at an unppp
  // takes what it leaves out (cover, color, line) from that unppp, and shows
  // where it stands (selling, shipped, building) on its card
  const yours: HubRow[] = FOUNDER_PROJECTS.map((p) => {
    const u = unppps.get(p.id);
    const cover = p.cover ?? usable(u?.cover);
    return {
      href: `/${p.id}`,
      title: p.name,
      detail: p.tagline || p.description || usable(u?.tagline) || usable(u?.description),
      cover: cover ? resolveCoverSrc(cover) : undefined,
      color: p.color ?? usable(u?.color) ?? (p.type ? typeColor(p.type) : undefined),
      value: p.stage ?? 'yours',
    };
  });
  const taken = new Set(yours.map((r) => r.href));
  const busiest: HubRow[] = getTypeGroups()
    .flatMap((g) => g.repositories)
    .filter((r) => unppps.has(r.id) && !taken.has(`/${r.id}`))
    .sort((a, b) => b.commits_per_month - a.commits_per_month)
    .slice(0, BUSIEST)
    .map((r) => {
      const u = unppps.get(r.id)!;
      const description = usable(u.description);
      const cover = usable(u.cover);
      return {
        href: `/${r.id}`,
        title: getRepoNameForUnppp(r.id) ?? r.id,
        detail: description && description.toLowerCase() !== r.id ? description : usable(u.name),
        cover: cover ? resolveCoverSrc(cover) : undefined,
        color: usable(u.color) ?? typeColor(r.type),
        value: `${r.type} · ${Math.round(r.commits_per_month)}/mo`,
      };
    });

  const components: HubRow[] = getPortfolio()
    .filter((c) => c.home?.published && c.home.category === 'MAKE.')
    .map((c) => ({ href: `/article/${c.home!.slug}`, title: c.label, detail: c.home!.blurb }));

  const data: AboutData = {
    projects: [...yours, ...busiest],
    components,
    faq: FAQ_PUBLISHED ? FAQ_QUESTIONS.slice(0, 5).map((q) => ({ id: q.id, q: q.q, a: q.a, link: q.link })) : [],
  };
  return <AboutClient data={data} />;
}
