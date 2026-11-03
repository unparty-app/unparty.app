import { listProjects } from '@/lib/projects';
import { getPortfolio } from '@/lib/component-portfolio';

export interface BuiltFromCard {
  href: string;
  title: string;
  subtitle?: string;
  color?: string;
}

/**
 * The "built from." row of every project page, by project id: the portfolio
 * components a project lists (`components` in UnpppsConfig or FoundersConfig),
 * each as a card leading to that component's article, in the project's color.
 * A component without a published article is left out, so a draft never links
 * to a 404; on npm run dev drafts show too (they open there), so the owner
 * sees each row fill in as its articles are written. Runs on the server (UnpppPageShell), so the article registry never
 * reaches the browser; the page's own row picks its project by path (BuiltFrom).
 */
const DEV = process.env.NODE_ENV === 'development';

export function builtFromCards(): Record<string, BuiltFromCard[]> {
  const homes = new Map(getPortfolio().map((item) => [item.name as string, item.home]));
  const cards: Record<string, BuiltFromCard[]> = {};
  for (const project of listProjects()) {
    const row = (project.components ?? []).flatMap((name) => {
      const home = homes.get(name);
      return home && (home.published || DEV) ? [{ href: `/article/${home.slug}`, title: home.title, subtitle: home.blurb.startsWith('TODO') ? undefined : home.blurb, color: project.color }] : [];
    });
    if (row.length > 0) cards[project.id] = row;
  }
  return cards;
}
