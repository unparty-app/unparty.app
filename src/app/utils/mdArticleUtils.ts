import fs from 'fs';
import path from 'path';
import { EditorialArticle, EditorialSection } from '../constants/editorial-articles';
import { processInlineFormatting } from './inlineFormatting';
import { parseScrollRowParams, parseComponentParams } from './storyToEditorialConverter';
import { isPoemFence, poemSection } from './poem';
import { resolveCoverSrc } from './coverPath';
import { SITE_NAME } from '../constants/organization';

export interface MDArticleMeta {
  title?: string;
  // The title in search results, when `title` matches another page's
  'seo-title'?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  date?: string;
  'updated-at'?: string;
  updated?: string; // Old name of updated-at (#1030); still read so nothing loses its date
  category?: string;
  tags?: string[];
  published?: boolean;
  cover?: string | string[];  // Full-bleed hero cover - bare coverId (e.g. 'cover-002') or absolute path, resolved via resolveCoverSrc(). An inline array (cover: ["/covers/a.webp", "/covers/b.webp"]) gives a swipeable row of photos instead; a single value or one-item array is the single hero.
  coverAlt?: string;
  coverVideo?: string;  // Hero video, takes priority over cover — bare filename (resolved relative to this article's own unppp directory, e.g. 'llm_baseline.mp4' -> '/theunpartyrunway/llm_baseline.mp4') or an already-absolute path
}

// Frontmatter keys that accept an inline array, e.g. tags: ["a", "b"]. Only
// treated as an array when the value is bracketed; otherwise it stays a string.
const INLINE_ARRAY_KEYS = new Set(['tags', 'cover']);

/**
 * Split the inside of an inline array ("a", 'b, c', d) into items. Quote-aware,
 * so a quoted item may contain commas (alt text usually does); unquoted items
 * are trimmed. Line-based frontmatter can't express YAML block lists, so the
 * inline form is the only array syntax.
 */
function parseInlineArray(inner: string): string[] {
  const items: string[] = [];
  const itemRe = /\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,]+?))\s*(?:,|$)/g;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(inner)) !== null) {
    const item = match[3] !== undefined ? match[3] : (match[1] ?? match[2]).replace(/\\(.)/g, '$1');
    if (item) items.push(item);
  }
  return items;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { meta: MDArticleMeta; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { meta: {}, content };
  }
  
  const [, frontmatter, markdown] = match;
  const meta: MDArticleMeta = {};
  
  // Parse YAML-like frontmatter
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Handle inline arrays (tags, cover)
    if (INLINE_ARRAY_KEYS.has(key) && value.startsWith('[') && value.endsWith(']')) {
      (meta as Record<string, string | boolean | string[]>)[key] = parseInlineArray(value.slice(1, -1));
    } else if (key === 'published') {
      meta[key] = value.toLowerCase() === 'true';
    } else {
      (meta as Record<string, string | boolean | string[]>)[key] = value;
    }
  }
  
  return { meta, content: markdown };
}

/**
 * Convert markdown content to editorial sections
 */
