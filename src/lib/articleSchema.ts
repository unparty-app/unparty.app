import { z } from 'zod';
import { ANSWER_SLOTS } from './answer-slots';

// Runtime validation mirroring the EditorialArticle / EditorialSection shape in
// src/app/constants/editorial-articles/types.ts. This is the single source of truth
// used both by the write API route (reject before ever touching GitHub) and by
// validate-articles CI (reject a PR before it can auto-merge).

const answerSlotSchema = z.enum(ANSWER_SLOTS.map((slot) => slot.id) as [string, ...string[]]);

const challengeStepSchema = z.object({
  emoji: z.string().optional(),
  action: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  answer: z.union([answerSlotSchema, z.literal(true)]).optional(),
});

const editorialSectionMetadataSchema = z.object({
  size: z.enum(['small', 'medium', 'large']).optional(),
  emphasis: z.boolean().optional(),
  dropCap: z.boolean().optional(),
  preserveWhitespace: z.boolean().optional(),
  author: z.string().optional(),
  caption: z.string().optional(),
  alt: z.string().optional(),
  language: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  style: z.enum(['minimal', 'accent', 'highlight']).optional(),
  numbered: z.boolean().optional(),
  scrollRowType: z.enum(['covers', 'music', 'stories', 'gif', 'hearth', 'candid', 'portrait', 'photos']).optional(),
  maxItems: z.number().optional(),
  moreLink: z.string().optional(),
  title: z.string().optional(),
  coverIds: z.array(z.string()).optional(),
  trackIds: z.array(z.string()).optional(),
  photographer: z.string().optional(),
  gifSources: z.array(z.string()).optional(),
  hearthSources: z.array(z.string()).optional(),
  portraitSources: z.array(z.string()).optional(),
  candidSources: z.array(z.string()).optional(),
  photoSources: z.array(z.string()).optional(),
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string())).optional(),
  src: z.string().optional(),
  link: z.string().optional(),
  borderColor: z.string().optional(),
  componentName: z.string().optional(),
  componentProps: z.record(z.string(), z.unknown()).optional(),
  badgeText: z.string().optional(),
  badgeVariant: z.enum(['primary', 'secondary', 'header']).optional(),
  badgeSize: z.enum(['sm', 'md', 'lg']).optional(),
  badgeLink: z.string().optional(),
  musicTrackId: z.string().optional(),
  appleMusicUrl: z.string().optional(),
  controls: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  poster: z.string().optional(),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).optional(),
  priority: z.boolean().optional(),
  preload: z.enum(['none', 'metadata', 'auto']).optional(),
  playbackSpeed: z.boolean().optional(),
  bookId: z.string().optional(),
  showBookDetails: z.boolean().optional(),
  layout: z.string().regex(/^\d+(:\d+){1,3}$/).optional(),
  sticky: z.enum(['left', 'right']).optional(),
  verticalAlign: z.enum(['start', 'center', 'end']).optional(),
  mobile: z.enum(['stack', 'peek']).optional(),
  font: z.enum(['vt323', 'mono', 'default']).optional(),
  variant: z.enum(['standard', 'bold', 'double', 'animated', 'glitch']).optional(),
  color: z.string().optional(),
  animate: z.boolean().optional(),
  thickness: z.number().optional(),
  avatar: z.union([z.boolean(), z.string()]).optional(),
  storyLink: z.string().optional(),
}).partial();

const editorialSectionTypeSchema = z.enum([
  'hero', 'paragraph', 'heading', 'quote', 'image', 'list', 'code', 'divider',
  'sectionBreak', 'challenge', 'scrollRow', 'table', 'profileImage', 'component',
  'badge', 'personal', 'music', 'video', 'gif', 'ranking', 'text',
  'foundersQuestion', 'strikeBlock', 'columns',
]);

// EditorialSection is self-referential via columns' leftSections/rightSections.
export const editorialSectionSchema: z.ZodType<EditorialSectionInput> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: editorialSectionTypeSchema,
    content: z.string().optional(),
    questionId: z.string().optional(),
    rankWords: z.number().int().positive().optional(),
    categoryId: z.string().optional(),
    userParty: z.string().optional(),
    userPrompt: z.string().optional(),
    authorQuote: z.string().optional(),
    authorSource: z.string().optional(),
    successMetric: z.string().optional(),
    referenceUrl: z.string().optional(),
    leftSections: z.array(editorialSectionSchema).optional(),
    rightSections: z.array(editorialSectionSchema).optional(),
    columnSections: z.array(z.array(editorialSectionSchema)).optional(),
    pollEnabled: z.boolean().optional(),
    stepOne: challengeStepSchema.optional(),
    stepTwo: challengeStepSchema.optional(),
    stepThree: challengeStepSchema.optional(),
    coverId: z.string().optional(),
    coverCaption: z.string().optional(),
    label: z.enum(['ABOUT.', 'BUILD.', 'CONNECT.']).optional(),
    metadata: editorialSectionMetadataSchema.optional(),
  })
);

// z.lazy needs an explicit type since TS can't infer through the recursive reference.
interface EditorialSectionInput {
  id: string;
  type: z.infer<typeof editorialSectionTypeSchema>;
  content?: string;
  questionId?: string;
  rankWords?: number;
  categoryId?: string;
  userParty?: string;
  userPrompt?: string;
  authorQuote?: string;
  authorSource?: string;
  successMetric?: string;
  referenceUrl?: string;
  leftSections?: EditorialSectionInput[];
  rightSections?: EditorialSectionInput[];
  columnSections?: EditorialSectionInput[][];
  pollEnabled?: boolean;
  stepOne?: z.infer<typeof challengeStepSchema>;
  stepTwo?: z.infer<typeof challengeStepSchema>;
  stepThree?: z.infer<typeof challengeStepSchema>;
  coverId?: string;
  coverCaption?: string;
  label?: 'ABOUT.' | 'BUILD.' | 'CONNECT.';
  metadata?: z.infer<typeof editorialSectionMetadataSchema>;
}

export const editorialArticleSchema = z.object({
  slug: z.string().min(1),
  sourceRoute: z.enum(['article', 'story']).optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string(),
  category: z.string(),
  date: z.string(),
  updated: z.string().optional(),
  startedAt: z.string().optional(),
  published: z.boolean(),
  author: z.string(),
  authorImage: z.string().optional(),
  authorPage: z.string().optional(),
  coverImage: z.string().optional(),
  coverAlt: z.string().optional(),
  coverImages: z.array(z.string()).optional(),
  builder: z.string().optional(),
  builderImage: z.string().optional(),
  readTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  challenge: z.string().optional(),
  musicTrackId: z.string().optional(),
  appleMusicUrl: z.string().optional(),
  sections: z.array(editorialSectionSchema),
});

export type EditorialArticleValidated = z.infer<typeof editorialArticleSchema>;
