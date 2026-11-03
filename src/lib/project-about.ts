import 'server-only';
import { BASELINE } from '@/app/constants/organization';
import { findProjectById, listFounderProjects, projectStage } from '@/lib/projects';
import { loadStoryRepoMappings } from '@/app/utils/storyRepoMappings';
import { getEditorialArticlesForUnppp } from '@/app/constants/editorial-articles/registry';
import type { EditorialSection } from '@/app/constants/editorial-articles/types';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import storiesManifest from '@/data/storiesManifest.json';
import { cardsRow, chapter, component, line, row, storyPieces, toTimeline } from '@/app/founders/resume-data';

/**
 * A project's about (#716), as article sections that AboutComponent renders
 * under the project's own story, laid out the way the resume lays out its
 * chapters (resumeToArticle), from what every copy has:
 *
 * - EFFORT.: its measured hours (FoundersConfig `baseline`), then the stories
 *   and docs about it, month by month, on the resume's ink timeline.
 * - STORIES.: the stories that name it (the build's story mentions).
 * - DOC.: its five newest docs (src/app/<id>/*.md).
 * - NEXT.: the founder's project path with this one lit, where it leads, or
 *   where it came from when it leads nowhere yet.
 *
 * A chapter with nothing to show is left out.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
// How many of its docs DOC. lists, newest first
const DOCS_SHOWN = 5;

const hours = (n: number) => (n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.round(n).toLocaleString('en-US'));

// "14 months", "5 weeks", "3 days": first day of work to last
function span(from?: string, to?: string): string | null {
  if (!from || !to) return null;
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1);
  if (days >= 60) return `${Math.round(days / 30.44)} months`;
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return `${days} day${days === 1 ? '' : 's'}`;
}

export async function projectAbout(id: string): Promise<EditorialSection[]> {
  const project = findProjectById(id);
  if (!project) return [];
  const sections: EditorialSection[] = [];

  // The stories that name it, and its docs
  const { mappings } = await loadStoryRepoMappings();
  const coverIdToSlug = storiesManifest.coverIdToSlug as Record<string, string>;
  const mentioned = new Set(
    Object.entries(mappings)
      .filter(([, m]) => m.mentionedRepositories.includes(id))
      .map(([storyId]) => coverIdToSlug[storyId.replace('story-', 'cover-')])
  );
  const stories = (await storyPieces()).filter((piece) => mentioned.has(piece.slug)).sort((a, b) => a.created.localeCompare(b.created));
  const docs = getEditorialArticlesForUnppp(id).sort((a, b) => a.date.localeCompare(b.date));

  // EFFORT.: the hours, then the writing growing month by month
  const measured = BASELINE?.projects.find((p) => p.id === id);
  const series = [
    { name: 'stories', months: toTimeline(stories.map((s) => s.created)) },
    { name: 'docs', months: toTimeline(docs.map((d) => d.date.slice(0, 10))) },
  ].filter((s) => s.months.length > 0);
  if (measured) {
    const ran = span(measured.from, measured.to);
    sections.push(chapter('about-effort', 'EFFORT.', 'Activity'), line('about-effort-line', `${hours(measured.hours)} hours${ran ? `, over ${ran}` : ''}.`));
    if (stories.length + docs.length > 1) {
      sections.push(component('about-effort-timeline', 'InkTimeline', { series, label: `Stories and docs about ${project.name}, month by month` }));
    }
  }

  if (stories.length > 0) {
    sections.push(
      chapter('about-stories', 'STORIES.', 'BookOpen'),
      line('about-stories-line', 'where it shows up.'),
      cardsRow('about-stories-row', stories.map((s) => ({ href: s.href, cover: s.cover, title: s.title, subtitle: s.description })))
    );
  }

  // The newest few; the timeline above still counts them all
  const newestDocs = [...docs].reverse().slice(0, DOCS_SHOWN);
  if (newestDocs.length > 0) {
    const avatar = project.cover ? resolveCoverSrc(project.cover) : undefined;
    sections.push(
      chapter('about-doc', 'DOC.', 'FileText'),
      line('about-doc-line', 'how it works.'),
      ...newestDocs.map((d) => row(`about-doc-${d.slug}`, `**${d.title}**`, `/article/${d.slug}`, avatar))
    );
  }

  // NEXT.: only for the founder's own projects, the ones on the path
  const path = listFounderProjects();
  if (path.some((p) => p.id === id)) {
    const leadsTo = project.leadsTo ?? [];
    const from = path.filter((p) => p.leadsTo?.includes(id)).map((p) => p.id);
    if (leadsTo.length + from.length > 0) {
      sections.push(
        chapter('about-next', 'NEXT.', 'Sailboat'),
        line('about-next-line', leadsTo.length > 0 ? 'where it leads.' : 'where it came from.'),
        component('about-next-path', 'InkPath', {
          label: `Where ${project.name} sits among the projects, and where it leads`,
          focus: id,
          highlight: [...from, id, ...leadsTo],
          stops: path.map((p) => ({
            id: p.id,
            name: p.name,
            stage: projectStage(p),
            ...(p.tagline || p.description ? { tagline: p.tagline || p.description } : {}),
            ...(p.cover ? { cover: resolveCoverSrc(p.cover) } : {}),
            ...(p.color ? { color: p.color } : {}),
            href: `/${p.id}`,
            leadsTo: p.leadsTo ?? [],
          })),
        })
      );
    }
  }

  return sections;
}
