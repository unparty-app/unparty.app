import { EditorialSection } from '../../constants/editorial-articles/types';

export interface OutlineEntry {
  id: string;      // section.id — matches data-section-id / sectionRefs key
  label: string;
  depth: 0 | 1 | 2;
  icon?: string;   // A hero's hand-drawn icon name (metadata.icon), shown before the label
}

/**
 * Strip inline markdown and HTML for plain-text outline labels.
 * Order matters: links first, then emphasis markers, then tags.
 */
export function stripInlineMarkup(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derive outline entries from an article's sections.
 * Stories map markdown #/##/### to heading sections; articles also surface
 * interactive sections (component, challenge, ranking, foundersQuestion).
 * Only top-level sections are walked — `columns` children have no
 * data-section-id wrapper and can't be scroll targets.
 */
export function deriveOutlineEntries(sections: EditorialSection[]): OutlineEntry[] {
  const entries: OutlineEntry[] = [];

  for (const section of sections) {
    let label = '';
    let depth: 0 | 1 | 2 = 0;

    switch (section.type) {
      case 'hero':
        label = stripInlineMarkup(section.content || '');
        depth = 0;
        break;
      case 'heading':
        label = stripInlineMarkup(section.content || '');
        depth = section.metadata?.size === 'small' ? 2 : section.metadata?.size === 'medium' ? 1 : 0;
        break;
      case 'component':
        label = section.metadata?.title || section.metadata?.componentName || '';
        depth = 1;
        break;
      case 'challenge':
        label = section.metadata?.title || 'Challenge';
        depth = 1;
        break;
      case 'ranking':
        label = section.metadata?.title || 'Ranking';
        depth = 1;
        break;
      case 'foundersQuestion':
        label = section.metadata?.title || "Founder's Question";
        depth = 1;
        break;
      default:
        continue;
    }

    if (label) entries.push({ id: section.id, label, depth, ...(section.type === 'hero' && section.metadata?.icon ? { icon: section.metadata.icon } : {}) });
  }

  return entries;
}
