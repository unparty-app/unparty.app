#!/usr/bin/env node
/**
 * Writes a draft home article for a component in the portfolio (#1433), so all
 * that's left is the words.
 *
 *   npm run create:component-article -- GoalBudget        one component
 *   npm run create:component-article -- --all             every one without a home
 *   npm run create:component-article -- --all --dry-run   list what it would write
 *   npm run create:component-article -- --where           add "try it where it
 *     lives." to the home articles that don't have it yet
 *   npm run create:component-article -- --needs           fill needs: [] from
 *     what each component runs on (scripts/lib/component-usage.mjs needsOf)
 *
 * Each draft (src/app/constants/editorial-articles/articles/component-<name>.ts):
 * - `presents` names the component, so /build and its MAKE. step find it
 * - embeds the component with working props (copied from where it's already
 *   used, or {} for a new one) and shows that section as a snippet to copy
 * - leaves `TODO.` where your words go: subtitle, description, what it does,
 *   how to use it
 * - "try it where it lives.": one linked row per page, article or story the
 *   component is used in (scripts/lib/component-usage.mjs), each with that
 *   page's cover and a `TODO.` line for you to write
 * - opens on a cover in the reader's theme color (`coverColor: 'theme'`), with
 *   the cover styles taking turns (coverStyleFor)
 * - is `published: false`: it previews on npm run dev (with a DRAFT. line) and
 *   404s in production. Setting `published: true` publishes it and completes
 *   the component's MAKE. step
 * and is registered in registry.ts and index.ts. A component that already has
 * a home (an article with `presents`) is skipped.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createUsageFinder, whereSections } from './lib/component-usage.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES_DIR = path.join(root, 'src/app/constants/editorial-articles/articles');
const REGISTRY = path.join(root, 'src/app/constants/editorial-articles/registry.ts');
const INDEX = path.join(root, 'src/app/constants/editorial-articles/index.ts');
const PORTFOLIO = path.join(root, 'src/lib/component-portfolio.ts');
const REGISTRY_ANCHOR = '  // Add more converted articles here';
const REGISTRY_GROUP = '  // Component portfolio homes (src/lib/component-portfolio.ts, #1433)';

// Working props, from where each component is already embedded
const EXAMPLE_PROPS = {
  AboutComponent: { unpppId: 'theunpartyapp' },
  ArticlePreview: { slug: 'theunpartycharette-unlocal_status', sourceComponentName: 'ColorPalette' },
  BusinessWorksheet: { initialCategory: 'core' },
  Cta: { label: 'express yourself.', href: '/article/setup-start-here' },
  DatabaseCalculator: { live: false },
  Definitions: { unpppId: 'theunpartyapp', showNavigation: true },
  DependCardScroll: { title: 'WHAT WE DEPEND ON' },
  Expensd: { unpppId: 'theunpartyapp', showNavigation: true },
  FiveThingsChallenge: { prompt: 'CREATE YOUR OWN LIST OF 5 THINGS TO REMEMBER.' },
  FormulaDisplay: { steps: 'STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY', result: 'COGS (Cost of Goods)', title: 'COGS.' },
  HtmlEmbed: { src: 'https://theunpartyrunway.unparty.app/founder/black.html', height: '700px' },
  InstagramEmbed: { postUrl: 'https://www.instagram.com/reel/DOOaqIjggTN/', title: 'ig.' },
  SetupCurriculum: { variant: 'preview' },
  SplineEmbed: { scene: 'https://prod.spline.design/tLK98DRBRgvzrMYb/scene.splinecode' },
  StepCard: { unpppId: 'theunpartyapp' },
  // The resume charts draw the site owner's live data, named by `source` (/api/resume)
  InkTimeline: { source: 'shipped' },
  InkPath: { source: 'path' },
  NextStep: { source: 'path' },
  StackLedger: { source: 'stack' },
  ViewsChart: { source: 'views' },
  InkWords: {},
  StepScroll: { unpppId: 'theunpartyapp', title: 'YOUR STEPS' },
  StoryPreview: { coverId: 'cover-001' },
  Strike: { text: 'strike it out.' },
  TikTokEmbed: { videoUrl: 'https://www.tiktok.com/@cristienorman_somm/video/7626250481697950990', title: 'Cost of Goods Formula by @cristienorman_somm' },
  VerseCardScroll: { title: 'VERSES.', cards: [{ label: 'VERSE.', verse: 'write a line worth keeping.', attribution: 'you' }] },
  YouTubeEmbed: { videoId: 'https://youtu.be/0lzMS6qYekM' },
};

// Same as componentLabel() in src/lib/component-portfolio.ts (keep them in step)
const LABELS = {
  Cta: 'CTA',
  AIWrappedVisualization: 'AI Wrapped',
  HtmlEmbed: 'HTML Embed',
  YouTubeEmbed: 'YouTube Embed',
  TikTokEmbed: 'TikTok Embed',
  AboutComponent: 'About',
  Logo3d: 'Logo 3D',
  IconDrawPad: 'Draw Your Icons',
  EffortVisualization: 'Effort Ball',
};
const label = (name) => LABELS[name] ?? name.replace(/([a-z])([A-Z])/g, '$1 $2');
// Same as componentSlug(): "YouTube Embed" → youtube-embed
const slugOf = (name) => label(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const constName = (slug) => `${slug.replace(/-/g, '_').toUpperCase()}_ARTICLE`;
const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

// A value as a TypeScript literal, single-quoted like the other articles
function literal(value, indent = '') {
  if (Array.isArray(value)) return `[${value.map((v) => literal(v, indent)).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{ ${entries.map(([k, v]) => `${k}: ${literal(v, indent)}`).join(', ')} }`;
  }
  return typeof value === 'string' ? quote(value) : String(value);
}

function author() {
  try {
    const name = JSON.parse(fs.readFileSync(path.join(root, 'src/data/FoundersConfig.json'), 'utf8')).founder?.name ?? '';
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'founder';
  } catch {
    return 'founder';
  }
}

function article(name, today) {
  const slug = `component-${slugOf(name)}`;
  const words = label(name);
  const props = EXAMPLE_PROPS[name] ?? {};
  const embed = `{ type: 'component', metadata: { componentName: '${name}', componentProps: ${literal(props)} } }`;
  const where = whereSections(finder().usageOf(name, { excludeSlug: slug }));
  const needs = finder().needsOf(name);
  return {
    slug,
    file: path.join(ARTICLES_DIR, `${slug}.ts`),
    constant: constName(slug),
    source: `import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ${name}. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const ${constName(slug)}: EditorialArticle = {
  slug: '${slug}',
  title: ${quote(`${words.toUpperCase()}.`)},
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '${today}',
  published: false,
  coverColor: 'theme',${coverStyleFor(name) ? `\n  coverStyle: '${coverStyleFor(name)}',` : ''}
${needsComment(needs)}
  presents: { component: '${name}', needs: ${literal(needs.map((n) => n.id))} },
  author: '${author()}',
  tags: ['Component', 'Make', ${quote(words)}],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: ${quote(`${words.toLowerCase()}.`)}
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: '${name}', componentProps: ${literal(props)} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'TODO. When to use it, and what to change.'
    },
    {
      id: 'embed',
      type: 'code',
      content: ${quote(embed)},
      metadata: { language: 'ts', caption: 'Add this section to any article to embed ${words}.' }
    }${where ? `,\n${where}` : ''}
  ]
};
`,
  };
}

// Every home article opens on a cover in the reader's theme color, seen
// through the cover styles in turn by the component's place in the portfolio:
// compound-eye, tile, plain, compound-eye, tile, kaleidoscope (the quietest
// on one color, so the least often)
const COVER_STYLES = ['compound-eye', 'tile', null, 'compound-eye', 'tile', 'kaleidoscope'];
const coverStyleFor = (name) => COVER_STYLES[Math.max(0, names.indexOf(name)) % COVER_STYLES.length];

// The comment above `presents`: how each need was found, so it can be checked
function needsComment(needs) {
  if (needs.length === 0) return '  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any';
  return ['  // needs, found by npm run create:component-article -- --needs:', ...needs.map((n) => `  //   ${n.id}: ${n.evidence}`)].join('\n');
}

// Built on first use: it reads every source file once
let usage;
const finder = () => (usage ??= createUsageFinder(root));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const names = [...fs.readFileSync(PORTFOLIO, 'utf8').matchAll(/^ {2}'([A-Za-z0-9]+)',$/gm)].map((m) => m[1]);
const homes = new Set(
  fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.ts'))
    .flatMap((f) => [...fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8').matchAll(/presents:\s*\{\s*component:\s*'([A-Za-z0-9]+)'/g)].map((m) => m[1]))
);

// --needs: fill `needs: []` in the home articles from what each component
// actually runs on, with how it was found. A list you've written is left alone
if (args.includes('--needs')) {
  let filled = 0;
  for (const f of fs.readdirSync(ARTICLES_DIR).filter((f) => /^component-.+\.ts$/.test(f))) {
    const file = path.join(ARTICLES_DIR, f);
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/^( *\/\/ needs[^\n]*\n(?: *\/\/ [^\n]*\n)*)?( *)presents: \{ component: '([A-Za-z0-9]+)', needs: \[\] \},/m);
    if (!m) continue;
    const needs = finder().needsOf(m[3]);
    if (needs.length === 0) continue;
    filled += 1;
    console.log(`${dryRun ? 'would set' : '✓'} ${f}: ${needs.map((n) => n.id).join(', ')}`);
    if (!dryRun) {
      fs.writeFileSync(file, text.replace(m[0], `${needsComment(needs)}\n${m[2]}presents: { component: '${m[3]}', needs: ${literal(needs.map((n) => n.id))} },`));
    }
  }
  console.log(`${filled} home article${filled === 1 ? '' : 's'} ${dryRun ? 'would get' : 'got'} needs${dryRun ? ' (dry run, nothing written)' : ''}; the rest run on none of the services`);
  process.exit(0);
}

// --where: add "try it where it lives." to the home articles that don't have
// it yet (the ones this script wrote), leaving everything else as written
if (args.includes('--where')) {
  const homeFiles = fs.readdirSync(ARTICLES_DIR).filter((f) => /^component-.+\.ts$/.test(f));
  let added = 0;
  for (const f of homeFiles) {
    const file = path.join(ARTICLES_DIR, f);
    const text = fs.readFileSync(file, 'utf8');
    const name = text.match(/presents:\s*\{\s*component:\s*'([A-Za-z0-9]+)'/)?.[1];
    const slug = text.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
    if (!name || text.includes("id: 'where-heading'")) continue;
    const where = whereSections(finder().usageOf(name, { excludeSlug: slug }));
    const end = text.lastIndexOf('\n  ]\n};');
    if (!where) {
      console.log(`· ${f}: ${name} isn't used anywhere else yet`);
      continue;
    }
    if (end < 0) {
      console.log(`· ${f}: couldn't find the end of its sections, add the rows by hand`);
      continue;
    }
    added += 1;
    if (dryRun) {
      console.log(`would add ${where.split("type: 'personal'").length - 1} row(s) to ${f}`);
      continue;
    }
    fs.writeFileSync(file, `${text.slice(0, end).replace(/\s*$/, '')},\n${where}${text.slice(end)}`);
    console.log(`✓ ${f}`);
  }
  console.log(`${added} home article${added === 1 ? '' : 's'} ${dryRun ? 'would get' : 'got'} "try it where it lives."${dryRun ? ' (dry run, nothing written)' : ''}`);
  process.exit(0);
}

let wanted;
if (args.includes('--all')) {
  wanted = names.filter((n) => !homes.has(n));
} else {
  wanted = args.filter((a) => !a.startsWith('--'));
  const unknown = wanted.filter((n) => !names.includes(n));
  if (wanted.length === 0 || unknown.length > 0) {
    if (unknown.length) console.error(`Not in the portfolio: ${unknown.join(', ')} (add it to COMPONENT_NAMES in src/lib/component-portfolio.ts first)`);
    console.error('Usage: npm run create:component-article -- <ComponentName ...> | --all | --where | --needs [--dry-run]');
    process.exit(1);
  }
  for (const n of wanted.filter((n) => homes.has(n))) console.log(`· ${n} already has a home article, skipped`);
  wanted = wanted.filter((n) => !homes.has(n));
}

const today = new Date().toISOString().slice(0, 10);
const drafts = wanted.map((n) => article(n, today)).filter((d) => {
  if (fs.existsSync(d.file)) {
    console.log(`· ${path.relative(root, d.file)} exists, skipped`);
    return false;
  }
  return true;
});

if (dryRun) {
  for (const d of drafts) console.log(`would write ${path.relative(root, d.file)}`);
  console.log(`${drafts.length} draft${drafts.length === 1 ? '' : 's'} (dry run, nothing written)`);
  process.exit(0);
}
if (drafts.length === 0) {
  console.log('Nothing to write.');
  process.exit(0);
}

let registry = fs.readFileSync(REGISTRY, 'utf8');
let index = fs.readFileSync(INDEX, 'utf8');
if (!registry.includes(REGISTRY_ANCHOR)) {
  console.error(`registry.ts has no "${REGISTRY_ANCHOR.trim()}" line; register the articles by hand`);
  process.exit(1);
}
const lastImport = [...registry.matchAll(/^import .*;$/gm)].pop();
const imports = drafts.map((d) => `import { ${d.constant} } from './articles/${d.slug}';`).join('\n');
registry = registry.slice(0, lastImport.index + lastImport[0].length) + '\n' + imports + registry.slice(lastImport.index + lastImport[0].length);
const entries = drafts.map((d) => `  ${d.constant},`).join('\n');
registry = registry.replace(
  REGISTRY_ANCHOR,
  registry.includes(REGISTRY_GROUP) ? `${entries}\n${REGISTRY_ANCHOR}` : `${REGISTRY_GROUP}\n${entries}\n${REGISTRY_ANCHOR}`
);
index = index.replace(/\s*$/, '\n') + drafts.map((d) => `export * from './articles/${d.slug}';`).join('\n') + '\n';

for (const d of drafts) {
  fs.writeFileSync(d.file, d.source);
  console.log(`✓ ${path.relative(root, d.file)}`);
}
fs.writeFileSync(REGISTRY, registry);
fs.writeFileSync(INDEX, index);
console.log(`${drafts.length} draft${drafts.length === 1 ? '' : 's'} written and registered. Preview at http://localhost:3000/article/<slug> on npm run dev`);
