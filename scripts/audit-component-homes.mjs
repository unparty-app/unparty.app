#!/usr/bin/env node
/**
 * The component-portfolio audit (#1433): every component in COMPONENT_NAMES
 * (src/lib/component-portfolio.ts) has exactly one home article presenting it,
 * every article's `presents` names a component that exists, and the portfolio
 * stays in step with componentRegistry in EditorialSection.tsx.
 *
 *   npm run audit:component-homes             the audit
 *   npm run audit:component-homes -- --verbose  also list the components
 *     outside the portfolio (src/app/components/*.tsx with no registry entry)
 *
 * Exits 1 when a component has no home, two articles claim the same component,
 * an article presents an unknown name, or the registry and portfolio disagree.
 * The AUDIT. Components workflow (component-audit-tracker.yml) runs this
 * weekly and on PRs that touch the portfolio, keeping one issue open while it
 * fails — instead of its old shape, which opened an issue per component file.
 *
 * Plain node:fs on purpose: it runs before npm ci.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTFOLIO = path.join(root, 'src/lib/component-portfolio.ts');
const REGISTRY = path.join(root, 'src/app/components/editorial/EditorialSection.tsx');
const ARTICLES_DIR = path.join(root, 'src/app/constants/editorial-articles/articles');
const COMPONENTS_DIR = path.join(root, 'src/app/components');

const verbose = process.argv.includes('--verbose');

// COMPONENT_NAMES, matched the same way create-component-article.mjs does
const names = [...fs.readFileSync(PORTFOLIO, 'utf8').matchAll(/^ {2}'([A-Za-z0-9]+)',$/gm)].map((m) => m[1]);

// componentRegistry's keys (tsc enforces this too; here it runs without npm ci)
const registrySource = fs.readFileSync(REGISTRY, 'utf8');
const registryBlock = registrySource.slice(registrySource.indexOf('const componentRegistry'));
const registered = [...registryBlock.slice(0, registryBlock.indexOf('\n};')).matchAll(/^ {2}([A-Za-z][A-Za-z0-9]*): /gm)].map((m) => m[1]);

// Every article that presents a component: component → [{ file, slug, published }]
const homes = new Map();
for (const f of fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.ts'))) {
  const text = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
  const component = text.match(/presents:\s*\{\s*component:\s*'([A-Za-z0-9]+)'/)?.[1];
  if (!component) continue;
  const home = {
    file: f,
    slug: text.match(/^\s*slug:\s*'([^']+)'/m)?.[1] ?? f.replace(/\.ts$/, ''),
    published: /^ {2}published:\s*true,/m.test(text),
  };
  homes.set(component, [...(homes.get(component) ?? []), home]);
}

const failures = [];
for (const name of registered.filter((n) => !names.includes(n))) {
  failures.push(`${name} is in componentRegistry but not in COMPONENT_NAMES (src/lib/component-portfolio.ts)`);
}
for (const name of names.filter((n) => !registered.includes(n))) {
  failures.push(`${name} is in COMPONENT_NAMES but not in componentRegistry (EditorialSection.tsx)`);
}
for (const [component, articles] of homes) {
  if (!names.includes(component)) {
    failures.push(`${articles.map((a) => a.file).join(', ')} presents '${component}', which isn't in COMPONENT_NAMES — tsc won't catch this`);
  }
  if (articles.length > 1) {
    failures.push(`${component} has ${articles.length} home articles (${articles.map((a) => a.file).join(', ')}); it gets exactly one`);
  }
}
const missing = names.filter((n) => !homes.has(n));
for (const name of missing) {
  failures.push(`${name} has no home article (npm run create:component-article -- ${name})`);
}

// The portfolio, one line per component
for (const name of names) {
  const [home] = homes.get(name) ?? [];
  console.log(home ? `${home.published ? '✓' : '·'} ${name.padEnd(26)} ${home.published ? '' : 'draft: '}/article/${home.slug}` : `✗ ${name.padEnd(26)} no home article`);
}
const published = names.filter((n) => homes.get(n)?.[0]?.published).length;
console.log(`\n${names.length} components in the portfolio: ${published} published homes, ${names.length - missing.length - published} drafts, ${missing.length} missing`);

// Not a failure, an answer to "what other components are missing here?":
// top-level components that aren't in the portfolio (most are page chrome)
const unregistered = fs.readdirSync(COMPONENTS_DIR)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))
  .filter((n) => !names.includes(n));
console.log(`${unregistered.length} components in src/app/components are outside the portfolio${verbose ? `:\n  ${unregistered.join(', ')}` : ' (--verbose lists them; most are page chrome)'}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('\nEvery portfolio component has exactly one home article.');
