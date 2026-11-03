/**
 * Utility to convert Story format to EditorialArticle format
 * Parses markdown content into structured EditorialSection format
 */

import { Story } from '../../utils/StorySchema';
import { EditorialArticle, EditorialSection } from '../constants/editorial-articles';
import { processInlineFormatting } from './inlineFormatting';
import { isPoemFence, poemSection } from './poem';
import { resolveCoverSrc } from './coverPath';
import storiesManifest from '@/data/storiesManifest.json';

/**
 * Convert a Story to EditorialArticle format
 */
export function convertStoryToEditorialArticle(story: Story): EditorialArticle {
  const sections = parseMarkdownToSections(story.content || '');

  return {
    slug: (storiesManifest.coverIdToSlug as Record<string, string>)[story.id.replace('story-', 'cover-')] ?? story.id,
    sourceRoute: 'story',
    title: story.metadata.title,
    subtitle: story.metadata.subtitle,
    description: story.metadata.description || '',
    category: story.metadata.category,
    date: story.metadata.date,
    startedAt: story.metadata['started-at'],
    updated: story.metadata['updated-at'],
    published: story.metadata.published,
    author: story.metadata.author,
    authorImage: story.metadata.authorImage,
    authorPage: story.metadata.author === 'portrait' ? '/founders' : undefined,
    builder: story.metadata.builder,
    builderImage: story.metadata.builderImage,
    // The story's song, playable in the byline bar like an article's theme song
    appleMusicUrl: story.metadata.appleMusicUrl || undefined,
    coverImage: story.metadata.cover ? resolveCoverSrc(story.metadata.cover) : undefined,
    coverAlt: story.metadata.cover ? story.metadata.title : undefined,
    coverColor: story.metadata['cover-color']?.trim() || undefined,
    readTime: estimateReadTime(story.content || ''),
    tags: extractTags(story),
    sections
  };
}

/**
 * Parse markdown content into EditorialSection format
 */
