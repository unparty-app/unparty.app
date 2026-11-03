import { readFile } from 'fs/promises';
import { join } from 'path';
import { FORCE_DARK_MODE } from '@/app/constants/theme';

export const dynamic = 'force-dynamic';

/**
 * public/repo-metadata-dashboard.html is a bare content fragment — no
 * <html>/<head>/<style> of its own — delivered by theunpartyrunway's
 * run-repo-analysis pipeline (a plain `cp`, re-run periodically) to be
 * injected into theunpartyapp's own layout, which is where its Tailwind
 * classes and --text-muted/--brand-accent/--border/--depth-raised variables
 * normally come from.
 *
 * To embed it standalone (e.g. in an iframe, outside that layout) it needs
 * those tokens supplied some other way. Rather than hand-copying their
 * values — which would silently drift the moment globals.css changes —
 * this reads the actual :root / :root:where(.dark) blocks out of
 * globals.css at request time and reuses them verbatim, so any future
 * token change (or new token this fragment starts using) picks up
 * automatically with no second file to maintain.
 */

// The small, fixed set of Tailwind utility classes the fragment actually
// uses. Inlined here instead of pulling the Tailwind CDN JIT compiler, which
// would add a third-party runtime dependency (and a point of failure) to a
// first-party embed just to generate a handful of rules.
const UTILITY_CSS = `
.flex { display: flex; }
.flex-1 { flex: 1 1 0%; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-3 { gap: 0.75rem; }
.w-full { width: 100%; }
.w-28 { width: 7rem; }
.w-8 { width: 2rem; }
.p-4 { padding: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-normal { font-weight: 400; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-wide { letter-spacing: 0.025em; }
@media (min-width: 768px) {
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
`;
async function extractThemeBlocks(): Promise<string> {
  const cssPath = join(process.cwd(), 'src/app/globals.css');
  const css = await readFile(cssPath, 'utf8');

  const blocks: string[] = [];
  for (const selector of [':root {', ':root:where(.dark) {']) {
    const start = css.indexOf(selector);
    if (start === -1) continue;
    const braceStart = start + selector.length - 1;
    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    blocks.push(css.slice(start, end + 1));
  }
  return blocks.join('\n');
}

export async function GET() {
  try {
    const [themeBlocks, fragment] = await Promise.all([
      extractThemeBlocks(),
      readFile(join(process.cwd(), 'public/repo-metadata-dashboard.html'), 'utf8'),
    ]);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Repo Metadata Dashboard</title>
<script>
  // Mirrors the dark-mode toggle in src/app/layout.tsx exactly, driven by
  // the same FORCE_DARK_MODE flag, so this document's :root:where(.dark)
  // block only applies when the rest of the app would also be dark.
  (function(){var f=${JSON.stringify(FORCE_DARK_MODE)};var m=window.matchMedia("(prefers-color-scheme: dark)");var apply=function(){document.documentElement.classList.toggle("dark",f||m.matches)};apply();m.addEventListener("change",apply)})();
</script>
<style>
${themeBlocks}
${UTILITY_CSS}
body { margin: 0; padding: 1rem; background: var(--background); color: var(--foreground); font-family: system-ui, -apple-system, sans-serif; }
.theme-link { color: var(--theme-color, #f9c22e); text-decoration: underline; text-underline-offset: 2px; }
.theme-link:hover { opacity: 0.7; }
</style>
</head>
<body>
${fragment}
</body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch {
    return new Response('Failed to load report', { status: 500 });
  }
}
