// Sign in once, headed, and save the session for every later verification run.
//   node .claude/skills/verify/signin.mjs [baseUrl]   (default http://localhost:3000)
// Run it in the background (no time limit; `!` commands stop after 2 minutes, mid-2FA).
// A real browser window opens on /sign-in. Sign in as the admin (any Clerk step,
// email codes included); the script notices the redirect and saves cookies and
// localStorage to tmp/.auth/admin.json. Re-run it when shots land on /sign-in again.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const { chromium } = createRequire(path.join(root, 'tmp/playwright/package.json'))('playwright');
const base = process.argv[2] ?? 'http://localhost:3000';
const statePath = path.join(root, 'tmp/.auth/admin.json');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await page.goto(`${base}/sign-in?redirect_url=${encodeURIComponent(`${base}/admin`)}`);
console.log('Sign in in the browser window (20 minutes)…');

// Signed in: back on the app (not /sign-in, not Clerk's own pages mid-2FA) with a
// __session cookie. Polled rather than waitForURL, since 2FA can hop between origins
const appOrigin = new URL(base).origin;
const deadline = Date.now() + 20 * 60_000;
for (;;) {
  if (page.isClosed()) throw new Error('Window closed before sign-in finished');
  const url = new URL(page.url());
  const onApp = url.origin === appOrigin && !url.pathname.startsWith('/sign-in');
  if (onApp && (await context.cookies(base)).some((c) => c.name === '__session')) break;
  if (Date.now() > deadline) throw new Error('No sign-in after 20 minutes');
  await new Promise((r) => setTimeout(r, 1000));
}
await page.waitForLoadState('networkidle').catch(() => {});

mkdirSync(path.dirname(statePath), { recursive: true });
await context.storageState({ path: statePath });
console.log(`Saved session to ${path.relative(root, statePath)} (landed on ${new URL(page.url()).pathname})`);
await browser.close();