export function parseMarkdownToSections(markdown: string): EditorialSection[] {
  const lines = markdown.split('\n');
  const sections: EditorialSection[] = [];
  let sectionId = 1;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const id = `section-${sectionId++}`;

    // Handle ScrollRow custom syntax: :::scrollRow[type=covers,maxItems=5,moreLink=/covers,title=Related]:::
    if (trimmed.startsWith(':::scrollRow[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(13, -4); // Extract content between [ and ]:::
      const params = parseScrollRowParams(paramsStr);

      sections.push({
        id,
        type: 'scrollRow',
        metadata: {
          scrollRowType: params.type as 'covers' | 'music' | 'stories' | 'gif' | 'hearth'| 'candid' | 'portrait' | 'photos',
          maxItems: params.maxItems,
          moreLink: params.moreLink,
          title: params.title,
          coverIds: params.coverIds,
          trackIds: params.trackIds,
          gifSources: params.gifSources,
          hearthSources: params.hearthSources,
          portraitSources: params.portraitSources,
          candidSources: params.candidSources,
          photoSources: params.photoSources,
        }
      });
      i++;
      continue;
    }

    // Handle ProfileImage custom syntax: :::profileImage[src=/path,alt=Name,size=lg,link=/path,caption=Text]:::
    if (trimmed.startsWith(':::profileImage[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(16, -4); // Extract content between [ and ]:::
      const params = parseProfileImageParams(paramsStr);

      sections.push({
        id,
        type: 'profileImage',
        metadata: {
          src: params.src,
          alt: params.alt,
          size: params.size as 'small' | 'medium' | 'large',
          link: params.link,
          caption: params.caption,
          align: params.align as 'left' | 'center' | 'right',
          borderColor: params.borderColor
        }
      });
      i++;
      continue;
    }

    // Handle Component custom syntax: :::component[name=ComponentName,prop1=value1,prop2=value2]:::
    if (trimmed.startsWith(':::component[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(13, -4); // Extract content between [ and ]:::
      const params = parseComponentParams(paramsStr);

      sections.push({
        id,
        type: 'component',
        metadata: {
          componentName: params.name,
          componentProps: params.props
        }
      });
      i++;
      continue;
    }

    // Handle Formula custom syntax: :::formula[steps=STEP1|+ STEP2|- STEP3,result=RESULT,title=TITLE]:::
    if (trimmed.startsWith(':::formula[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(11, -4); // Extract content between [ and ]:::
      const params = parseFormulaParams(paramsStr);

      sections.push({
        id,
        type: 'component',
        metadata: {
          componentName: 'FormulaDisplay',
          componentProps: {
            steps: params.steps,
            result: params.result,
            title: params.title,
            align: params.align
          }
        }
      });
      i++;
      continue;
    }

    // Handle Badge custom syntax: :::badge[text=Text,variant=primary,size=md,link=/path]:::
    if (trimmed.startsWith(':::badge[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(9, -4); // Extract content between [ and ]:::
      const params = parseBadgeParams(paramsStr);

      sections.push({
        id,
        type: 'badge',
        metadata: {
          badgeText: params.text,
          badgeVariant: params.variant as 'primary' | 'secondary' | 'header',
          badgeSize: params.size as 'sm' | 'md' | 'lg',
          badgeLink: params.link
        }
      });
      i++;
      continue;
    }

    // Handle Book custom syntax: :::book[id=bookId,showBookDetails=true]:::
    if (trimmed.startsWith(':::book[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(8, -4); // Extract content between [ and ]:::
      const params = parseBookParams(paramsStr);

      sections.push({
        id,
        type: 'quote',
        metadata: {
          bookId: params.bookId,
          showBookDetails: params.showBookDetails
        }
      });
      i++;
      continue;
    }
    // Handle Question custom syntax: :::question[questionId=brand_q3,categoryId=brand]:::
    if (trimmed.startsWith(':::question[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(12, -4); // Extract content between [ and ]:::
      const params = parseQuestionParams(paramsStr);

      sections.push({
        id,
        type: 'foundersQuestion',
        questionId: params.questionId,
        categoryId: params.categoryId
      });
      i++;
      continue;
    }
    // Handle Question custom syntax: :::question[questionId=brand_q3,categoryId=brand]:::
    if (trimmed.startsWith(':::question[') && trimmed.endsWith(']:::')) {
      const paramsStr = trimmed.slice(12, -4); // Extract content between [ and ]:::
      const params = parseQuestionParams(paramsStr);

      sections.push({
        id,
        type: 'foundersQuestion',
        questionId: params.questionId,
        categoryId: params.categoryId
      });
      i++;
      continue;
    }

    // Handle Strike Block: :::strike[variant=animated,color=theme]
    // Content here (multiple lines supported)
    // :::
    if (trimmed.startsWith(':::strike[')) {
      const paramsLine = trimmed;
      const closingBracketIndex = paramsLine.indexOf(']');
      const paramsStr = paramsLine.slice(10, closingBracketIndex);
      const params = parseStrikeParams(paramsStr);

      i++; // Move to next line
      const contentLines: string[] = [];

      // Collect all lines until we hit closing :::
      while (i < lines.length) {
        const currentLine = lines[i];
        if (currentLine.trim() === ':::') {
          break;
        }
        contentLines.push(currentLine);
        i++;
      }

      sections.push({
        id,
        type: 'strikeBlock',
        content: contentLines.join('\n'),
        metadata: {
          font: params.font || 'vt323',
          variant: params.variant || 'standard',
          color: params.color,
          animate: params.animate,
          thickness: params.thickness
        }
      });

      i++; // Skip closing :::
      continue;
    }

    // Handle fenced code blocks: lines starting with ```
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      const language = trimmed.slice(3).trim(); // Extract language identifier if present
      i++; // Move past the opening fence
      
      // Collect all lines until we hit the closing fence
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();
        if (currentTrimmed.startsWith('```')) {
          break;
        }
        codeLines.push(currentLine);
        i++;
      }
      
      // Skip the closing fence
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++;
      }
      
      // ```poem fence (```poem Heart names its icon): verse, kept as written,
      // that its icon carries through the story (PoemWalker)
      if (isPoemFence(language)) {
        sections.push(poemSection(id, language, codeLines.join('\n'), sections, processInlineFormatting));
        continue;
      }

      // Create code section
      sections.push({
        id,
        type: 'code',
        content: codeLines.join('\n'),
        metadata: {
          language: language || undefined
        }
      });
      continue;
    }

    // Handle markdown tables: lines starting with |
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      // Collect all consecutive lines that are part of the table
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length > 0) {
        const tableData = parseMarkdownTable(tableLines);
        sections.push({
          id,
          type: 'table',
          metadata: {
            headers: tableData.headers,
            rows: tableData.rows
          }
        });
      }
      continue;
    }

    // Handle Blockquote block: :::blockquote[author=Attribution]
    // Content here (multiple lines supported)
    // :::
    if (trimmed.startsWith(':::blockquote[')) {
      const closingBracketIndex = trimmed.indexOf(']');
      const paramsStr = trimmed.slice(14, closingBracketIndex);
      const authorMatch = paramsStr.match(/author=(.+)/);
      const author = authorMatch ? authorMatch[1].trim() : undefined;

      i++;
      const contentLines: string[] = [];

      while (i < lines.length) {
        if (lines[i].trim() === ':::') break;
        contentLines.push(lines[i]);
        i++;
      }

      sections.push({
        id,
        type: 'quote',
        content: contentLines.join('\n').trim(),
        metadata: { author, style: 'highlight' }
      });

      i++; // skip closing :::
      continue;
    }

    // Handle VerseScroll block: :::verseScroll[title=TITLE]
    // Each line: label | verse text | attribution
    // :::
    if (trimmed.startsWith(':::verseScroll[')) {
      const closingBracketIndex = trimmed.indexOf(']');
      const paramsStr = trimmed.slice(15, closingBracketIndex);
      const titleMatch = paramsStr.match(/title=(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      i++;
      const cards: { label: string; verse: string; attribution: string }[] = [];

      while (i < lines.length) {
        const line = lines[i].trim();
        if (line === ':::') break;
        if (line) {
          const parts = line.split(' | ');
          if (parts.length >= 3) {
            cards.push({
              label: parts[0].trim(),
              verse: parts[1].trim(),
              attribution: parts[2].trim()
            });
          }
        }
        i++;
      }

      sections.push({
        id,
        type: 'component',
        metadata: {
          componentName: 'VerseCardScroll',
          componentProps: { title, cards }
        }
      });

      i++; // skip closing :::
      continue;
    }

    // Handle Columns layout block: :::columns[layout=1:1,sticky=right,align=center,mobile=peek]
    // First column
    // ---column---
    // Second column (each further ---column--- adds one; layout=1:1:1 sizes three)
    // :::
    // align: start (default) | center | end; mobile: stack (default) | peek,
    // where phones swipe the columns sideways with the next one peeking in
    if (trimmed.startsWith(':::columns[')) {
      const closingBracketIndex = trimmed.indexOf(']');
      const paramsStr = trimmed.slice(11, closingBracketIndex);
      const param = (name: string) => paramsStr.match(new RegExp(`${name}=([^,\\]]+)`))?.[1]?.trim();
      const layout = param('layout') || '1:1';
      const sticky = param('sticky') as 'left' | 'right' | undefined;
      const verticalAlign = param('align') as 'start' | 'center' | 'end' | undefined;
      const mobile = param('mobile') as 'stack' | 'peek' | undefined;

      i++;
      const blockLines: string[] = [];

      while (i < lines.length) {
        if (lines[i].trim() === ':::') break;
        blockLines.push(lines[i]);
        i++;
      }

      // Split on every ---column--- divider
      const columnLines: string[][] = [[]];
      for (const line of blockLines) {
        if (line.trim() === '---column---') columnLines.push([]);
        else columnLines[columnLines.length - 1].push(line);
      }

      sections.push({
        id,
        type: 'columns',
        // Only the first column opens with a drop cap; one per column is redundant
        columnSections: columnLines.map((col, colIndex) =>
          parseMarkdownToSections(col.join('\n')).map(s =>
            colIndex > 0 && s.metadata?.dropCap ? { ...s, metadata: { ...s.metadata, dropCap: false } } : s
          )
        ),
        metadata: { layout, sticky, verticalAlign, mobile }
      });

      i++; // skip closing :::
      continue;
    }

    // Handle different markdown formats
    // Handle section break (simple full-width line): ---
    if (trimmed === '---' || trimmed === '___') {
      sections.push({
        id,
        type: 'sectionBreak'
      });
    }
    // Handle stylistic divider (dots with color): ***
    else if (trimmed === '***') {
      sections.push({
        id,
        type: 'divider'
      });
    } else if (trimmed.startsWith('# ')) {
      // Main headings
      sections.push({
        id,
        type: 'heading',
        content: processInlineFormatting(trimmed.replace('# ', '')),
        metadata: { size: 'large', emphasis: true }
      });
    } else if (trimmed.startsWith('## ')) {
      // Sub headings
      sections.push({
        id,
        type: 'heading',
        content: processInlineFormatting(trimmed.replace('## ', '')),
        metadata: { size: 'medium' }
      });
    } else if (trimmed.startsWith('### ')) {
      // Smaller headings
      sections.push({
        id,
        type: 'heading',
        content: processInlineFormatting(trimmed.replace('### ', '')),
        metadata: { size: 'small' }
      });
    } else if (trimmed.startsWith('> ')) {
      // Quotes
      sections.push({
        id,
        type: 'quote',
        content: processInlineFormatting(trimmed.replace('> ', '')),
        metadata: { style: 'highlight' }
      });
    } else if (trimmed.match(/^[A-Z\s]{10,}$/)) {
      // All caps sentences as hero sections
      sections.push({
        id,
        type: 'hero',
        content: processInlineFormatting(trimmed),
        metadata: { size: 'large', emphasis: true }
      });
    } else {
      // Regular paragraphs
      const isFirstParagraph = sections.length === 0 || sections[sections.length - 1].type !== 'paragraph';
      sections.push({
        id,
        type: 'paragraph',
        content: processInlineFormatting(trimmed),
        metadata: {
          size: 'medium',
          dropCap: isFirstParagraph && trimmed.length > 50
        }
      });
    }

    i++;
  }

  return sections;
}

export interface ScrollRowParams {
  type?: string;
  maxItems?: number;
  moreLink?: string;
  title?: string;
  coverIds?: string[];
  trackIds?: string[];
  photographer?: string;
  gifSources?: string[];
  hearthSources?: string[];
  candidSources?: string[];
  portraitSources?: string[];
  photoSources?: string[];
}

/**
 * Parse ScrollRow parameters from string
 * Example: "type=covers,maxItems=5,moreLink=/covers,title=Related Stories"
 * Shared with the MD-article parser (mdArticleUtils.ts).
 */
export function parseScrollRowParams(paramsStr: string): ScrollRowParams {
  const params: ScrollRowParams = {};

  // Split by comma but handle commas inside arrays
  const parts = paramsStr.split(',').reduce((acc: string[], part) => {
    const lastIndex = acc.length - 1;
    // Check if we're currently inside an array (last element has [ but not ])
    const isInsideArray = lastIndex >= 0 &&
      acc[lastIndex].includes('[') &&
      !acc[lastIndex].includes(']');

    if (isInsideArray) {
      // We're inside an array, keep combining until we hit the closing bracket
      acc[lastIndex] += ',' + part;
    } else {
      // Not inside an array, push as new element
      acc.push(part);
    }
    return acc;
  }, []);

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();
      
      // Handle arrays: coverIds=[cover-001,cover-002]
      if (value.startsWith('[') && value.endsWith(']')) {
        const arrayValue = value.slice(1, -1).split(',').map(v => v.trim());
        if (trimmedKey === 'coverIds' || trimmedKey === 'trackIds' || trimmedKey === 'gifSources' || trimmedKey === 'hearthSources' || trimmedKey === 'portraitSources' || trimmedKey === 'candidSources' || trimmedKey === 'photoSources') {
          params[trimmedKey] = arrayValue;
        }
      }
      // Handle numbers
      else if (!isNaN(Number(value))) {
        if (trimmedKey === 'maxItems') {
          params[trimmedKey] = Number(value);
        }
      }
      // Handle strings
      else {
        if (trimmedKey === 'type' || trimmedKey === 'moreLink' || trimmedKey === 'title' || trimmedKey === 'photographer') {
          params[trimmedKey] = value;
        }
      }
    }
  });

  return params;
}

