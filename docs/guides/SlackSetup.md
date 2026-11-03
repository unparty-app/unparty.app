# Slack Setup

The step-by-step guide is the **[SLACK.](/article/setup-slack)** article (source: `src/app/constants/editorial-articles/articles/setup-slack.ts`). Start there. This page is the quick reference next to it.

The site uses **incoming webhooks** (one URL per channel) and, optionally, **interactivity** for buttons. It does not use a bot token, so no `xoxb-` token and no OAuth scopes are needed.

## Keys

| Key | What posts there | Code |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Each waitlist worksheet (new or updated) | `src/app/api/problem/send/route.ts` |
| `SLACK_WEBHOOK_URL_CHAT` | Each message sent through the site's chat box | `src/app/api/chat/send/route.ts` |
| `SLACK_SIGNING_SECRET` | Not a channel: turns on Approve / Reject buttons on worksheet messages | `src/app/api/slack/interactions/route.ts`, `src/lib/slack-verify.ts` |

All three go in `.env` and in Vercel's Environment Variables. Each is optional; without it, that message (or the buttons) is skipped.

## Setup in short

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**, pick your workspace
2. **Incoming Webhooks** → on → **Add New Webhook to Workspace**, once per channel. Copy each URL
3. Optional buttons: **Interactivity & Shortcuts** → on → Request URL `https://<your site>/api/slack/interactions`. Then **Basic Information → App Credentials → Signing Secret** into `SLACK_SIGNING_SECRET`

## How the buttons work

- The worksheet message gets **Approve** and **Reject** when `SLACK_SIGNING_SECRET` is set
- A click is verified against the Signing Secret (5-minute replay window), answered at once, then handled in `after()`:
  - **Approve** runs `approveSubmission(id, 'slack')`, the same path as `/admin/submissions`: the row is marked APPROVED, Clerk `waitlistStatus` is set, and the Loops email is sent if configured. If the site also reviews in GitHub Discussions, the discussion is moved to Approve
  - **Reject** marks the row REJECTED
- The message is then rewritten through `response_url`: same content, buttons replaced by who decided
- Only a PENDING worksheet can be decided from Slack, so an old message can't undo a decision made elsewhere
- Anyone who can see the channel can click, so use a **private** channel
- Slack must reach your site, so buttons work on the live site, not on `localhost`
