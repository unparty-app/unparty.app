import type { ReleaseTake } from '@/lib/project-belt';
import type { CoverMotionName, CoverStyleName } from '../../components/cover-motion/names';
import type { AnswerSlot } from '@/lib/answer-slots';

// Editorial Article System - Structured Content Format
export interface ChallengeStep {
  emoji?: string;
  action?: string;
  description?: string;
  cover?: string;  // Optional cover shown on top of the step's card — bare coverId or absolute path
  // A SETUP. step's key (prisma/setup-steps.ts, 'github'): the card shows that
  // step (its title and words unless set here), whether the reader has done
  // it, and where it opens (#589)
  step?: string;
  // This step takes a written answer, which feeds the worksheet's word cloud
  // (#265). A slot ('about') is also one of the owner's public answers, and the
  // card shows theirs; `true` asks the reader only
  answer?: AnswerSlot | true;
  icon?: string;  // A hand-drawn icon by its export name ('Home'), in place of the numbered ring and any emoji
}

export interface EditorialSection {
  id: string;
  type: 'hero' | 'paragraph' | 'heading' | 'quote' | 'image' | 'list' | 'code' | 'divider' | 'sectionBreak' | 'challenge' | 'scrollRow' | 'table' | 'profileImage' | 'component' | 'badge' | 'personal' | 'music' | 'video' | 'gif' | 'ranking' | 'text' | 'foundersQuestion' | 'strikeBlock' | 'columns' | 'releases';
  content?: string;
  questionId?: string;  // For type: 'ranking', 'text', and 'foundersQuestion' - references admin Question system. A 'ranking' without one ranks words from the site's cloud (userPrompt asks it, rankWords says how many), which needs no setup in a copy
  rankWords?: number;  // For type: 'ranking' with no questionId — how many words to rank, 5 by default
  categoryId?: string;  // For type: 'ranking', 'text', and 'foundersQuestion' - optional category override (defaults to 'core')
  userParty?: string;
  userPrompt?: string;
  authorQuote?: string;
  authorSource?: string;
  successMetric?: string;
  referenceUrl?: string;
  leftSections?: EditorialSection[];   // For type: 'columns' — left column content
  rightSections?: EditorialSection[];  // For type: 'columns' — right column content
  columnSections?: EditorialSection[][]; // For type: 'columns' — any number of columns, left to right; replaces leftSections/rightSections when set
  pollEnabled?: boolean;  // Enable interactive poll for challenge sections
  stepOne?: ChallengeStep;
  stepTwo?: ChallengeStep;
  stepThree?: ChallengeStep;
  coverId?: string;  // For type: 'challenge' — cover circle beside coverCaption, above the steps (like `personal`), defaults to 'cover-001'
  setup?: 'OWN' | 'RUN' | 'SHIP' | 'FILL' | 'YOURS';  // For type: 'challenge' — walk a SETUP. chapter: its steps, each ticked once done (#589). A SETUP. article ends with its own chapter's (withOnboarding)
  coverCaption?: string;  // For type: 'challenge' — the line beside the cover circle, above the steps, defaults to 'this is a work in progress'
  label?: 'ABOUT.' | 'BUILD.' | 'CONNECT.';  // For type: 'challenge' — no longer shown (the cover + caption row replaced it); kept so existing articles still type-check
  metadata?: {
    // For type: 'releases' — a component's latest release and its files
    // (src/lib/project-belt.ts withReleaseRow adds it to its home article)
    release?: ReleaseTake;
    size?: 'small' | 'medium' | 'large';
    line?: boolean;  // For type: 'heading' — a heading that is a sentence (a chapter's one line), set a size down with tighter spacing
    emphasis?: boolean;
    dropCap?: boolean;
    preserveWhitespace?: boolean;  // For type: 'paragraph' — a poem (a ```poem fence in stories and MD articles): its icon walks the page and unfolds it in place, lines and indentation as written (PoemWalker); title and icon come from the fence (utils/poem.ts)
    ink?: string;  // For a poem — its handwriting, a transparent image of the ink alone (public/), shown in the theme's ink color instead of the typed verse, which stays for screen readers and search
    author?: string; // For a poem — whose it is; unset, the site's founder (FoundersConfig), so a copy's poems are tagged with its owner
    caption?: string;
    alt?: string;
    language?: string;
    align?: 'left' | 'center' | 'right';
    style?: 'minimal' | 'accent' | 'highlight';
    numbered?: boolean;  // Use <ol> instead of <ul> for numbered lists
    scrollRowType?: 'covers' | 'music' | 'stories' | 'gif' | 'hearth'| 'candid'| 'portrait' | 'photos' | 'articles';
    maxItems?: number;
    // 'covers' and 'stories' rows are a 2×2 grid of circles, a page per swipe;
    // 'row' keeps the single row of 16:9 cards
    scrollRowLayout?: 'grid' | 'row';
    moreLink?: string;
    title?: string;
    coverIds?: string[];
    trackIds?: string[];
    photographer?: string;
    gifSources?: string[];
    hearthSources?: string[];
    portraitSources?: string[];
    candidSources?: string[];
    photoSources?: string[];
    // For scrollRowType 'articles': cards for pieces that aren't keyed by a
    // coverId (articles, stories by slug): the stories row's 16:9 cover with
    // the title and a short line under it. color fills a card with no cover
    // ('theme' for the reader's theme color)
    articleCards?: Array<{ href: string; cover?: string; color?: string; title: string; subtitle?: string }>;
    // For type: 'hero' — a hand-drawn icon (an export name from components/icons,
    // e.g. 'Rocket') that heads the chapter and draws itself in when its hero
    // shows. The content stays the hero's accessible name and outline label;
    // iconOnly hides its words on screen. For a poem, the icon that walks
    // the story carrying it (```poem Heart), the Poem icon when unset
    icon?: string;
    iconOnly?: boolean;
    // Table metadata
    headers?: string[];
    rows?: string[][];
    // ProfileImage metadata
    src?: string;
    link?: string;
    borderColor?: string;
    // Component metadata
    componentName?: string;
    componentProps?: Record<string, unknown>;
    // Badge metadata
    badgeText?: string;
    badgeVariant?: 'primary' | 'secondary' | 'header';
    badgeSize?: 'sm' | 'md' | 'lg';
    badgeLink?: string;
    // Music metadata
    musicTrackId?: string;    // Track ID from musicTracks.json registry (e.g., 'badbunny-dtmf')
    appleMusicUrl?: string;   // Direct Apple Music URL as fallback
    // Video metadata
    controls?: boolean;        // Show native video controls (default: true)
    autoplay?: boolean;        // Auto-play video on load (default: false)
    loop?: boolean;            // Loop video playback (default: false)
    muted?: boolean;           // Mute video audio (default: false, required true if autoplay)
    poster?: string;           // Thumbnail image path before video plays
    aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';  // Video aspect ratio (default: '16:9'). Ignored when shape: 'circle' (always square).
    shape?: 'rounded' | 'circle';  // Video frame shape (default: 'rounded'). 'circle' renders a small ambient loop (autoplay/muted/loop, no native controls — ditches controls/autoplay/loop above) with a depth shadow, matching CoverVideo's chrome-less pattern. `size` maps to a much smaller fixed diameter in this mode instead of a max-width.
    priority?: boolean;        // Eager-load media (set when the gif/image is above the fold / the page's LCP)
    preload?: 'none' | 'metadata' | 'auto';          // Video preload strategy
    playbackSpeed?: boolean;   // Enable playback speed controls (default: false)
    // Quote metadata - Book integration
    bookId?: string;           // Reference to Book ID in database - fetches quote, author, title, page
    showBookDetails?: boolean; // Show book title, page number, publisher in attribution (default: true)
    // Columns layout metadata
    layout?: string;  // Column width ratio, one number per column: '1:1' (default), '2:1', '1:2', '1:1:1'…
    sticky?: 'left' | 'right';        // Which column (first or last) is sticky while the others scroll
    mobile?: 'stack' | 'peek';        // Phones: stack the columns (default), or swipe them sideways with the next one peeking in
    verticalAlign?: 'start' | 'center' | 'end';  // Cross-axis alignment of the two columns (default: 'start'). 'center' suits a short column (e.g. one line of text) next to a taller one (e.g. a circle video) — 'start' otherwise pins both to the top regardless of content length.
    // Personal metadata
    step?: number;  // A numbered ring in the avatar's place, drawn like SetupCurriculum's (PersonalMark). metadata.icon puts a hand-drawn icon there instead
    avatar?: boolean | string;  // Show a small circular avatar next to the content line. true = default founders_rocket avatar; a string overrides with a specific image path; omit for text-only (default)
    storyLink?: string;  // Link the personal note to a story (e.g. '/story/cover-001'). When set, the content pops in the theme color and magnifies slightly on hover
    // Strike metadata - Block-level strikethrough text
    font?: 'vt323' | 'mono' | 'default';  // Font family for strike block
    variant?: 'standard' | 'bold' | 'double' | 'animated' | 'glitch';  // Strike visual style
    color?: string;            // Strike line color (hex or 'theme')
    animate?: boolean;         // Enable animation effect
    thickness?: number;        // Strike line thickness in pixels
  };
}

