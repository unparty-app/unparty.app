import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVercelDrainSignature } from '@/lib/vercel-drain-security';
import { z } from 'zod';

// Vercel signs all drains (log/trace/analytics) with HMAC-SHA1 raw hex, not
// the HMAC-SHA256 "sha256="-prefixed scheme this route used previously — see
// vercel-drain-security.ts. VERCEL_WEBHOOK_SECRET is a legacy name for this
// drain's secret, kept as a fallback so existing deployments don't need an
// env var rename before this ships; DRAIN_SECRET (shared with the trace
// drain) is preferred going forward.
function getDrainSecret(): string | undefined {
  return process.env.DRAIN_SECRET ?? process.env.VERCEL_WEBHOOK_SECRET;
}

const MAX_BATCH_SIZE = 1000;

// Zod schema for Vercel Analytics event validation
const VercelAnalyticsEventSchema = z.object({
  schema: z.literal('vercel.analytics.v2'),
  eventType: z.enum(['pageview', 'event']),
  eventName: z.string().optional(),
  eventData: z.string().optional(),
  timestamp: z.number(),
  projectId: z.string(),
  ownerId: z.string(),
  // Vercel's own docs describe every field below `schema`/`eventType` as a
  // "possible" field — not guaranteed present. sessionId/deviceId were
  // required here (matching the non-nullable VercelPageview/VercelEvent DB
  // columns), which rejected real Vercel payloads that omit them; see the
  // 0n fallback below where these are written.
  sessionId: z.number().optional(),
  deviceId: z.number().optional(),
  origin: z.string(),
  path: z.string(),
  referrer: z.string().optional(),
  queryParams: z.string().optional(),
  route: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  clientName: z.string().optional(),
  clientType: z.string().optional(),
  clientVersion: z.string().optional(),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  browserEngine: z.string().optional(),
  browserEngineVersion: z.string().optional(),
  sdkVersion: z.string().optional(),
  sdkName: z.string().optional(),
  sdkVersionFull: z.string().optional(),
  vercelEnvironment: z.string().optional(),
  vercelUrl: z.string().optional(),
  flags: z.string().optional(),
  deployment: z.string().optional(),
});

const VercelAnalyticsBatchSchema = z.array(VercelAnalyticsEventSchema);

// sessionId/deviceId are non-nullable BigInt columns, so a missing value
// (now valid per the schema above) needs a sentinel rather than null.
const toBigIntOrZero = (value: number | undefined): bigint => value !== undefined ? BigInt(value) : BigInt(0);

export async function POST(request: Request) {
  try {
    // 1. Read raw body for signature verification
    const body = await request.text();

    // Vercel's drain config "Test" button sends an empty body as a
    // connectivity ping (not a signed analytics payload) — mirrors the same
    // handling in src/app/api/drains/traces/route.ts. Without this,
    // JSON.parse('') throws and the test shows a 400 in the dashboard.
    if (!body.trim()) {
      return NextResponse.json({ success: true, processed: { pageviews: 0, events: 0, total: 0 } });
    }

    const signature = request.headers.get('x-vercel-signature');

    // 2. Verify drain signature. Unset secret fails closed in production
    // (matching db-cleanup's isAuthorized() pattern) so this endpoint can't
    // silently accept unsigned writes once deployed; dev/preview without a
    // secret configured still works unauthenticated for local testing.
    const drainSecret = getDrainSecret();
    if (drainSecret) {
      if (!signature || !verifyVercelDrainSignature(drainSecret, body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Drain secret not configured' }, { status: 401 });
    }

    // 3. Parse and validate the payload
    let events;
    try {
      const parsed = JSON.parse(body);
      events = VercelAnalyticsBatchSchema.parse(parsed);
    } catch (error) {
      console.error('Invalid payload format:', error);
      return NextResponse.json(
        {
          error: 'Invalid payload format',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Cheap defense against a malformed/oversized payload forcing an
    // unbounded createMany — Vercel's own drain batches are well under this.
    if (events.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch too large: ${events.length} events exceeds max of ${MAX_BATCH_SIZE}` },
        { status: 413 }
      );
    }

    // 4. Separate pageviews and custom events
    const pageviews = events.filter(e => e.eventType === 'pageview');
    const customEvents = events.filter(e => e.eventType === 'event');

    // 5. Batch insert pageviews
    if (pageviews.length > 0) {
      await prisma.vercelPageview.createMany({
        data: pageviews.map(event => ({
          schema: event.schema,
          timestamp: BigInt(event.timestamp),
          projectId: event.projectId,
          ownerId: event.ownerId,
          sessionId: toBigIntOrZero(event.sessionId),
          deviceId: toBigIntOrZero(event.deviceId),
          origin: event.origin,
          path: event.path,
          referrer: event.referrer,
          queryParams: event.queryParams,
          route: event.route,
          country: event.country,
          region: event.region,
          city: event.city,
          osName: event.osName,
          osVersion: event.osVersion,
          clientName: event.clientName,
          clientType: event.clientType,
          clientVersion: event.clientVersion,
          deviceType: event.deviceType,
          deviceBrand: event.deviceBrand,
          deviceModel: event.deviceModel,
          browserEngine: event.browserEngine,
          browserEngineVersion: event.browserEngineVersion,
          sdkVersion: event.sdkVersion,
          sdkName: event.sdkName,
          sdkVersionFull: event.sdkVersionFull,
          vercelEnvironment: event.vercelEnvironment,
          vercelUrl: event.vercelUrl,
          deployment: event.deployment,
          flags: event.flags,
        })),
        skipDuplicates: true,
      });
    }

    // 6. Batch insert custom events
    if (customEvents.length > 0) {
      await prisma.vercelEvent.createMany({
        data: customEvents.map(event => ({
          schema: event.schema,
          eventName: event.eventName!,
          eventData: event.eventData,
          timestamp: BigInt(event.timestamp),
          projectId: event.projectId,
          ownerId: event.ownerId,
          sessionId: toBigIntOrZero(event.sessionId),
          deviceId: toBigIntOrZero(event.deviceId),
          origin: event.origin,
          path: event.path,
          referrer: event.referrer,
          queryParams: event.queryParams,
          route: event.route,
          country: event.country,
          region: event.region,
          city: event.city,
          osName: event.osName,
          osVersion: event.osVersion,
          clientName: event.clientName,
          clientType: event.clientType,
          clientVersion: event.clientVersion,
          deviceType: event.deviceType,
          deviceBrand: event.deviceBrand,
          deviceModel: event.deviceModel,
          browserEngine: event.browserEngine,
          browserEngineVersion: event.browserEngineVersion,
          sdkVersion: event.sdkVersion,
          sdkName: event.sdkName,
          sdkVersionFull: event.sdkVersionFull,
          vercelEnvironment: event.vercelEnvironment,
          vercelUrl: event.vercelUrl,
          deployment: event.deployment,
          flags: event.flags,
        })),
        skipDuplicates: true,
      });
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      processed: {
        pageviews: pageviews.length,
        events: customEvents.length,
        total: events.length,
      },
    });

  } catch (error) {
    console.error('Error processing Vercel analytics drain:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