interface ProfileImageParams {
  src?: string;
  alt?: string;
  size?: string;
  link?: string;
  caption?: string;
  align?: string;
  borderColor?: string;
}

/**
 * Parse ProfileImage parameters from string
 * Example: "src=/path,alt=Name,size=lg,link=/founders,caption=Text"
 */
function parseProfileImageParams(paramsStr: string): ProfileImageParams {
  const params: ProfileImageParams = {};

  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      let value = valueParts.join('=').trim();

      if (trimmedKey === 'src' || trimmedKey === 'alt' || trimmedKey === 'size' ||
          trimmedKey === 'link' || trimmedKey === 'caption' || trimmedKey === 'align' ||
          trimmedKey === 'borderColor') {
        // Ensure src has absolute path
        if (trimmedKey === 'src' && value && !value.startsWith('/') && !value.startsWith('http')) {
          value = '/' + value;
        }
        params[trimmedKey] = value;
      }
    }
  });

  return params;
}

/**
 * Parse markdown table into headers and rows
 * Example input:
 * [
 *   "|Header 1|Header 2|Header 3|",
 *   "|--------|--------|--------|",  (optional separator)
 *   "|Cell 1  |Cell 2  |Cell 3  |"
 * ]
 */
function parseMarkdownTable(tableLines: string[]): { headers: string[]; rows: string[][] } {
  if (tableLines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse a single table row
  const parseRow = (line: string): string[] => {
    // Remove leading/trailing pipes and split by pipe
    const trimmed = line.trim().replace(/^\||\|$/g, '');
    return trimmed.split('|').map(cell => processInlineFormatting(cell.trim()));
  };

  // First row is headers
  const headers = parseRow(tableLines[0]);
  const rows: string[][] = [];

  // Process remaining rows (skip separator row if present)
  for (let i = 1; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    // Skip separator rows (contain only dashes, pipes, and colons)
    if (line.match(/^[\|\s\-:]+$/)) {
      continue;
    }
    rows.push(parseRow(line));
  }

  return { headers, rows };
}

/**
 * Estimate reading time based on content
 */
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Extract tags from story metadata
 */
function extractTags(story: Story): string[] {
  const tags: string[] = [];
  
  if (story.metadata.category) {
    tags.push(story.metadata.category.toLowerCase());
  }
  
  if (story.metadata.song && story.metadata['song-artist']) {
    tags.push('music');
  }
  
  if (story.metadata.author === 'portrait') {
    tags.push('founder-story');
  }
  
  return tags;
}

/**
 * Parse component parameters from directive
 * Example: name=ColorMatchingGame,prop1=value1,prop2=value2
 */
export function parseComponentParams(paramsStr: string): { name?: string; props: Record<string, unknown> } {
  const props: Record<string, unknown> = {};
  let name: string | undefined;

  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'name') {
        name = value;
      } else {
        // Try to parse as JSON for complex types, otherwise use as string
        try {
          props[trimmedKey] = JSON.parse(value);
        } catch {
          props[trimmedKey] = value;
        }
      }
    }
  });

  return { name, props };
}

