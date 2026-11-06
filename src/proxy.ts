/**
 * UNPARTY proxy (Next 16's name for middleware), with Clerk authentication
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { isMissingRoute, isMissingStep, stepIdFrom } from '@/lib/known-routes'
import { WAITLIST_ON } from '@/app/constants/organization'
import { CLERK_ON } from '@/lib/clerk-on'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/waitlist(.*)',
  '/api/musickit-token(.*)',
  '/api/chat(.*)',
  '/api/not-found', // NotFoundView counts a 404 it showed
  '/api/words(.*)', // The owner's most used words (InkWords, theunpartycloud's word cloud)
  '/api/resume(.*)', // The owner's resume charts by name, for articles that embed them
  '/api/recommendations(.*)', // Where to start, and the path after it (#624)
  '/api/unppp-config(.*)',
  '/api/analytics/vercel(.*)', // Vercel Analytics Drain webhook
  '/api/reports/repo-metadata-embed(.*)', // Standalone HTML report embed for /reports
  '/waitlist(.*)',
  '/about(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/article(.*)',
  '/story(.*)',
  '/covers(.*)',
  '/theunparty(.*)', // All theunparty showcase pages
  '/build(.*)',
  '/color(.*)',
  '/uncolor(.*)',
  '/unppp(.*)',
  '/status(.*)',
  '/reports(.*)',
  '/valuation(.*)',
  '/og(.*)',
  '/connect(.*)',
  '/founders(.*)',
  '/faq(.*)',
  '/books(.*)',
  '/languages(.*)',
  '/business-test(.*)',
  '/html(.*)',
  '/film-calculator(.*)',
  '/ai(.*)',
  '/goal-budget(.*)',
])

// Protected routes that always require auth
const isProtectedRoute = createRouteMatcher([
  '/party(.*)',
  '/admin(.*)',
  '/blobupload(.*)',
])

// Backstop only: every /api/admin handler also starts with adminGuard(), because
// signing in is not the same as being an admin. Answered here with a plain 401
// (auth.protect() would hide the route behind a 404)
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)'])

// Full app access — when the waitlist is on (WAITLIST_ON), also gated on approval (or admin role)
const isWaitlistGatedRoute = createRouteMatcher(['/party(.*)'])

// Hands the requested path to the page as `x-pathname`: the 404 page
// (src/app/not-found.tsx) can't learn it any other way on the server, and
// needs it for its suggestions (the count comes from the browser).
//
// A slug a dynamic route doesn't serve (/article/no-such-post) is rewritten to
// a path no route matches, so Next renders the full 404 page into the HTML
// instead of the empty shell a page's notFound() gets (src/lib/known-routes.ts).
// The address bar keeps the URL. Not in dev: the slug list is made when dev
// starts, so an article added while it runs would 404 here.
//
// /steps/<id> asks the database instead (isMissingStep), on full page loads
// only: a click from a cover photo opens the step in the @modal slot as a
// client navigation, which already handles a missing step in place (#1390)
async function withPathname(req: NextRequest) {
  const headers = new Headers(req.headers)
  const { pathname } = req.nextUrl
  headers.set('x-pathname', pathname)
  const missing = () => NextResponse.rewrite(new URL(`/__missing${pathname}`, req.url), { request: { headers } })
  if (process.env.NODE_ENV === 'production' && isMissingRoute(pathname)) return missing()
  const stepId = stepIdFrom(pathname)
  const pageLoad = !req.headers.has('rsc') && !req.headers.has('next-router-prefetch')
  if (stepId && pageLoad && (await isMissingStep(stepId, req.nextUrl.origin))) return missing()
  return NextResponse.next({ request: { headers } })
}

const withClerk = clerkMiddleware(async (auth, req) => {
  // No waitlist, nothing to wait for: the pending page sends people on to /party.
  // Checked before the public routes, since /waitlist is one of them
  if (!WAITLIST_ON && req.nextUrl.pathname === '/waitlist/pending') {
    return NextResponse.redirect(new URL('/party', req.url))
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return withPathname(req)
  }

  if (isAdminApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return withPathname(req)
  }

  // Protect specific routes
  if (isProtectedRoute(req)) {
    const { sessionClaims } = await auth.protect()

    // Only when the owner runs a waitlist (FoundersConfig.json `waitlist`)
    if (WAITLIST_ON && isWaitlistGatedRoute(req)) {
      const metadata = sessionClaims?.metadata
      const isApproved = metadata?.role === 'admin' || metadata?.waitlistStatus === 'approved'

      if (!isApproved) {
        const pendingUrl = new URL('/waitlist/pending', req.url)
        return NextResponse.redirect(pendingUrl)
      }
    }
  }

  return withPathname(req)
})

// No sign-in connected (src/lib/clerk-on.ts): the same routes and the same locks,
// without Clerk, which would answer every request with a 500 here. Nobody can
// sign in, so /admin, /party and /api/admin stay shut for everyone
async function withoutClerk(req: NextRequest) {
  if (!WAITLIST_ON && req.nextUrl.pathname === '/waitlist/pending') {
    return NextResponse.redirect(new URL('/party', req.url))
  }
  if (isPublicRoute(req)) return withPathname(req)
  if (isAdminApiRoute(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (isProtectedRoute(req)) {
    const signIn = new URL('/sign-in', req.url)
    signIn.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signIn)
  }
  return withPathname(req)
}

export default CLERK_ON ? withClerk : withoutClerk

export const config = {
  matcher: [
    // Skip Next.js internals and static assets. Not .html/.txt/.xml: those are
    // mistyped page links often enough ('/article/x.html') that the 404 page
    // needs their x-pathname, and the few real ones in public/ pass straight through
    '/((?!_next|[^?]*\\.(?:css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|otf|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
