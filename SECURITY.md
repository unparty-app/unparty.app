# Security Policy

## Supported Versions

unparty-app has marked security policy as a required step before release. 

| Version | Supported |
| ------- | --------- |
| latest (main) | :white_check_mark: |

## Reporting a Vulnerability

unparty-app can be contacted at info@unparty.app

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any relevant logs, screenshots, or proof-of-concept code

We aim to respond within 5 business days. Please do not publicly disclose vulnerabilities before we have had a chance to investigate and address them.

## Security Architecture

### Authentication & Authorization

- **Authentication**: Handled by [Clerk](https://clerk.com/). All user sessions use Clerk's JWT-based session management. Client-side auth uses `useAuth()` and server-side uses `auth()` from Clerk's Next.js SDK.
- **Role-based access control**: Admin routes require the `admin` role checked via Clerk session claims (`sessionClaims.metadata.role`). All `/admin/*` routes and `/api/admin/*` endpoints call `requireAdmin()` before processing requests.
- **Admin UI protection**: The admin panel layout redirects unauthenticated users to `/sign-in`.

### API Security

- **Admin API routes**: Protected with server-side `requireAdmin()` guard — unauthorized requests receive a 401/403 response.
- **Webhook signature verification**:
  - GitHub webhooks: verified using HMAC-SHA256 signature via `@octokit/webhooks-methods` before processing.
  - Polar payment webhooks: verified using the `POLAR_WEBHOOK_SECRET` environment variable via the `@polar-sh/nextjs` SDK.
  - Vercel trace drains: verified using HMAC signature via `verifyVercelDrainSignature` when `DRAIN_SECRET` is set.
- **Cron job protection**: The `/api/cron/db-cleanup` endpoint requires a Bearer token matching `CRON_SECRET`; in production, requests without the token are rejected.
- **Input validation**: Payment intent requests use [Zod](https://zod.dev/) schema validation before processing.

### Payments

- Polar payment processing uses `POLAR_WEBHOOK_SECRET` for webhook verification.

### File Uploads

- SVG uploads (`/api/upload-svg`) write directly to the `public/svgs` directory. **Note**: this endpoint currently has no authentication check — this is a known gap for admin-only file management.
- General file uploads (`/api/upload`) use Vercel Blob storage with public access. This endpoint also has no authentication check.

### Data & Privacy

- A formal privacy policy is available at `/privacy`, describing data collection, usage, and user rights.
- Terms of service are available at `/terms`.
- A waitlist signup goes through the auth-gated `POST /api/problem/send` (requires a signed-in Clerk user), which creates a reviewable `UserSubmission` and opens a GitHub Discussion for admin review. Moving that discussion to the "Approve" category fires a GitHub webhook (HMAC-SHA256 verified) that sets `Clerk publicMetadata.waitlistStatus = 'approved'`, which the proxy (`src/proxy.ts`) checks to gate `/party`.
- User progress data is stored in the database and tied to Clerk user IDs.
- Analytics data (pageviews, traces) is automatically purged after 30 days via a scheduled cron job.

### Secrets & Environment Variables

The following secrets must be stored in environment variables and must never be committed to the repository:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk server-side secret |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook HMAC verification |
| `POLAR_WEBHOOK_SECRET` | Polar payment webhook verification |
| `DRAIN_SECRET` | Vercel trace drain signature verification |
| `CRON_SECRET` | Cron job Bearer token |
| `APPLE_MUSIC_TEAM_ID` / `APPLE_MUSIC_KEY_ID` / `APPLE_MUSIC_PRIVATE_KEY` | Apple MusicKit JWT signing |

## Known Security Gaps

- SVG and general file upload endpoints (`/api/upload-svg`, `/api/upload`) are not gated by authentication. Admin access controls should be added.
- Waitlist approval is delegated to GitHub: the webhook signature proves a request came from GitHub, but the app does not independently verify that whoever moved the Discussion to "Approve" was authorized to grant access — authorization relies entirely on GitHub repo/Discussion category permissions, outside the app's own access-control model.
- The `/api/musickit-token` endpoint generates and returns a signed JWT to any caller without authentication, which could allow unauthorized Apple Music API usage.

## Dependencies

Dependency security is managed via npm. We recommend running `npm audit` regularly to check for known vulnerabilities in dependencies.