interface BadgeParams {
  text?: string;
  variant?: string;
  size?: string;
  link?: string;
}

/**
 * Parse Badge parameters from string
 * Example: "text=Visit Dashboard,variant=primary,size=lg,link=/theunpartydashboard"
 */
function parseBadgeParams(paramsStr: string): BadgeParams {
  const params: BadgeParams = {};

  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'text' || trimmedKey === 'variant' || trimmedKey === 'size' || trimmedKey === 'link') {
        params[trimmedKey as keyof BadgeParams] = value;
      }
    }
  });

  return params;
}
interface QuestionParams {
  questionId?: string;
  categoryId?: string;
}

/**
 * Parse Question parameters from string
 * Example: "questionId=brand_q3,categoryId=brand"
 */
function parseQuestionParams(paramsStr: string): QuestionParams {
  const params: QuestionParams = {};

  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'questionId' || trimmedKey === 'categoryId') {
        params[trimmedKey as keyof QuestionParams] = value;
      }
    }
  });

  return params;
}

interface BookParams {
  bookId?: string;
  showBookDetails?: boolean;
}

/**
 * Parse Book parameters from string
 * Example: "id=cmkmyw2wz000bvx6tzfz6ojvs,showBookDetails=true"
 */
function parseBookParams(paramsStr: string): BookParams {
  const params: BookParams = {
    showBookDetails: true // default to showing book details
  };

  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'id') {
        params.bookId = value;
      } else if (trimmedKey === 'showBookDetails') {
        params.showBookDetails = value === 'true';
      }
    }
  });

  return params;
}

