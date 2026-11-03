/**
 * Where a portfolio component can be tried on the site (#1433): the pages that
 * render it, and the published articles and stories that embed it. Used by
 * scripts/create-component-article.mjs to write a home article's "try it where
 * it lives." rows.
 *
 * Pages are found through imports: the component's own file (for the 22
 * registry entries that go through an Embeddable* wrapper, the component the
 * wrapper renders), anything that imports it (one step, e.g. a hook that opens
 * it in a modal), and the page.tsx files that import either. Pages visitors
 * can't open are left out: dynamic routes ([slug]), /admin, /party, /api,
 * /blobupload and parallel-route slots (@modal). A component the root layout
 * reaches within three imports (site chrome, like the header's invite modal)
 * gets one "every page" row, linking home.
 */
import fs from 'fs';
import path from 'path';

const EXTENSIONS = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
const PRIVATE = /^\/(admin|party|api|blobupload)(\/|$)/;
const DEFAULT_AVATAR = '/svgs/unparty/founders-rocket-avatar.webp';

export function createUsageFinder(root) {
  const src = path.join(root, 'src');
  const editorialDir = path.join(src, 'app/components/editorial');
  const sectionFile = path.join(editorialDir, 'EditorialSection.tsx');
  const embeddableFile = path.join(editorialDir, 'EmbeddableComponents.tsx');
  const coverExt = JSON.parse(fs.readFileSync(path.join(src, 'app/covers/cover-extensions.json'), 'utf8'));

  const resolveImport = (from, spec) => {
    let base;
    if (spec.startsWith('@/')) base = path.join(src, spec.slice(2));
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
    else return null;
    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
    for (const ext of EXTENSIONS) if (fs.existsSync(base + ext)) return base + ext;
    return null;
  };

  // Every source file and what it imports
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
    }
  };
  walk(src);
  const importsOf = new Map();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const targets = [...text.matchAll(/(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)].map((m) => resolveImport(file, m[1])).filter(Boolean);
    importsOf.set(file, targets);
  }
  const importers = (target) => files.filter((f) => importsOf.get(f).includes(target) && f !== sectionFile && f !== embeddableFile);

  // The registry entry for a component: where it loads from, and which export
  const registry = fs.readFileSync(sectionFile, 'utf8').replace(/\s+/g, ' ');
  const embeddable = fs.readFileSync(embeddableFile, 'utf8');
  const embeddableImports = new Map();
  for (const m of embeddable.matchAll(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"];?$/gm)) {
    const target = resolveImport(embeddableFile, m[2]);
    if (!target) continue;
    const names = m[1].replace(/[{}]/g, ',').split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter((s) => /^[A-Z]/.test(s));
    for (const n of names) embeddableImports.set(n, target);
  }

  function sourcesOf(name) {
    const m = registry.match(new RegExp(`\\b${name}: React\\.lazy\\(\\(\\) => import\\('([^']+)'\\)\\.then\\(m => \\(\\{ default: m\\.([A-Za-z0-9]+)`));
    if (!m) return [];
    const target = resolveImport(sectionFile, m[1]);
    if (!target) return [];
    if (target !== embeddableFile) return [target];
    // An Embeddable* wrapper: the components it renders
    const start = embeddable.indexOf(`export const ${m[2]}`);
    if (start < 0) return [];
    const rest = embeddable.slice(start + 1);
    const end = rest.search(/\nexport const |\n\/\*\*/);
    const body = rest.slice(0, end < 0 ? undefined : end);
    const tags = new Set([...body.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((t) => t[1]));
    // (anything in src/app but the editorial plumbing itself)
    return [...tags].map((t) => embeddableImports.get(t)).filter((f) => f && f.startsWith(path.join(src, 'app')) && !f.startsWith(editorialDir));
  }

  const coverPath = (coverId) => (coverId && coverExt[coverId] ? `/covers/${coverId}.${coverExt[coverId]}` : null);

  function routeOf(pageFile) {
    const rel = path.relative(path.join(src, 'app'), path.dirname(pageFile)).split(path.sep).filter((s) => s && !/^\(.*\)$/.test(s));
    if (rel.some((s) => s.startsWith('[') || s.startsWith('@'))) return null;
    const route = `/${rel.join('/')}`;
    return PRIVATE.test(route) ? null : route;
  }

  function pageCover(pageFile) {
    for (const file of [path.join(path.dirname(pageFile), 'layout.tsx'), pageFile]) {
      if (!fs.existsSync(file)) continue;
      // coverId: 'cover-010' in metadata, or .set('coverId', 'cover-003') for an OG image
      const m = fs.readFileSync(file, 'utf8').match(/coverId['"]?\s*[:,]\s*['"](cover-[a-z0-9-]+)['"]/);
      if (m && coverPath(m[1])) return coverPath(m[1]);
    }
    return null;
  }

  function pageTitle(pageFile) {
    for (const file of [path.join(path.dirname(pageFile), 'layout.tsx'), pageFile]) {
      if (!fs.existsSync(file)) continue;
      const m = fs.readFileSync(file, 'utf8').match(/title:\s*['"`]([^'"`]+)['"`]/);
      // "GOAL. | ${SITE_TITLE}" → "GOAL."
      if (m) return m[1].replace(/\s*\|.*$/, '').replace(/\$\{[^}]*\}/g, '').trim() || null;
    }
    return null;
  }

  /** Places to try `name`: { href, title, avatar, kind } */
  function usageOf(name, { excludeSlug } = {}) {
    const found = new Map();
    // Pages, through imports
    const sources = sourcesOf(name);
    const reach = new Set(sources);
    for (const s of sources) for (const f of importers(s)) reach.add(f);
    for (const f of reach) {
      for (const page of [f, ...importers(f)].filter((p) => path.basename(p) === 'page.tsx')) {
        const href = routeOf(page);
        if (href && !found.has(href)) found.set(href, { href, title: pageTitle(page) ?? href, avatar: pageCover(page) ?? DEFAULT_AVATAR, kind: 'page' });
      }
    }
    // Site chrome: reached from the root layout within three imports (the
    // header's invite modal, the Fab), so it's on every page
    const rootLayout = path.join(src, 'app/layout.tsx');
    let level = new Set(sources);
    const seen = new Set(sources);
    for (let depth = 0; depth < 3 && level.size > 0 && !seen.has(rootLayout); depth++) {
      const next = new Set();
      for (const f of level) for (const i of files.filter((g) => importsOf.get(g).includes(f) && g !== sectionFile && g !== embeddableFile)) if (!seen.has(i)) { seen.add(i); next.add(i); }
      level = next;
    }
    if (seen.has(rootLayout) && !found.has('/')) found.set('/', { href: '/', title: 'every page (the site layout)', avatar: DEFAULT_AVATAR, kind: 'everywhere' });
    // Published TS articles that embed it
    const articlesDir = path.join(src, 'app/constants/editorial-articles/articles');
    const registryTs = fs.readFileSync(path.join(src, 'app/constants/editorial-articles/registry.ts'), 'utf8');
    for (const file of fs.readdirSync(articlesDir).filter((f) => f.endsWith('.ts'))) {
      const text = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      if (!new RegExp(`componentName:\\s*'${name}'`).test(text) || !/^\s*published:\s*true,/m.test(text)) continue;
      const slug = text.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
      const constant = text.match(/export const ([A-Z0-9_]+)/)?.[1];
      if (!slug || slug === excludeSlug || !constant || !new RegExp(`\\b${constant}\\b`).test(registryTs)) continue;
      const cover = text.match(/^\s*coverImage:\s*'([^']+)'/m)?.[1] ?? coverPath(text.match(/^\s*cover:\s*'(cover-[a-z0-9-]+)'/m)?.[1]);
      const href = `/article/${slug}`;
      if (!found.has(href)) found.set(href, { href, title: text.match(/^\s*title:\s*'([^']+)'/m)?.[1] ?? slug, avatar: cover ?? DEFAULT_AVATAR, kind: 'article' });
    }
    // Published stories that embed it
    const storiesDir = path.join(root, 'public/covers/stories');
    if (fs.existsSync(storiesDir)) {
      for (const file of fs.readdirSync(storiesDir).filter((f) => /^story-\d+\.md$/.test(f)).sort()) {
        const text = fs.readFileSync(path.join(storiesDir, file), 'utf8');
        if (!new RegExp(`:::component\\[[^\\]]*name=${name}\\b`).test(text) || !/^published:\s*true/m.test(text)) continue;
        const slug = text.match(/^slug:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
        if (!slug) continue;
        const href = `/story/${slug}`;
        const title = text.match(/^title:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? slug;
        if (!found.has(href)) found.set(href, { href, title, avatar: coverPath(file.replace('story-', 'cover-').replace('.md', '')) ?? DEFAULT_AVATAR, kind: 'story' });
      }
    }
    const order = { everywhere: 0, page: 1, article: 2, story: 3 };
    return [...found.values()].sort((a, b) => order[a.kind] - order[b.kind]);
  }

  /**
   * The DependConfig.json services a component runs on, each with the file
   * that gave it away: what the component imports (three steps down), and the
   * API routes it calls (`fetch('/api/…')`, `useFetch('/api/…')`) with what
   * those routes import (two steps down). Data, content and site-wide
   * contexts don't count (notCode).
   */
  function needsOf(name) {
    const found = new Map();
    const scan = (file) => {
      const text = fs.readFileSync(file, 'utf8');
      for (const [id, pattern] of SERVICE_MARKERS) if (!found.has(id) && pattern.test(text)) found.set(id, path.relative(root, file));
      return text;
    };
    const walkDown = (start, depth) => {
      const seen = new Set();
      let level = start;
      for (let d = 0; d <= depth && level.length; d++) {
        const next = [];
        for (const f of level) {
          if (seen.has(f) || f === sectionFile || f === embeddableFile || notCode(f)) continue;
          seen.add(f);
          next.push(...(importsOf.get(f) ?? []));
        }
        level = next;
      }
      return seen;
    };
    const apiCalls = new Set();
    for (const f of walkDown(sourcesOf(name), 3)) {
      const text = scan(f);
      for (const m of text.matchAll(/(?:fetch|useFetch)\(\s*[`'"](\/api\/[^`'"?]+)/g)) apiCalls.add(m[1]);
    }
    for (const call of apiCalls) {
      const route = apiRoute(call);
      if (route) for (const f of walkDown([route], 2)) scan(f);
    }
    return [...found.entries()].map(([id, evidence]) => ({ id, evidence }));
  }

  // Files that name a service without running it, left out of the needs walk:
  // data and content (setup steps, DependConfig, articles mention env vars as
  // text) and the site-wide contexts the root layout mounts for every page
  // (ThemeContext reads Clerk, but a component using the theme doesn't need it)
  const NOT_CODE = ['src/data/', 'prisma/', 'src/app/constants/', 'src/app/contexts/', 'src/contexts/'].map((d) => path.join(root, d));
  function notCode(file) {
    return !/\.(tsx|ts)$/.test(file) || NOT_CODE.some((d) => file.startsWith(d));
  }

  // /api/questions/${id}/response → src/app/api/questions/[questionId]/response/route.ts
  function apiRoute(call) {
    let dir = path.join(src, 'app/api');
    for (const segment of call.replace(/^\/api\//, '').split('/').filter(Boolean)) {
      if (!fs.existsSync(dir)) return null;
      const exact = path.join(dir, segment);
      if (!segment.includes('${') && fs.existsSync(exact)) {
        dir = exact;
        continue;
      }
      const param = fs.readdirSync(dir).find((d) => d.startsWith('[') && fs.statSync(path.join(dir, d)).isDirectory());
      if (!param) return null;
      dir = path.join(dir, param);
    }
    const route = path.join(dir, 'route.ts');
    return fs.existsSync(route) ? route : null;
  }

  return { usageOf, needsOf };
}

// What gives each DependConfig.json service away in a file
const SERVICE_MARKERS = [
  ['neon', /from ['"]@\/lib\/prisma['"]|@prisma\/client/],
  ['clerk', /auth-stub\.(server|client)|@clerk\/nextjs/],
  ['blob', /@vercel\/blob/],
  ['loops', /LOOPS_[A-Z_]+/],
  ['slack', /SLACK_WEBHOOK_URL|slack-verify/],
  ['polar', /@polar-sh\//],
  ['apple', /APPLE_MUSIC_|apple-music-token|MusicKit/],
  ['search', /SEARCH_API_URL/],
  ['github', /from ['"]@\/lib\/github['"]|GITHUB_APP_/],
  ['drains', /vercel-analytics-queries|vercel-trace-queries|VercelPageview|VercelTrace/],
  ['claude', /@anthropic-ai\/|ANTHROPIC_API_KEY/],
];

export const MAX_WHERE_ROWS = 6;

const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const rowId = (href) => `where-${href.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'home'}`;

/** The "try it where it lives." sections, as TypeScript (empty when nowhere) */
export function whereSections(places) {
  if (places.length === 0) return '';
  const shown = places.slice(0, MAX_WHERE_ROWS);
  const more = places.length - shown.length;
  const rows = shown.map(
    (p) => `    // ${p.href} · ${p.title}
    {
      id: ${quote(rowId(p.href))},
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: ${quote(p.avatar)}, storyLink: ${quote(p.href)} },
    }`
  );
  return `    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },${more > 0 ? `\n    // ${more} more place${more === 1 ? '' : 's'} embed it; these are the first ${MAX_WHERE_ROWS}` : ''}
${rows.join(',\n')}`;
}
