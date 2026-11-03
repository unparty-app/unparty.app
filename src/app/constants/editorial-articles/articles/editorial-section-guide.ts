import type { EditorialArticle } from '../types';

export const EDITORIAL_SECTION_GUIDE: EditorialArticle = {
  slug: 'editorial-section-guide',
  title: 'editorial section guide.',
  subtitle: 'every section type, with a live example.',
  description: 'A reference for every section type available in the unparty editorial system.',
  category: '📖',
  date: '2026-06-26',
  updated: '2026-11-02',
  published: true,
  author: 'portrait',
  authorPage: '/founders',
  coverImage: '/covers/cover-005.png',
  musicTrackId: 'guess-what',  // Theme song: Syleena Johnson - Guess What
  readTime: '5 min read',
  tags: ['guide', 'editorial', 'reference'],
  sections: [

    // ── HERO ─────────────────────────────────────────────────────────────────
    {
      id: 'hero',
      type: 'hero',
      content: 'EVERY SECTION. ONE PLACE.',
      metadata: { size: 'large', emphasis: true }
    },

    {
      id: 'hero-note',
      type: 'paragraph',
      content: 'This article renders one live example of every section type available in the editorial system. Use it as a reference when building articles.',
      metadata: { dropCap: true, size: 'medium' }
    },

    {
      id: 'hero-code',
      type: 'code',
      content: `{ id: 'hero', type: 'hero', content: 'YOUR HEADLINE.', metadata: { size: 'large' | 'medium' | 'small', emphasis: true } }`,
      metadata: { language: 'typescript', caption: 'hero — large full-width headline. emphasis adds a colored rule beneath.' }
    },

    // ── HEADING ──────────────────────────────────────────────────────────────
    { id: 'divider-heading', type: 'divider' },
    {
      id: 'heading-example',
      type: 'heading',
      content: 'This is a heading.',
      metadata: { size: 'large' }
    },
    {
      id: 'heading-code',
      type: 'code',
      content: `{ id: 'heading-1', type: 'heading', content: 'Section title.', metadata: { size: 'large' | 'medium' } }`,
      metadata: { language: 'typescript', caption: 'heading — section title with a left accent bar. size: large renders h2, medium renders h3.' }
    },

    // ── PARAGRAPH ────────────────────────────────────────────────────────────
    { id: 'divider-paragraph', type: 'divider' },
    {
      id: 'paragraph-heading',
      type: 'heading',
      content: 'Paragraph',
      metadata: { size: 'medium' }
    },
    {
      id: 'paragraph-example',
      type: 'paragraph',
      content: 'Paragraphs are the main body text. They support **bold**, *italic*, and [links](https://unparty.app). Drop cap styles the first letter large. Size controls text scale. Style accent wraps the block in a colored border.',
      metadata: { dropCap: true, size: 'medium' }
    },
    {
      id: 'paragraph-code',
      type: 'code',
      content: `{ id: 'p-1', type: 'paragraph', content: 'Body text here.', metadata: { dropCap: true, size: 'small' | 'medium' | 'large', style: 'minimal' | 'accent' | 'highlight' } }`,
      metadata: { language: 'typescript', caption: 'paragraph — main body text with markdown inline support.' }
    },

    // ── QUOTE ────────────────────────────────────────────────────────────────
    { id: 'divider-quote', type: 'divider' },
    {
      id: 'quote-heading',
      type: 'heading',
      content: 'Quote',
      metadata: { size: 'medium' }
    },
    {
      id: 'quote-example',
      type: 'quote',
      content: 'Float like a butterfly, sting like a bee.',
      metadata: { author: 'Muhammad Ali', style: 'highlight' }
    },
    {
      id: 'quote-code',
      type: 'code',
      content: `{ id: 'quote-1', type: 'quote', content: 'The quote text.', metadata: { author: 'Name', style: 'minimal' | 'accent' | 'highlight' } }
// Or pull from a Book DB record:
{ id: 'quote-2', type: 'quote', metadata: { bookId: 'book-slug' } }`,
      metadata: { language: 'typescript', caption: 'quote — pull quote with optional author attribution. bookId fetches from the DB.' }
    },

    // ── IMAGE ────────────────────────────────────────────────────────────────
    { id: 'divider-image', type: 'divider' },
    {
      id: 'image-heading',
      type: 'heading',
      content: 'Image',
      metadata: { size: 'medium' }
    },
    {
      id: 'image-example',
      type: 'image',
      content: '/covers/cover-001.png',
      metadata: { alt: 'a photo', caption: 'a photo.', align: 'center' }
    },
    {
      id: 'image-code',
      type: 'code',
      content: `{ id: 'img-1', type: 'image', content: '/covers/cover-001.png', metadata: { alt: '...', caption: '...', align: 'left' | 'center' | 'right', size: 'small' | 'medium' | 'large' } }`,
      metadata: { language: 'typescript', caption: 'image — full Next.js Image with caption and alignment. path is relative to /public.' }
    },

    // ── LIST ─────────────────────────────────────────────────────────────────
    { id: 'divider-list', type: 'divider' },
    {
      id: 'list-heading',
      type: 'heading',
      content: 'List',
      metadata: { size: 'medium' }
    },
    {
      id: 'list-example',
      type: 'list',
      content: 'Go outside|Build something|Talk to a human|Ship it',
      metadata: { style: 'minimal' }
    },
    {
      id: 'list-code',
      type: 'code',
      content: `{ id: 'list-1', type: 'list', content: 'Item one|Item two|Item three', metadata: { numbered: false, style: 'minimal' | 'accent' } }`,
      metadata: { language: 'typescript', caption: 'list — pipe-separated items. numbered: true renders <ol>.' }
    },

    // ── CODE ─────────────────────────────────────────────────────────────────
    { id: 'divider-code', type: 'divider' },
    {
      id: 'code-heading',
      type: 'heading',
      content: 'Code',
      metadata: { size: 'medium' }
    },
    {
      id: 'code-example',
      type: 'code',
      content: `npm run dev\nnpm run build\nnpm run backfill-dates`,
      metadata: { language: 'bash', caption: 'code blocks support syntax highlighting and an optional caption.' }
    },
    {
      id: 'code-code',
      type: 'code',
      content: `{ id: 'code-1', type: 'code', content: '// your code', metadata: { language: 'typescript' | 'bash' | 'javascript' | 'python', caption: '...' } }`,
      metadata: { language: 'typescript', caption: 'code — syntax-highlighted block. language defaults to plaintext.' }
    },

    // ── BADGE ────────────────────────────────────────────────────────────────
    { id: 'divider-badge', type: 'divider' },
    {
      id: 'badge-heading',
      type: 'heading',
      content: 'Badge',
      metadata: { size: 'medium' }
    },
    {
      id: 'badge-example',
      type: 'badge',
      metadata: { badgeText: 'EDITORIAL GUIDE.', badgeVariant: 'primary', badgeSize: 'lg', badgeLink: '/article/editorial-section-guide' }
    },
    {
      id: 'badge-code',
      type: 'code',
      content: `{ id: 'badge-1', type: 'badge', metadata: { badgeText: 'LABEL.', badgeVariant: 'primary' | 'secondary', badgeSize: 'sm' | 'md' | 'lg', badgeLink: '/path' } }`,
      metadata: { language: 'typescript', caption: 'badge — a themed pill link. badgeLink is optional.' }
    },

    // ── PERSONAL ─────────────────────────────────────────────────────────────
    { id: 'divider-personal', type: 'divider' },
    {
      id: 'personal-heading',
      type: 'heading',
      content: 'Personal',
      metadata: { size: 'medium' }
    },
    {
      id: 'personal-example',
      type: 'personal',
      content: 'building this guide in real time. every section is live.'
    },
    {
      id: 'personal-code',
      type: 'code',
      content: `{ id: 'personal-1', type: 'personal', content: 'small meta note or aside.' }`,
      metadata: { language: 'typescript', caption: 'personal — a small italicized aside, for notes that feel off-the-record.' }
    },

    // ── STRIKE BLOCK ─────────────────────────────────────────────────────────
    { id: 'divider-strike', type: 'divider' },
    {
      id: 'strike-heading',
      type: 'heading',
      content: 'Strike Block',
      metadata: { size: 'medium' }
    },
    {
      id: 'strike-example',
      type: 'strikeBlock',
      content: 'THEY SAID IT COULDN\'T BE DONE. THEY WERE WRONG.'
    },
    {
      id: 'strike-code',
      type: 'code',
      content: `{ id: 'strike-1', type: 'strikeBlock', content: 'STRUCK THROUGH TEXT.', metadata: { variant: 'standard', animate: true, thickness: 3 } }`,
      metadata: { language: 'typescript', caption: 'strikeBlock — animated strike-through headline. variant and thickness are optional.' }
    },

    // ── CHALLENGE ────────────────────────────────────────────────────────────
    { id: 'divider-challenge', type: 'divider' },
    {
      id: 'challenge-heading',
      type: 'heading',
      content: 'Challenge',
      metadata: { size: 'medium' }
    },
    {
      id: 'challenge-example',
      type: 'challenge',
      userPrompt: 'BUILD SOMETHING TODAY.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Pick one idea.', description: 'Write it down. One sentence.' },
      stepTwo: { emoji: '2️⃣', action: 'Tell one person.', description: 'Say it out loud to another human.' },
      stepThree: { emoji: '3️⃣', action: 'Start the clock.', description: 'Set a 25-minute timer and begin.' },
      successMetric: 'you started.'
    },
    {
      id: 'challenge-code',
      type: 'code',
      content: `{ id: 'c-1', type: 'challenge', userPrompt: 'DO THE THING.', pollEnabled: true,
  stepOne:   { emoji: '1️⃣', action: 'Step one.',   description: '...' },
  stepTwo:   { emoji: '2️⃣', action: 'Step two.',   description: '...' },
  stepThree: { emoji: '3️⃣', action: 'Step three.', description: '...' },
  successMetric: 'you did it.' }`,
      metadata: { language: 'typescript', caption: 'challenge — 3-step interactive card. pollEnabled lets readers vote on completion. A step with answer: \'about\' | \'build\' | \'connect\' takes the reader\'s written answer and shows the owner\'s; answer: true only asks the reader, with its description as the question. icon names a hand-drawn icon in place of the numbered ring.' }
    },

    // ── SCROLL ROW ───────────────────────────────────────────────────────────
    { id: 'divider-scrollrow', type: 'divider' },
    {
      id: 'scrollrow-heading',
      type: 'heading',
      content: 'Scroll Row',
      metadata: { size: 'medium' }
    },
    {
      id: 'scrollrow-note',
      type: 'paragraph',
      content: 'Horizontal scroll container. Six subtypes: covers, stories, music, gif, hearth, portrait.',
      metadata: { size: 'small' }
    },
    {
      id: 'scrollrow-example',
      type: 'scrollRow',
      metadata: {
        scrollRowType: 'portrait',
        title: '🤳🏾',
        portraitSources: [
          '/covers/cover-001.png',
          '/covers/cover-001.png',
          '/covers/cover-001.png',
          '/covers/cover-001.png',
        ]
      }
    },
    {
      id: 'scrollrow-code',
      type: 'code',
      content: `// covers — cover photo cards by ID
{ id: 'row-covers', type: 'scrollRow', metadata: { scrollRowType: 'covers', coverIds: ['cover-001', 'cover-002'], maxItems: 5, moreLink: '/covers' } }

// stories — same as covers but filters to covers with stories
{ id: 'row-stories', type: 'scrollRow', metadata: { scrollRowType: 'stories', coverIds: ['cover-001'], moreLink: '/article/setup-start-here' } }

// music — MusicBanner with specific tracks
{ id: 'row-music', type: 'scrollRow', metadata: { scrollRowType: 'music', trackIds: ['badbunny-dtmf'] } }

// gif — animated GIFs from public paths
{ id: 'row-gif', type: 'scrollRow', metadata: { scrollRowType: 'gif', gifSources: ['/my.gif'] } }

// portrait — portrait photos from /covers/
{ id: 'row-portrait', type: 'scrollRow', metadata: { scrollRowType: 'portrait', portraitSources: ['/covers/cover-001.png', '/covers/cover-001.png'] } }`,
      metadata: { language: 'typescript', caption: 'scrollRow — horizontal scroll. subtype determines what renders. portraitSources requires full /covers/ paths.' }
    },

    // ── TABLE ────────────────────────────────────────────────────────────────
    { id: 'divider-table', type: 'divider' },
    {
      id: 'table-heading',
      type: 'heading',
      content: 'Table',
      metadata: { size: 'medium' }
    },
    {
      id: 'table-example',
      type: 'table',
      metadata: {
        headers: ['Section type', 'Best for', 'Key prop'],
        rows: [
          ['hero', 'opening headline', 'size, emphasis'],
          ['paragraph', 'body text', 'dropCap, style'],
          ['quote', 'pull quotes', 'author, bookId'],
          ['scrollRow', 'visual galleries', 'scrollRowType'],
          ['ranking', 'tap to rank: a question from /admin/questions (questionId), or words from the site\'s cloud (userPrompt, rankWords), which needs no setup'],
          ['challenge', 'interactive steps', 'pollEnabled'],
        ]
      }
    },
    {
      id: 'table-code',
      type: 'code',
      content: `{ id: 'table-1', type: 'table', metadata: { headers: ['Col A', 'Col B'], rows: [['val', 'val'], ['val2', 'val2']] } }`,
      metadata: { language: 'typescript', caption: 'table — headers + rows as string arrays.' }
    },

    // ── COLUMNS ──────────────────────────────────────────────────────────────
    { id: 'divider-columns', type: 'divider' },
    {
      id: 'columns-heading',
      type: 'heading',
      content: 'Columns',
      metadata: { size: 'medium' }
    },
    {
      id: 'columns-example',
      type: 'columns',
      metadata: { layout: '1:1' },
      leftSections: [
        { id: 'col-l1', type: 'paragraph', content: '**Left column.** Any section type works here — paragraph, image, list, code, badge.', metadata: { size: 'medium' } }
      ],
      rightSections: [
        { id: 'col-r1', type: 'image', content: '/covers/cover-001.png', metadata: { alt: 'a photo', align: 'center' } }
      ]
    },
    {
      id: 'columns-code',
      type: 'code',
      content: `{ id: 'cols-1', type: 'columns', metadata: { layout: '1:1' | '2:1' | '1:2', sticky: 'left' | 'right' },
  leftSections:  [{ id: 'l1', type: 'paragraph', content: '...' }],
  rightSections: [{ id: 'r1', type: 'image',     content: '/img.png', metadata: { alt: '...' } }] }`,
      metadata: { language: 'typescript', caption: 'columns — two-column layout. each side accepts any section array. sticky pins one side on scroll.' }
    },

    // ── DIVIDER / SECTION BREAK ──────────────────────────────────────────────
    { id: 'divider-meta', type: 'divider' },
    {
      id: 'dividers-heading',
      type: 'heading',
      content: 'Divider & Section Break',
      metadata: { size: 'medium' }
    },
    {
      id: 'dividers-note',
      type: 'paragraph',
      content: '`divider` renders a thin horizontal rule. `sectionBreak` renders a larger visual gap with a decorative element — use it between major article chapters.',
      metadata: { size: 'small' }
    },
    { id: 'sectionbreak-example', type: 'sectionBreak' },
    {
      id: 'dividers-code',
      type: 'code',
      content: `{ id: 'divider-1', type: 'divider' }
{ id: 'break-1', type: 'sectionBreak' }`,
      metadata: { language: 'typescript', caption: 'divider — thin rule. sectionBreak — major chapter gap with decorative mark.' }
    },

    // ── COMPONENT ────────────────────────────────────────────────────────────
    { id: 'divider-component', type: 'divider' },
    {
      id: 'component-heading',
      type: 'heading',
      content: 'Component',
      metadata: { size: 'medium' }
    },
    {
      id: 'component-note',
      type: 'paragraph',
      content: 'Embeds a named React component directly into the article. Available names: StoryPreview, BusinessWorksheet, StoryTable, AboutComponent.',
      metadata: { size: 'small' }
    },
    {
      id: 'component-code',
      type: 'code',
      content: `{ id: 'c-1', type: 'component', metadata: {
  componentName: 'StoryPreview',
  componentProps: { coverId: 'cover-001', maxSections: '3', showMetadata: 'true' }
} }`,
      metadata: { language: 'typescript', caption: 'component — all componentProps values are strings (parsed at render time).' }
    },

    // ── CLOSING ──────────────────────────────────────────────────────────────
    { id: 'divider-closing', type: 'divider' },
    {
      id: 'closing-hero',
      type: 'hero',
      content: 'NOW BUILD SOMETHING.',
      metadata: { size: 'medium', emphasis: true }
    },
    {
      id: 'closing-badge',
      type: 'badge',
      metadata: { badgeText: 'READ THE STORY.', badgeVariant: 'primary', badgeSize: 'lg', badgeLink: '/article/setup-start-here' }
    },
  ]
};
