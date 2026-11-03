#!/usr/bin/env node
/**
 * Checks src/data/FoundersConfig.json, the one file a site owner edits to make
 * the site theirs (see /article/setup-identity). Catches what `tsc` does not: a
 * trailing comma passes the type checker but breaks the site, and a missing
 * field gives a type error nobody can read.
 *
 *   npm run check:identity
 *
 * Errors exit 1. Warnings (values still set to unparty's) never fail.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'src', 'data', 'FoundersConfig.json');
const publicDir = path.join(root, 'public');

const errors = [];
const warnings = [];

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

// Every slug an article or story can have: TS articles, JSON articles,
// markdown frontmatter (stories and the theunparty* pages' articles) and the
// stories manifest
function knownContentSlugs() {
  const slugs = new Set();
  const walk = (dir, visit) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, visit);
      else visit(full);
    }
  };
  walk(path.join(root, 'src', 'app', 'constants', 'editorial-articles', 'articles'), file => {
    for (const match of readText(file).matchAll(/^\s+slug: '([^']+)'/gm)) slugs.add(match[1]);
  });
  walk(path.join(root, 'content', 'articles'), file => {
    if (file.endsWith('.json')) slugs.add(path.basename(file, '.json'));
  });
  const fromFrontmatter = file => {
    if (!file.endsWith('.md')) return;
    const slug = readText(file).match(/^slug:\s*["']?([^"'\n]+)/m)?.[1];
    if (slug) slugs.add(slug.trim());
  };
  walk(path.join(root, 'public', 'covers', 'stories'), fromFrontmatter);
  // A story's address (/story/<slug>) comes from the stories manifest, not
  // its frontmatter
  try {
    const manifest = JSON.parse(readText(path.join(root, 'src', 'data', 'storiesManifest.json')));
    for (const slug of manifest.published ?? []) slugs.add(slug);
  } catch {
    // No manifest yet (it is generated): frontmatter slugs only
  }
  walk(path.join(root, 'src', 'app'), fromFrontmatter);
  return slugs;
}

// unparty's own values: a new owner should have replaced these
const UNPARTY_VALUES = {
  'site.name': 'unparty',
  'site.url': 'https://www.unparty.app',
  'site.legalName': 'unparty LLC',
  'site.email': 'info@unparty.app',
  'site.github': 'unparty-app',
  'founder.name': 'Justin Murry',
  'founder.image': 'unparty-app-founder-justin-murry.png',
};

function lineAndColumn(text, index) {
  const before = text.slice(0, index);
  const line = before.split('\n').length;
  return { line, column: index - before.lastIndexOf('\n') };
}

let raw;
try {
  raw = fs.readFileSync(configPath, 'utf8');
} catch {
  console.error(`❌ Cannot read ${path.relative(root, configPath)}`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(raw);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  // Node's message does not always carry a position, so find the most common
  // hand-editing slip, a comma right before ] or }, ourselves
  const position = message.match(/position (\d+)/);
  const trailingComma = raw.search(/,\s*[\]}]/);
  const index = position ? Number(position[1]) : trailingComma;
  const where = index >= 0 ? lineAndColumn(raw, index) : null;
  console.error(`❌ FoundersConfig.json is not valid JSON${where ? ` (line ${where.line}, column ${where.column})` : ''}`);
  console.error(`   ${message}`);
  console.error('   Common causes: a comma after the last item in a list or block, a missing comma between two lines, or a missing quote mark.');
  process.exit(1);
}

const get = (dotted) => dotted.split('.').reduce((value, key) => (value == null ? undefined : value[key]), config);

function requireText(dotted) {
  const value = get(dotted);
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${dotted} is missing or empty`);
    return null;
  }
  if (UNPARTY_VALUES[dotted] && value === UNPARTY_VALUES[dotted]) {
    warnings.push(`${dotted} is still unparty's ("${value}")`);
  }
  return value;
}

function publicFileExists(filePath) {
  return fs.existsSync(path.join(publicDir, filePath.replace(/^\/+/, '')));
}

// ── site ─────────────────────────────────────────────────────
for (const key of ['name', 'title', 'tagline', 'headline', 'description', 'legalName']) {
  requireText(`site.${key}`);
}

// waitlist: true or false (missing means off)
if (config.waitlist !== undefined && typeof config.waitlist !== 'boolean') {
  errors.push(`waitlist must be true or false, without quotes (got ${JSON.stringify(config.waitlist)})`);
}

// checkout: true or false (missing means on)
if (config.checkout !== undefined && typeof config.checkout !== 'boolean') {
  errors.push(`checkout must be true or false, without quotes (got ${JSON.stringify(config.checkout)})`);
}

// privateRepos: true or false (missing means off)
if (config.privateRepos !== undefined && typeof config.privateRepos !== 'boolean') {
  errors.push(`privateRepos must be true or false, without quotes (got ${JSON.stringify(config.privateRepos)})`);
}

// The contact address in the privacy policy and terms ({email})
const email = get('site.email');
if (email === undefined || email === '') {
  warnings.push('site.email is empty: your privacy policy and terms have no address to reach you');
} else if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  errors.push(`site.email must be an email address, like "hello@bakery.com" (got ${JSON.stringify(email)})`);
} else if (email === UNPARTY_VALUES['site.email']) {
  warnings.push(`site.email is still unparty's ("${email}"); your privacy policy and terms would send people to unparty`);
}

const url = requireText('site.url');
if (url && !/^https:\/\/[^/\s]+$/.test(url.replace(/\/+$/, ''))) {
  errors.push(`site.url must look like https://www.yourname.com (got "${url}")`);
}

const github = get('site.github');
if (typeof github !== 'string') {
  errors.push('site.github is missing (use "" if you have no GitHub user or organization yet)');
} else if (github === '') {
  warnings.push('site.github is empty, so the code links that point at your repositories have nowhere to go');
} else {
  if (!/^[A-Za-z0-9-]+$/.test(github)) errors.push(`site.github must be just the user or organization name, like "my-org" (got "${github}")`);
  if (github === UNPARTY_VALUES['site.github']) warnings.push(`site.github is still unparty's ("${github}")`);
}

const logo = get('site.logo');
if (!logo || typeof logo !== 'object') {
  errors.push('site.logo is missing');
} else {
  if (typeof logo.path !== 'string' || !logo.path.startsWith('/')) {
    errors.push('site.logo.path must start with / (a file in public/)');
  } else if (!publicFileExists(logo.path)) {
    errors.push(`site.logo.path points to a file that does not exist: public${logo.path}`);
  } else if (!/\.(png|jpe?g|webp)$/i.test(logo.path)) {
    errors.push('site.logo.path must be a PNG, JPG or WebP (Google does not accept an SVG logo)');
  }
  for (const side of ['width', 'height']) {
    if (!Number.isInteger(logo[side]) || logo[side] <= 0) errors.push(`site.logo.${side} must be the image's real size in pixels`);
  }
}

// ── founder ──────────────────────────────────────────────────
for (const key of ['name', 'role', 'title', 'initials', 'bio', 'summary']) {
  requireText(`founder.${key}`);
}

const image = get('founder.image');
if (typeof image !== 'string') {
  errors.push('founder.image is missing (use "" to show your initials instead)');
} else if (image !== '') {
  if (!publicFileExists(image)) errors.push(`founder.image points to a file that does not exist: public/${image.replace(/^\/+/, '')}`);
  if (image === UNPARTY_VALUES['founder.image']) warnings.push(`founder.image is still unparty's ("${image}")`);
}

const cover = get('founder.cover');
if (typeof cover !== 'string' || cover === '') {
  errors.push('founder.cover is missing (a cover name like "cover-052")');
} else {
  const coverFiles = fs.existsSync(path.join(publicDir, 'covers'))
    ? fs.readdirSync(path.join(publicDir, 'covers')).filter((file) => file.replace(/\.[^.]+$/, '') === cover)
    : [];
  if (coverFiles.length === 0) errors.push(`founder.cover "${cover}" has no matching file in public/covers/`);
}

const links = get('founder.links');
if (!Array.isArray(links)) {
  errors.push('founder.links must be a list, like [{ "label": "Instagram", "url": "https://…" }]');
} else {
  links.forEach((link, index) => {
    if (!link || typeof link.label !== 'string' || link.label.trim() === '') errors.push(`founder.links[${index}] needs a label`);
    if (!link || typeof link.url !== 'string' || !/^https:\/\//.test(link.url)) errors.push(`founder.links[${index}] needs a url starting with https://`);
    if (link && typeof link.url === 'string' && /jmurrym|jmmurry/.test(link.url)) warnings.push(`founder.links[${index}] is still unparty's founder (${link.url})`);
  });
}

const cta = get('founder.cta');
if (cta !== undefined) {
  if (!cta || typeof cta.label !== 'string' || cta.label.trim() === '') errors.push('founder.cta needs a label, like "work with me"');
  if (!cta || typeof cta.href !== 'string' || !/^(\/|https:\/\/|mailto:)/.test(cta.href)) errors.push('founder.cta needs an href starting with /, https:// or mailto:');
  if (cta && cta.pitch !== undefined && typeof cta.pitch !== 'string') errors.push('founder.cta.pitch must be a sentence (or left out)');
  if (cta && cta.href === '/article/setup-start-here') warnings.push(`founder.cta is still unparty's ("${cta.label}" → the setup curriculum); point it at how people work with you, or remove it to use your first link`);
}

// iconDefaults: { poem?, category? }, each an icon's export name ("Heart")
const iconDefaults = config.iconDefaults;
if (iconDefaults !== undefined) {
  if (!iconDefaults || typeof iconDefaults !== 'object' || Array.isArray(iconDefaults)) errors.push('iconDefaults must be an object, like { "poem": "Heart" }');
  else for (const [role, name] of Object.entries(iconDefaults)) {
    if (!['poem', 'category'].includes(role)) errors.push(`iconDefaults.${role} isn't a role (poem or category)`);
    else if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(name)) errors.push(`iconDefaults.${role} must be an icon's name, like "Heart" (got ${JSON.stringify(name)})`);
  }
}

// founder.why: the story answering "why build your own?" (#229, #589)
const why = get('founder.why');
if (why !== undefined && (typeof why !== 'string' || !/^story-\d+$/.test(why))) {
  errors.push(`founder.why must be a story id like "story-001" (got ${JSON.stringify(why)})`);
} else if (why === 'story-001') {
  warnings.push('founder.why is still unparty\'s story; write yours ("Why build your own" in the SETUP. steps)');
}

// ── founder.resume ───────────────────────────────────────────
// What /founders shows: articles and components the owner picked, and two
// switches. A pick that matches nothing is a warning: the page leaves it out
const resume = get('founder.resume');
if (resume !== undefined) {
  if (!resume || typeof resume !== 'object' || Array.isArray(resume)) {
    errors.push('founder.resume must be a block in { }, like { "articles": ["my-first-article"], "components": [] }');
  } else {
    for (const key of ['labels', 'views']) {
      if (resume[key] !== undefined && typeof resume[key] !== 'boolean') errors.push(`founder.resume.${key} must be true or false`);
    }
    if (resume.thesis !== undefined && (typeof resume.thesis !== 'string' || resume.thesis.trim() === '')) {
      errors.push('founder.resume.thesis must be a sentence in quotes (or left out)');
    }
    if (resume.areas !== undefined) {
      if (!Array.isArray(resume.areas)) {
        errors.push('founder.resume.areas must be a list, like [{ "name": "writing", "match": ["story"] }]');
      } else {
        resume.areas.forEach((area, index) => {
          if (!area || typeof area.name !== 'string' || area.name.trim() === '') errors.push(`founder.resume.areas[${index}] needs a name`);
          if (!area || !Array.isArray(area.match) || area.match.length === 0 || area.match.some(label => typeof label !== 'string')) {
            errors.push(`founder.resume.areas[${index}].match must list what counts toward it: a category, a tag, or article, story or component`);
          }
          if (area?.color !== undefined && !/^#[0-9a-f]{6}$/i.test(area.color)) errors.push(`founder.resume.areas[${index}].color must be a hex color like "#F9C22E"`);
        });
      }
    }
    for (const key of ['articles', 'components']) {
      if (resume[key] !== undefined && (!Array.isArray(resume[key]) || resume[key].some(item => typeof item !== 'string'))) {
        errors.push(`founder.resume.${key} must be a list of names in quotes`);
      }
    }
    if (Array.isArray(resume.components)) {
      const portfolio = readText(path.join(root, 'src', 'lib', 'component-portfolio.ts'));
      const names = new Set([...(portfolio.match(/COMPONENT_NAMES = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/'([A-Za-z0-9]+)'/g)].map(match => match[1]));
      for (const name of resume.components) {
        if (names.size > 0 && !names.has(name)) warnings.push(`founder.resume.components: "${name}" is not a component (see src/lib/component-portfolio.ts)`);
      }
    }
    if (Array.isArray(resume.articles)) {
      const known = knownContentSlugs();
      for (const slug of resume.articles) {
        if (!known.has(slug)) warnings.push(`founder.resume.articles: no article or story has the slug "${slug}"`);
      }
    }
  }
}

// ── brandColors ──────────────────────────────────────────────
const colors = get('brandColors');
if (!Array.isArray(colors)) {
  errors.push('brandColors must be a list of five colors, like ["#F9C22E", "", "", "", ""]');
} else {
  colors.forEach((color, index) => {
    if (typeof color !== 'string' || (color !== '' && !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      errors.push(`brandColors[${index}] must be "" or a color like "#F9C22E" (got ${JSON.stringify(color)})`);
    }
  });  // unparty's yellow first means the site still wears unparty's color
  if (typeof colors[0] === 'string' && colors[0].toUpperCase() === '#F9C22E') {
    warnings.push('brandColors[0] is still unparty\'s yellow ("#F9C22E"); your first brand color is your site\'s color');
  }
}

// ── sponsor ──────────────────────────────────────────────────
// Optional: the homepage sponsor card. Keep .github/FUNDING.yml in step
const sponsor = get('sponsor');
if (sponsor !== undefined) {
  if (!sponsor || typeof sponsor !== 'object') {
    errors.push('sponsor must be a block in { }, like { "github": "your-account", "polarUrl": "" }');
  } else {
    if (sponsor.github !== undefined && (typeof sponsor.github !== 'string' || (sponsor.github !== '' && !/^[A-Za-z0-9-]+$/.test(sponsor.github)))) {
      errors.push(`sponsor.github must be "" or just a GitHub account name (got ${JSON.stringify(sponsor.github)})`);
    } else if (sponsor.github === UNPARTY_VALUES['site.github']) {
      warnings.push(`sponsor.github is still unparty's ("${sponsor.github}"); use your own GitHub Sponsors account or "" to hide it, and update .github/FUNDING.yml`);
    }
    if (sponsor.polarUrl !== undefined && (typeof sponsor.polarUrl !== 'string' || (sponsor.polarUrl !== '' && !/^https:\/\//.test(sponsor.polarUrl)))) {
      errors.push('sponsor.polarUrl must be "" or a link starting with https://');
    }
    if (sponsor.pitch !== undefined && typeof sponsor.pitch !== 'string') errors.push('sponsor.pitch must be a sentence (or left out)');
  }
}

// ── icons ────────────────────────────────────────────────────
// Optional: icons drawn on the icon pad (/admin), by name, each a list of pen
// strokes. A broken stroke would just not draw, so this says which one
const icons = get('icons');
if (icons !== undefined) {
  if (!icons || typeof icons !== 'object' || Array.isArray(icons)) {
    errors.push('icons must be a block in { }, like { "Heart": ["M12 20c…"] }');
  } else {
    const drawable = fs.readFileSync(path.join(root, 'src/app/components/icons/drawable.ts'), 'utf8');
    const names = new Set([...drawable.matchAll(/'([A-Z][A-Za-z0-9]*)'/g)].map((m) => m[1]));
    for (const [name, strokes] of Object.entries(icons)) {
      if (!names.has(name)) errors.push(`icons.${name} isn't an icon the pad can draw (see src/app/components/icons/drawable.ts)`);
      else if (!Array.isArray(strokes) || !strokes.every((d) => typeof d === 'string' && /^M[-0-9.,\sMmLlCcQqSsTtHhVvZz]+$/.test(d.trim()))) {
        errors.push(`icons.${name} must be a list of pen strokes, each starting with M (redraw it on the pad)`);
      }
    }
  }
}

// ── values ───────────────────────────────────────────────────
// Optional: ValuesBadge on the homepage row and in the footer
const values = get('values');
if (values !== undefined) {
  if (!values || typeof values !== 'object') {
    errors.push('values must be a block in { }, like { "label": "NO HATE.", "line": "you do you, but there is no place for hate." }');
  } else {
    for (const key of ['label', 'line', 'cover']) {
      if (values[key] !== undefined && typeof values[key] !== 'string') errors.push(`values.${key} must be text (or left out)`);
    }
  }
}

// ── apps ─────────────────────────────────────────────────────
// Optional: the party page's "ask" button and the widget tray's panels
const apps = get('apps');
if (apps !== undefined) {
  const isUnparty = (value) => typeof value === 'string' && /(^|\.)unparty\.app(\/|$)/.test(value.replace(/^https:\/\//, ''));
  if (!apps || typeof apps !== 'object') {
    errors.push('apps must be a block in { }, like { "ask": "https://…", "widgets": [] }');
  } else {
    if (apps.ask !== undefined && (typeof apps.ask !== 'string' || (apps.ask !== '' && !/^https:\/\//.test(apps.ask)))) {
      errors.push('apps.ask must be "" or a url starting with https://');
    } else if (isUnparty(apps.ask)) {
      warnings.push(`apps.ask is still unparty's (${apps.ask}); point it at your own app, or use "" to hide the button`);
    }
    const widgets = apps.widgets ?? [];
    if (!Array.isArray(widgets)) {
      errors.push('apps.widgets must be a list');
    } else {
      widgets.forEach((widget, index) => {
        const where = `apps.widgets[${index}]`;
        for (const key of ['id', 'label', 'title', 'icon']) {
          if (!widget || typeof widget[key] !== 'string' || widget[key].trim() === '') errors.push(`${where}.${key} is missing or empty`);
        }
        if (!widget || typeof widget.src !== 'string' || !/^https:\/\//.test(widget.src)) errors.push(`${where}.src needs a url starting with https://`);
        else if (isUnparty(widget.src)) warnings.push(`${where} is still unparty's (${widget.src}); remove it or point it at your own app`);
      });
      if (widgets.length > 6) warnings.push(`apps.widgets has ${widgets.length} widgets; the tray shows only the first 6`);
    }
  }
}

// ── projects ─────────────────────────────────────────────────
// Optional. Each project's id is also its page's address (/my-project), made
// with ./create-page. See /article/setup-payments
const projects = get('projects');
if (projects !== undefined) {
  if (!Array.isArray(projects)) {
    errors.push('projects must be a list, like [{ "id": "my-project", "name": "My project", "polarProductId": null }]');
  } else {
    const seen = new Set();
    // Projects the site already has (UnpppsConfig): an entry with one of
    // their ids extends that project, inheriting its name, page and product
    let known = new Set();
    try {
      known = new Set(JSON.parse(readText(path.join(root, 'src', 'data', 'UnpppsConfig.json'))).unppps.map(unppp => unppp.id));
    } catch {
      // No UnpppsConfig in this copy: every project is the owner's own
    }
    projects.forEach((project, index) => {
      const where = `projects[${index}]`;
      if (!project || typeof project !== 'object') {
        errors.push(`${where} must be a block in { }`);
        return;
      }
      const { id, name, polarProductId } = project;
      if (typeof id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
        errors.push(`${where}.id must be lowercase words joined by dashes, like "my-project" (got ${JSON.stringify(id)})`);
      } else {
        if (seen.has(id)) errors.push(`${where}.id "${id}" is used twice`);
        seen.add(id);
        if (id.startsWith('theunparty') && !known.has(id)) errors.push(`${where}.id "${id}" starts with "theunparty", which is reserved for unparty's own pages`);
        else if (!fs.existsSync(path.join(root, 'src', 'app', id, 'page.tsx'))) warnings.push(`${where}.id "${id}" has no page yet (src/app/${id}/page.tsx); make one with ./create-page`);
      }
      if (!known.has(id) && (typeof name !== 'string' || name.trim() === '')) errors.push(`${where}.name is missing or empty`);
      if (polarProductId != null && (typeof polarProductId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(polarProductId))) {
        errors.push(`${where}.polarProductId must be null or a Polar product ID like "af987964-91ab-4577-a2fa-b7908fc115cc" (got ${JSON.stringify(polarProductId)})`);
      }
      // Where it stands and where it leads, for /founders' path
      const STAGES = ['idea', 'building', 'shipped', 'selling'];
      if (project.stage !== undefined && !STAGES.includes(project.stage)) {
        errors.push(`${where}.stage must be one of ${STAGES.map(stage => `"${stage}"`).join(', ')} (got ${JSON.stringify(project.stage)})`);
      }
      // Which kind of build, for its type's hub (/unppp/<type>)
      const TYPES = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'UnpppTypesConfig.json'), 'utf8')).types.map((t) => t.id);
      if (project.type !== undefined && !TYPES.includes(project.type)) {
        errors.push(`${where}.type must be one of ${TYPES.map((t) => `"${t}"`).join(', ')} (got ${JSON.stringify(project.type)})`);
      }
      if (project.leadsTo !== undefined && (!Array.isArray(project.leadsTo) || project.leadsTo.some(to => typeof to !== 'string'))) {
        errors.push(`${where}.leadsTo must be a list of project ids, like ["my-next-project"]`);
      }
      if (project.need !== undefined && (typeof project.need !== 'string' || project.need.trim() === '')) {
        errors.push(`${where}.need must be a line about the gap it closed, like "my palettes lived in five apps"`);
      }
      if (project.startsFrom !== undefined && (!Array.isArray(project.startsFrom) || project.startsFrom.some(point => typeof point !== 'string' || point.trim() === ''))) {
        errors.push(`${where}.startsFrom must be a list of starting points, like ["a brand", "a journal"]`);
      }
    });
    // A path can only lead to a project that exists
    projects.forEach((project, index) => {
      for (const to of Array.isArray(project?.leadsTo) ? project.leadsTo : []) {
        if (typeof to === 'string' && !seen.has(to)) warnings.push(`projects[${index}].leadsTo: no project has the id "${to}"`);
      }
    });
    // A product to sell, with selling switched off: its page shows "build yours" instead
    if (config.checkout === false && projects.some(project => project?.polarProductId)) {
      warnings.push('checkout is false, so your projects\' prices never show: set "checkout": true to sell them');
    }
  }
}

// ── stack ────────────────────────────────────────────────────
// Optional: what you pay for each service, keyed by its id in
// src/data/DependConfig.json. Shown beside a new copy's starting cost
const stack = get('stack');
if (stack !== undefined) {
  if (!stack || typeof stack !== 'object' || Array.isArray(stack)) {
    errors.push('stack must be a block in { }, like { "neon": { "plan": "free", "cost": 0, "payFrequency": "month" } }');
  } else {
    let dependIds = new Set();
    try {
      const depends = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'DependConfig.json'), 'utf8')).depends ?? [];
      dependIds = new Set(depends.map((depend) => depend.id));
    } catch {
      warnings.push('could not read src/data/DependConfig.json, so stack ids were not checked');
    }
    for (const [id, entry] of Object.entries(stack)) {
      const where = `stack.${id}`;
      if (dependIds.size > 0 && !dependIds.has(id)) {
        errors.push(`${where} is not a service in DependConfig.json (use one of: ${[...dependIds].join(', ')})`);
      }
      if (!entry || typeof entry !== 'object') {
        errors.push(`${where} must be a block in { }, like { "plan": "free", "cost": 0, "payFrequency": "month" }`);
        continue;
      }
      if (typeof entry.plan !== 'string' || entry.plan.trim() === '') errors.push(`${where}.plan is missing (the plan's name, like "free")`);
      if (typeof entry.cost !== 'number' || entry.cost < 0) errors.push(`${where}.cost must be a number, like 20 (no $ sign or quotes)`);
      if (!['month', 'year', 'once'].includes(entry.payFrequency)) errors.push(`${where}.payFrequency must be "month", "year" or "once"`);
    }
    // unparty's GitHub Enterprise bill is the giveaway
    if (stack.github?.plan === 'enterprise' && stack.github?.cost === 109) {
      warnings.push("stack is still unparty's; put in what you pay, or use {} to hide it");
    }
  }
}

// ── baseline ─────────────────────────────────────────────────
// Optional: what a goal's budget is measured against (src/lib/baseline.ts).
// Missing hides budgets
const baseline = get('baseline');
if (baseline !== undefined) {
  const number = (value, min = 0) => typeof value === 'number' && Number.isFinite(value) && value >= min;
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    errors.push('baseline must be a block in { }, with pay, hoursPerYear, llmPerHour and projects');
  } else {
    if (!Array.isArray(baseline.pay) || baseline.pay.length === 0) {
      errors.push('baseline.pay must list at least one pay, like [{ "label": "seed-stage founder", "yearly": 147000 }]');
    } else {
      baseline.pay.forEach((pay, index) => {
        if (typeof pay?.label !== 'string' || pay.label.trim() === '') errors.push(`baseline.pay[${index}].label is missing (whose pay it is)`);
        if (!number(pay?.yearly, 1)) errors.push(`baseline.pay[${index}].yearly must be a number, like 147000 (no $ sign, commas or quotes)`);
      });
    }
    if (!number(baseline.hoursPerYear, 1)) errors.push('baseline.hoursPerYear must be a number, like 2080 (52 weeks of 40 hours)');
    if (!number(baseline.llmPerHour)) errors.push('baseline.llmPerHour must be a number, like 0.92 (no $ sign or quotes)');
    if (baseline.measured !== undefined && !day.test(baseline.measured)) errors.push(`baseline.measured must be a date like "2026-09-24" (got ${JSON.stringify(baseline.measured)})`);
    if (!Array.isArray(baseline.projects)) {
      errors.push('baseline.projects must be a list, like [{ "id": "my-project", "hours": 40 }]');
    } else {
      const ids = new Set();
      baseline.projects.forEach((project, index) => {
        const where = `baseline.projects[${index}]`;
        if (typeof project?.id !== 'string' || project.id.trim() === '') errors.push(`${where}.id is missing`);
        else if (ids.has(project.id)) errors.push(`${where}.id "${project.id}" is used twice`);
        else ids.add(project.id);
        if (!number(project?.hours)) errors.push(`${where}.hours must be a number, like 40`);
        if (project?.site !== undefined && typeof project.site !== 'boolean') errors.push(`${where}.site must be true or false`);
        for (const key of ['from', 'to']) {
          if (project?.[key] !== undefined && !day.test(project[key])) errors.push(`${where}.${key} must be a date like "2026-09-24" (got ${JSON.stringify(project[key])})`);
        }
      });
      if (baseline.projects.filter((project) => project?.site === true).length > 1) {
        errors.push('baseline.projects: only one project can be "site": true (the one this copy is built from)');
      }
    }
    // Optional: when the hours happened, a year at a time
    if (baseline.rhythm !== undefined) {
      if (!Array.isArray(baseline.rhythm)) {
        errors.push('baseline.rhythm must be a list of years, like [{ "year": 2026, "commits": 120, "hours": [24 numbers], "days": [7 numbers] }]');
      } else {
        const years = new Set();
        baseline.rhythm.forEach((year, index) => {
          const where = `baseline.rhythm[${index}]`;
          if (!Number.isInteger(year?.year)) errors.push(`${where}.year must be a year, like 2026`);
          else if (years.has(year.year)) errors.push(`${where}.year ${year.year} is listed twice`);
          else years.add(year.year);
          if (!number(year?.commits)) errors.push(`${where}.commits must be a number`);
          if (!Array.isArray(year?.hours) || year.hours.length !== 24 || !year.hours.every((n) => number(n))) {
            errors.push(`${where}.hours must be 24 numbers, one for each hour from midnight`);
          }
          if (!Array.isArray(year?.days) || year.days.length !== 7 || !year.days.every((n) => number(n))) {
            errors.push(`${where}.days must be 7 numbers, Monday first`);
          }
          if (year?.through !== undefined && !day.test(year.through)) errors.push(`${where}.through must be a date like "2026-10-18" (got ${JSON.stringify(year.through)})`);
        });
      }
    }
    // Measured from unparty's own repos
    if (baseline.source === "unparty's own repos, hours measured from git work sessions") {
      warnings.push("baseline is still unparty's: a fine place to start, until you measure your own or have your LLM make one for your market");
    }
  }
}

// ── report ───────────────────────────────────────────────────
for (const warning of warnings) console.log(`⚠️  ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`❌ ${error}`);
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in src/data/FoundersConfig.json`);
  process.exit(1);
}
console.log(`✅ FoundersConfig.json checks out${warnings.length ? ` (${warnings.length} value${warnings.length === 1 ? '' : 's'} still unparty's)` : ''}`);