export function markdownToEditorialSections(content: string): EditorialSection[] {
  const sections: EditorialSection[] = [];
  const lines = content.split('\n');
  let currentSection = '';
  let sectionType: EditorialSection['type'] = 'paragraph';
  let sectionId = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }
      continue;
    }
    
    // Handle ScrollRow custom syntax (shared with the story pipeline):
    // :::scrollRow[type=covers,coverIds=[cover-001,cover-002],title=Related]:::
    if (line.startsWith(':::scrollRow[') && line.endsWith(']:::')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }

      const params = parseScrollRowParams(line.slice(13, -4));
      sections.push({
        id: `scrollrow-${sectionId++}`,
        type: 'scrollRow',
        metadata: {
          scrollRowType: params.type as 'covers' | 'music' | 'stories' | 'gif' | 'hearth' | 'candid' | 'portrait' | 'photos',
          maxItems: params.maxItems,
          moreLink: params.moreLink,
          title: params.title,
          coverIds: params.coverIds,
          trackIds: params.trackIds,
          photographer: params.photographer,
          gifSources: params.gifSources,
          hearthSources: params.hearthSources,
          portraitSources: params.portraitSources,
          candidSources: params.candidSources,
          photoSources: params.photoSources,
        }
      });
      continue;
    }

    // Handle Component custom syntax (shared with the story pipeline):
    // :::component[name=ComponentName,prop1=value1]:::
    if (line.startsWith(':::component[') && line.endsWith(']:::')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }

      const params = parseComponentParams(line.slice(13, -4));
      sections.push({
        id: `component-${sectionId++}`,
        type: 'component',
        metadata: {
          componentName: params.name,
          componentProps: params.props
        }
      });
      continue;
    }

    // Handle headings
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
      }
      // First heading becomes hero
      if (sections.length === 0) {
        sections.push({
          id: 'hero',
          type: 'hero',
          content: processInlineFormatting(line.substring(2).trim()),
          metadata: { size: 'large', emphasis: true }
        });
      } else {
        sections.push({
          id: `heading-${sectionId++}`,
          type: 'heading',
          content: processInlineFormatting(line.substring(2).trim()),
          metadata: { size: 'large' }
        });
      }
      currentSection = '';
      continue;
    }
    
    // Handle subheadings
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
      }
      sections.push({
        id: `heading-${sectionId++}`,
        type: 'heading',
        content: processInlineFormatting(line.substring(3).trim()),
        metadata: { size: 'medium' }
      });
      currentSection = '';
      continue;
    }
    
    // Handle h3 subheadings
    if (line.startsWith('### ')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }
      sections.push({
        id: `heading-${sectionId++}`,
        type: 'heading',
        content: processInlineFormatting(line.substring(4).trim()),
        metadata: { size: 'small' }
      });
      continue;
    }

    // Handle bullet list items — emit each as its own paragraph to avoid
    // the list renderer's | delimiter conflicting with | characters in content
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }
      sections.push({
        id: `section-${sectionId++}`,
        type: 'paragraph',
        content: processInlineFormatting(line.substring(2).trim())
      });
      continue;
    }

    // Handle quotes
    if (line.startsWith('> ')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
      }
      sections.push({
        id: `quote-${sectionId++}`,
        type: 'quote',
        content: processInlineFormatting(line.substring(2).trim())
      });
      currentSection = '';
      continue;
    }
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
      }

      // Find the end of code block
      let codeContent = '';
      const language = line.substring(3).trim();
      i++; // Skip the opening ```

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }

      // ```poem fence (```poem Heart names its icon): verse, kept as written
      if (isPoemFence(language)) {
        sections.push(poemSection(`poem-${sectionId++}`, language, codeContent, sections, processInlineFormatting));
        currentSection = '';
        continue;
      }

      sections.push({
        id: `code-${sectionId++}`,
        type: 'code',
        content: codeContent.trim(),
        metadata: language ? { language } : undefined
      });
      currentSection = '';
      continue;
    }

    // Handle markdown tables: lines starting with |
    if (line.startsWith('|')) {
      if (currentSection) {
        sections.push({
          id: `section-${sectionId++}`,
          type: sectionType,
          content: processInlineFormatting(currentSection.trim())
        });
        currentSection = '';
      }

      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length > 0) {
        const parseRow = (rowLine: string): string[] =>
          rowLine.trim().replace(/^\||\|$/g, '').split('|').map(cell => processInlineFormatting(cell.trim()));

        const headers = parseRow(tableLines[0]);
        const rows: string[][] = [];
        for (let r = 1; r < tableLines.length; r++) {
          if (tableLines[r].match(/^[\|\s\-:]+$/)) continue;
          rows.push(parseRow(tableLines[r]));
        }

        sections.push({
          id: `table-${sectionId++}`,
          type: 'table',
          metadata: { headers, rows }
        });
      }
      continue;
    }

    // Regular content
    if (currentSection) {
      currentSection += '\n' + line;
    } else {
      currentSection = line;
      sectionType = 'paragraph';
    }
  }
  
  // Add final section if exists
  if (currentSection) {
    sections.push({
      id: `section-${sectionId++}`,
      type: sectionType,
      content: processInlineFormatting(currentSection.trim())
    });
  }
  
  return sections;
}

/**
 * Scan UNPPP directories for MD files
 */