export interface EditorialArticle {
  slug: string;
  // Which top-level route this article is rendered under — drives the
  // reader-mode toggle link in Banner.tsx. Defaults to 'article' when unset,
  // so existing editorial-article definitions don't need to be touched.
  sourceRoute?: 'article' | 'story';
  title: string;
  // The title in search results and link previews, when the heading alone
  // would match another page's ("PERSONAL." twice). The page still shows `title`
  seoTitle?: string;
  subtitle?: string;
  description: string;
  category: string;
  categoryIcon?: string;    // A hand-drawn icon's name for the dock's category pill; an emoji category falls back to the owner's default (FoundersConfig iconDefaults.category)
  date: string;
  updated?: string;
  startedAt?: string;
  published: boolean;
  author: string;
  authorImage?: string;
  authorPage?: string;
  cover?: string | string[]; // Same as MD frontmatter `cover`: a coverId ('cover-010'), a filename in public/covers ('brand-unparty-start.svg') or an absolute path; an array gives the photo row. Resolved into coverImage/coverImages by withResolvedCovers(); an explicit coverImage wins
  coverImage?: string;      // Full-bleed hero image path/URL, rendered under the category tag and above the title. Must start with '/' (public/) or be an allowlisted remote URL — consumed by next/image, unlike authorImage's plain <img>.
  coverAlt?: string;        // Alt text for coverImage; falls back to article.title if omitted
  coverImages?: string[];   // Ordered cover photos (MD frontmatter `cover: [...]`). Two or more render PhotoGallery (240px snap-scroll tiles, tap opens its photo modal). coverImage is always the first entry, so single-cover consumers (JSON-LD, palette, video poster) keep working; fewer than two falls back to the single full-bleed hero.
  coverMotion?: CoverMotionName; // A live, in-browser animated hero (src/app/components/cover-motion): a transparent cover a video can't reproduce, or a camera move over a photo. Some covers have a default (motionForCover). Replaces the coverImage hero; a coverVideo still wins. Keep coverImage set: it is the still for previews, JSON-LD and reduced motion
  coverStyle?: CoverStyleName; // A still coverImage seen another way: 'compound-eye' (domed lens facets), 'tile' (square lenses) or 'kaleidoscope' (six-fold mirror), drawn by the bee's-eye shader (cover-motion/beeEye.ts). Works on a coverColor too. Ignored when the cover has a coverVideo, a coverMotion or a photo row
  coverColor?: string;      // A cover that is a color: a hex ('#F9C22E'), or 'theme' for the reader's theme color. Fills the same full-bleed frame as a photo (pins and shrinks under the header the same way), for articles with no photo, like a component's home. With a coverStyle, the color goes through that shader too. A coverImage, coverVideo or coverMotion wins over it
  coverVideo?: string;      // Absolute path to a demo/hero video (public/) — takes priority over coverImage for the full-bleed hero, same as UNPPP coverVideo. Set via MD frontmatter (mdArticleUtils resolves a bare filename to `/${unpppId}/${filename}`) or directly on a TS-defined article. Look this video up in the video registry via getVideoEntryByContentUrl(), never getVideoEntryForUnppp() — this article may not be UNPPP-sourced at all.
  builder?: string;
  builderImage?: string;
  readTime?: string;
  tags?: string[];
  challenge?: string;
  musicTrackId?: string;      // Track ID from musicTracks.json registry (e.g., "badbunny-dtmf")
  appleMusicUrl?: string;      // Direct Apple Music URL as fallback (track ID extracted from URL)
  // This article is the home of one embeddable component (componentRegistry in
  // EditorialSection): the component portfolio on /build lists it, and its
  // MAKE. step counts as done once this article is published. `needs` are
  // DependConfig.json ids (the services the component runs on). `release` is
  // the tag prefix of the releases that ship it (`colors` for colors-v1.0.4,
  // src/lib/releases.ts); missing, it's the component's name in kebab case
  presents?: { component: string; needs?: string[]; release?: string };
  // Which kind of build this belongs to (UnpppTypesConfig.json): the article
  // joins that type's hub at /unppp/<type>, next to the projects and stories
  // of the same kind. Components: their home article carries it
  unpppType?: UnpppType;
  sections: EditorialSection[];
}

// The eight kinds of build (src/data/UnpppTypesConfig.json, NavCategory)
export type UnpppType = 'app' | 'agent' | 'service' | 'assistant' | 'library' | 'framework' | 'tool' | 'bot';
