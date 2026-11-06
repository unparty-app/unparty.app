// Screenshot pages as the signed-in admin (session from signin.mjs).
//   node .claude/skills/verify/shot.mjs <topic> <path...> [--mobile] [--dark] [--base=http://localhost:3000]
// Writes tmp/previews/<topic>/<path>-<desktop|mobile>[-dark].png and prints, per page,
// the final URL (a /sign-in landing means the session expired: re-run signin.mjs)
// and any console errors.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const { chromium } = createRequire(path.join(root, 'tmp/playwright/package.json'))('playwright');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [topic, ...paths] = args.filter((a) => !a.startsWith('--'));
const base = [...flags].find((f) => f.startsWith('--base='))?.slice(7) ?? 'http://localhost:3000';
const statePath = path.join(root, 'tmp/.auth/admin.json');

if (!topic || paths.length === 0) {
  console.error('Usage: node .claude/skills/verify/shot.mjs <topic> <path...> [--mobile] [--dark]');
  process.exit(1);
}
if (!existsSync(statePath)) console.warn('No saved session: shooting signed out (run signin.mjs first)');

const mobile = flags.has('--mobile');
const outDir = path.join(root, 'tmp/previews', topic);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: existsSync(statePath) ? statePath : undefined,
  viewport: mobile ? { width: 375, height: 812 } : { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  hasTouch: mobile,
  colorScheme: flags.has('--dark') ? 'dark' : 'light',
});

for (const p of paths) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const res = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120_000 }).catch((e) => ({ status: () => e.message }));
  // Scroll the whole page so scroll-revealed sections render, then back to the top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800); // let entrance motion settle
  const name = `${p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'home'}-${mobile ? 'mobile' : 'desktop'}${flags.has('--dark') ? '-dark' : ''}.png`;
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  const landed = new URL(page.url()).pathname;
  console.log(`${p} → ${res?.status?.()} ${landed !== p ? `(landed on ${landed}) ` : ''}${path.relative(root, path.join(outDir, name))}`);
  for (const e of errors.slice(0, 5)) console.log(`  console error: ${e.slice(0, 200)}`);
  await page.close();
}

// Clerk refreshes the session token while pages run; keep the fresher cookies
if (existsSync(statePath)) await context.storageState({ path: statePath }).catch(() => {});
await browser.close();
