import { parseMarkdownText } from '../../utils/textParsing';
import ArticleHeaderPublisher from './ArticleHeaderPublisher';
import CodeBlock from './CodeBlock';
import PoemVerse from './PoemVerse';
import { FOUNDER } from '../../constants/organization';
import Thoughts from './Thoughts';
import { getAuthorDisplayName } from '../../constants/authors';
import type { EditorialArticle, EditorialSection } from '../../constants/editorial-articles/types';

// Section types that carry prose. Interactive/visual embeds (component,
// music, video, gif, scrollRow, ranking, text, foundersQuestion, challenge,
// badge, profileImage, strikeBlock, image) are dropped in reader mode.
const PROSE_TYPES = new Set<EditorialSection['type']>([
  'hero', 'paragraph', 'heading', 'quote', 'list', 'code', 'table', 'personal', 'sectionBreak', 'divider',
]);

// Columns nest prose in leftSections/rightSections — read them in order as a
// single flow, everything else passes through as-is.
function flattenSections(sections: EditorialSection[]): EditorialSection[] {
  return sections.flatMap(section =>
    section.type === 'columns'
      ? [...(section.leftSections ?? []), ...(section.rightSections ?? [])]
      : [section]
  );
}

function ReaderSection({ section }: { section: EditorialSection }) {
  const content = section.content || '';
  const metadata = section.metadata;

  switch (section.type) {
    case 'hero':
      // Heroes act as chapter markers in the visual article; the reader's h1
      // is the title block, so they render one level down
      return (
        <h2
          className="mb-6 mt-16 border-l-4 pl-4 font-vt323 text-3xl font-bold leading-none tracking-tight"
          style={{ color: 'var(--foreground)', borderColor: 'var(--theme-color)' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdownText(content) }}
        />
      );

    case 'heading': {
      const HeadingTag = metadata?.size === 'large' ? 'h3' : 'h4';
      return (
        <HeadingTag
          className={`mb-4 mt-12 font-vt323 font-bold leading-none tracking-tight ${
            metadata?.size === 'large' ? 'text-2xl' : 'text-xl'
          }`}
          style={{ color: 'var(--foreground)' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdownText(content) }}
        />
      );
    }

    case 'paragraph':
      // A poem: the reader shows it in full, as it unfolds in the article
      // (PoemVerse), with whose it is; its title is the heading right above it
      if (metadata?.preserveWhitespace) {
        return (
          <figure className="my-10" aria-label={metadata.title ? `poem: ${metadata.title}` : 'poem'}>
            <PoemVerse verseHtml={parseMarkdownText(content)} icon={metadata.icon} ink={metadata.ink} />
            <figcaption className="mt-6 font-vt323 text-base tracking-wider" style={{ color: 'var(--text-muted)' }}>
              — {(metadata.author || FOUNDER.name).toLowerCase()}
            </figcaption>
          </figure>
        );
      }
      return (
        <p
          className={`mb-6 font-space-grotesk text-lg leading-8 ${metadata?.emphasis ? 'font-medium' : ''}`}
          style={{ color: 'var(--foreground)' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdownText(content) }}
        />
      );

    case 'personal':
      return (
        <p
          className="mb-6 font-space-grotesk text-sm italic leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdownText(content) }}
        />
      );

    case 'quote': {
      // Book-backed quotes fetch their text client-side; without inline
      // content there is nothing to read here
      if (!content.trim()) return null;
      const quoteContent = content.replace(/^["“]/, '').replace(/["”]$/, '').trim();
      return (
        <blockquote
          className="my-8 border-l-2 pl-6"
          style={{ borderColor: 'var(--theme-color)' }}
        >
          <p
            className="font-space-grotesk text-lg italic leading-8"
            style={{ color: 'var(--foreground)' }}
            dangerouslySetInnerHTML={{ __html: `&ldquo;${parseMarkdownText(quoteContent)}&rdquo;` }}
          />
          {metadata?.author && (
            <cite className="mt-2 block font-vt323 text-base not-italic tracking-wider" style={{ color: 'var(--text-muted)' }}>
              — {metadata.author}
            </cite>
          )}
        </blockquote>
      );
    }

    case 'list': {
      const items = content.split('|');
      const ListTag = metadata?.numbered ? 'ol' : 'ul';
      return (
        <ListTag
          className={`mb-6 space-y-2 pl-6 ${metadata?.numbered ? 'list-decimal' : 'list-disc'}`}
          style={{ color: 'var(--foreground)' }}
        >
          {items.map((item, index) => (
            <li
              key={index}
              className="font-space-grotesk text-lg leading-8"
              dangerouslySetInnerHTML={{ __html: parseMarkdownText(item.trim()) }}
            />
          ))}
        </ListTag>
      );
    }

    case 'code':
      return (
        <div className="mb-8">
          <CodeBlock code={content} language={metadata?.language} />
        </div>
      );

    case 'table':
      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--theme-color)' }}>
                {metadata?.headers?.map((header, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-left font-google-sans-code text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                    dangerouslySetInnerHTML={{ __html: header }}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {metadata?.rows?.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-3 py-2 font-google-sans-code text-foreground"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'sectionBreak':
      return <hr className="my-12 border-0 border-t border-border" />;

    case 'divider':
      return (
        <div role="separator" className="my-12 font-vt323 text-xl tracking-[0.5em]" style={{ color: 'var(--text-muted)' }}>
          <span aria-hidden>···</span>
        </div>
      );

    default:
      return null;
  }
}

// The plain-text reading view: title block plus prose sections in a single
// quiet column, every poem shown in full. Server component. Text is always
// the foreground color: most theme colors fall under 4.5:1 as text on one
// background or the other (the brand yellow is 1.4:1 on light), so the
// theme color (--theme-color, kept on <html> by ThemeContext) only marks
// heroes and quotes.
export default function ReaderArticle({
  article,
  showThoughts = true,
}: {
  article: EditorialArticle;
  /** THOUGHTS. thread; off for content the thoughts API doesn't serve (stories) */
  showThoughts?: boolean;
}) {
  const sections = flattenSections(article.sections).filter(section => PROSE_TYPES.has(section.type));

  const dateLabel = article.date ? new Date(article.date).toISOString().slice(0, 10) : null;
  const bylineParts = [
    article.author && getAuthorDisplayName(article.author),
    dateLabel,
    article.readTime,
  ].filter(Boolean);

  return (
    <div className="min-h-screen">
      <ArticleHeaderPublisher article={article} />
      <article className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12">
          <h1
            className="mb-4 font-vt323 text-4xl font-bold leading-none tracking-tight sm:text-5xl"
            style={{ color: 'var(--foreground)' }}
          >
            {article.title}
          </h1>
          {article.subtitle && (
            <p
              className="mb-4 font-space-grotesk text-xl leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownText(article.subtitle) }}
            />
          )}
          <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
            {bylineParts.join(' · ')}
          </p>
        </header>

        {sections.map((section, index) => (
          <ReaderSection key={section.id || index} section={section} />
        ))}

        {showThoughts && <Thoughts articleSlug={article.slug} />}
      </article>
    </div>
  );
}