interface FormulaParams {
  steps?: string;
  result?: string;
  title?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Parse Formula parameters from string
 * Example: "steps=STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY|/ BY SALES,result=COGS (Cost of Goods),title=Cost Formula"
 * 
 * Supports pipe-separated steps where each step can start with an operator (+, -, *, /, =)
 * to indicate mathematical operations.
 */

/** Known parameter keys for formula parsing */
const FORMULA_PARAM_KEYS = ['steps', 'result', 'title', 'align'] as const;

function parseFormulaParams(paramsStr: string): FormulaParams {
  const params: FormulaParams = {};

  // Split by comma, but need to preserve commas within the steps value
  // Steps use | as delimiter, so we can split on commas that are followed by known keys
  const paramKeysPattern = FORMULA_PARAM_KEYS.join('|');
  const parts = paramsStr.split(new RegExp(`,(?=(?:${paramKeysPattern})=)`));

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'steps' || trimmedKey === 'result' || trimmedKey === 'title') {
        params[trimmedKey] = value;
      } else if (trimmedKey === 'align') {
        if (value === 'left' || value === 'center' || value === 'right') {
          params.align = value;
        }
      }
    }
  });

  return params;
}

interface StrikeParams {
  font?: 'vt323' | 'mono' | 'default';
  variant?: 'standard' | 'bold' | 'double' | 'animated' | 'glitch';
  color?: string;
  animate?: boolean;
  thickness?: number;
}

/**
 * Parse Strike parameters from string
 * Example: "variant=animated,color=theme,font=vt323"
 */
function parseStrikeParams(paramsStr: string): StrikeParams {
  const params: StrikeParams = {};
  const parts = paramsStr.split(',');

  parts.forEach(part => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      if (trimmedKey === 'font') {
        // Validate font value
        if (value === 'vt323' || value === 'mono' || value === 'default') {
          params.font = value;
        }
      } else if (trimmedKey === 'variant') {
        // Validate variant value
        if (value === 'standard' || value === 'bold' || value === 'double' ||
            value === 'animated' || value === 'glitch') {
          params.variant = value;
        }
      } else if (trimmedKey === 'color') {
        params.color = value;
      } else if (trimmedKey === 'animate') {
        params.animate = value === 'true';
      } else if (trimmedKey === 'thickness') {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          params.thickness = numValue;
        }
      }
    }
  });

  return params;
}
