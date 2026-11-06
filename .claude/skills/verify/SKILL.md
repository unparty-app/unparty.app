---
name: verify
description: Build/launch/drive recipe for verifying UI changes in this app at runtime
---

# Verifying changes in the running app

## Launch

- A dev server is often already running on port 3000 (check `.next/dev/logs/next-development.log` or just `curl -s localhost:3000 -o /dev/null -w '%{http_code}'`). Reuse it — Turbopack compiles from current source on demand; do NOT kill the user's server.
- Otherwise: `npm run dev` (Turbopack, ~0.5s ready). It auto-falls-back to 3001 if 3000 is busy, but then exits with "Another next dev server is already running" — that means use the existing :3000 server.

## Drive (GUI surface)

- No Playwright in the repo. Install ad hoc: `npx playwright install chromium`, then in a temp dir `npm init -y && npm install playwright --no-save` and run an `.mjs` script with `import { chromium } from 'playwright'`.
- Useful viewports: desktop 1280×800, mobile 375×812.
- Floating UI lives bottom-right: Fab (auth, `size-14 sm:size-16` at bottom-4 right-4) and WidgetDock (utility tray above it). Dock toggle is `[aria-controls="widget-dock-list"]` — its aria-label flips between "Open widget tray"/"Close widget tray", so don't locate it by name across state changes.

## Signed-in pages (`/admin/*`, `/party/*`)

These need sign-in connected (Clerk keys in `.env`). Without them, `/admin` and `/party` stay locked and there's nothing to sign in to.

Playwright lives in the gitignored `tmp/playwright/` (recreate it with `cd tmp/playwright && npm init -y && npm install playwright && npx playwright install chromium`). The session lives in `tmp/.auth/admin.json`, also gitignored.

- **Sign in once:** run `node .claude/skills/verify/signin.mjs` yourself with `run_in_background`, then tell the user to sign in through the window that opens. It waits up to 20 minutes, through 2FA, and then saves the session. Don't ask them to run it with `!`: those commands stop after 2 minutes, which cuts off 2FA.
- **Shoot:** `node .claude/skills/verify/shot.mjs <topic> /admin/problems /party [--mobile] [--dark]` saves screenshots to `tmp/previews/<topic>/` and prints each page's final URL and console errors. If a page lands on `/sign-in`, the session expired, so ask for the sign-in again.
- **Write custom flows (clicks, forms):** create the context with `storageState: 'tmp/.auth/admin.json'`, and load `playwright` through `createRequire` from `tmp/playwright/package.json`, as both scripts do.
- **Data writes are real:** the session is the site owner's own admin account on whatever database `.env` points at. A submit or approve really runs, so ask before driving a write.

## Gotchas

- **Fixed-position UI must portal to `document.body`**: `.page-transition-wrapper > *` keeps a `transform` (animation `forwards` fill), so `position: fixed` inside page content anchors to the article, not the viewport. Fab/WidgetDock/OutlineRail all portal for this reason.
- Article routes: `/api/articles/<slug>` 404s for unregistered (`registry.ts`) or `published: false` articles — the page still returns 200 with an error state. A known-good test slug: `/article/setup-github`.
- Touch tests need `hasTouch: true` in the Playwright context or `.tap()` throws. On touch, synthetic mouseenter fires before click — hover-expand UIs must gate on `(hover: hover)`.
- Widget iframes: a widget host that sends `CSP frame-ancestors` limited to its own site renders BLANK when framed from localhost. Not a bug; verify via the network request firing instead.
- Verify iframe laziness by counting requests to the widget hosts before any panel is opened (should be 0).
- Header mobile menu is z-[9999]; widget panels z-[60]; floating triggers z-50.