export function scanUnpppDirectoriesForMD(): Array<{ unpppId: string; mdFiles: string[] }> {
  const unpppsWithMD: Array<{ unpppId: string; mdFiles: string[] }> = [];
  const appDir = path.join(process.cwd(), 'src', 'app');
  
  try {
    const entries = fs.readdirSync(appDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('theunparty')) {
        const unpppPath = path.join(appDir, entry.name);
        const mdFiles: string[] = [];
        
        try {
          const unpppEntries = fs.readdirSync(unpppPath);
          for (const file of unpppEntries) {
            if (file.endsWith('.md')) {
              mdFiles.push(file);
            }
          }
          
          if (mdFiles.length > 0) {
            unpppsWithMD.push({
              unpppId: entry.name,
              mdFiles
            });
          }
        } catch {
          // Ignore directories we can't read
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error scanning UNPPP directories:', error);
  }
  
  return unpppsWithMD;
}

/**
 * Load and convert MD file to editorial article
 */
export function loadMDAsEditorialArticle(unpppId: string, mdFileName: string): EditorialArticle | null {
  const mdPath = path.join(process.cwd(), 'src', 'app', unpppId, mdFileName);
  
  try {
    const content = fs.readFileSync(mdPath, 'utf-8');
    const { meta, content: markdownContent } = parseFrontmatter(content);
    const sections = markdownToEditorialSections(markdownContent);
    
    const covers = ([] as string[]).concat(meta.cover ?? []).filter(Boolean).map((c) => resolveCoverSrc(c));

    // Generate slug from filename
    const slug = mdFileName.replace('.md', '').toLowerCase();
    const fullSlug = `${unpppId}-${slug}`;
    
    return {
      slug: fullSlug,
      title: meta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      seoTitle: meta['seo-title'],
      subtitle: meta.subtitle,
      description: meta.description || `Article from ${unpppId}`,
      category: meta.category || 'UNPPP',
      date: meta.date || new Date().toISOString().split('T')[0],
      updated: meta['updated-at'] || meta.updated,
      published: meta.published !== false, // Default to true
      author: meta.author || SITE_NAME,
      readTime: `${Math.max(1, Math.ceil(sections.length / 3))} min read`,
      tags: meta.tags || [unpppId],
      // coverImage is always the first photo, so single-cover consumers (JSON-LD,
      // palette, video poster) keep working; coverImages only exists for 2+.
      coverImage: covers[0],
      coverImages: covers.length > 1 ? covers : undefined,
      coverAlt: covers.length ? (meta.coverAlt || meta.title) : undefined,
      coverVideo: meta.coverVideo
        ? (meta.coverVideo.startsWith('/') ? meta.coverVideo : `/${unpppId}/${meta.coverVideo}`)
        : undefined,
      sections,
      // Add metadata to identify this as an MD-based article
      _source: {
        type: 'md',
        unpppId,
        fileName: mdFileName,
        path: mdPath
      }
    } as EditorialArticle & { _source: { type: string; unpppId: string; fileName: string; path: string } };
  } catch (error) {
    console.error(`Error loading MD file ${mdPath}:`, error);
    return null;
  }
}

/**
 * Get all MD-based articles from UNPPP directories
 */
export function getAllMDArticles(): EditorialArticle[] {
  const articles: EditorialArticle[] = [];
  const unpppsWithMD = scanUnpppDirectoriesForMD();
  
  for (const { unpppId, mdFiles } of unpppsWithMD) {
    for (const mdFile of mdFiles) {
      const article = loadMDAsEditorialArticle(unpppId, mdFile);
      if (article) {
        articles.push(article);
      }
    }
  }
  
  return articles;
}

/**
 * MD articles a page renders from its own folder, outside the unppp scan
 * ([folder under src/app, file]): /sprint's. Each owns a THOUGHTS. thread
 */
export const PAGE_MD_ARTICLES: Array<[string, string]> = [['sprint', 'how-sprints-work.md']];

/** A page's own MD article by its slug (`<folder>-<file>`), or null */
export function getPageMDArticle(slug: string): EditorialArticle | null {
  for (const [folder, file] of PAGE_MD_ARTICLES) {
    if (`${folder}-${file.replace('.md', '').toLowerCase()}` === slug) return loadMDAsEditorialArticle(folder, file);
  }
  return null;
}

/**
 * Get MD articles for a specific UNPPP
 */
export function getMDArticlesForUnppp(unpppId: string): EditorialArticle[] {
  const articles: EditorialArticle[] = [];
  const appDir = path.join(process.cwd(), 'src', 'app', unpppId);
  
  try {
    const entries = fs.readdirSync(appDir);
    
    for (const file of entries) {
      if (file.endsWith('.md')) {
        const article = loadMDAsEditorialArticle(unpppId, file);
        if (article) {
          articles.push(article);
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return articles;
}