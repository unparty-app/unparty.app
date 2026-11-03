import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVercelDrainSignature } from '@/lib/vercel-drain-security';
import { SITE_NAME } from '@/app/constants/organization';

// OTLP/HTTP attribute value — one of stringValue, intValue, boolValue, doubleValue
interface OtlpAnyValue {
  stringValue?: string;
  intValue?: string | number;
  boolValue?: boolean;
  doubleValue?: number;
  [key: string]: unknown;
}

interface OtlpKeyValue {
  key: string;
  value: OtlpAnyValue;
}

interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: number; // 0=unspecified,1=internal,2=server,3=client,4=producer,5=consumer
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: OtlpKeyValue[];
  status?: { code?: number; message?: string };
  events?: { name: string; timeUnixNano: string; attributes?: OtlpKeyValue[] }[];
}

interface OtlpScopeSpans {
  scope?: { name?: string; version?: string };
  spans: OtlpSpan[];
}

interface OtlpResourceSpans {
  resource?: { attributes?: OtlpKeyValue[] };
  scopeSpans: OtlpScopeSpans[];
}

interface OtlpExportRequest {
  resourceSpans: OtlpResourceSpans[];
}

// Only keep attrs that are useful for dashboards and debugging.
// Full OTLP payloads can include 20-30 keys (headers, SDK internals, etc.)
// that inflate every span row by 1-2 KB with zero operational value.
const KEPT_ATTR_KEYS = new Set([
  'http.method', 'http.request.method',
  'http.target', 'http.route', 'http.url',
  'http.status_code', 'http.response.status_code',
  'url.path', 'url.scheme',
  'next.span_type', 'next.span_name', 'next.route', 'next.page',
  'db.system', 'db.operation',
  'error.type', 'exception.message', 'exception.type',
  'vercel.runtime', 'vercel.region',
  'service.name', 'service.version',
]);

function trimAttrs(attrs: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([k]) => KEPT_ATTR_KEYS.has(k))
  );
}

// OTLP span kind numbers → readable strings
const SPAN_KINDS: Record<number, string> = {
  0: 'internal',
  1: 'internal',
  2: 'server',
  3: 'client',
  4: 'producer',
  5: 'consumer',
};

// OTLP status codes: 0=unset, 1=ok, 2=error
function otlpStatusToString(code?: number): string {
  if (code === 2) return 'ERROR';
  if (code === 1) return 'OK';
  return 'UNSET';
}

function extractAttrValue(value: OtlpAnyValue): string | number | boolean {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.intValue !== undefined) return Number(value.intValue);
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.doubleValue !== undefined) return value.doubleValue;
  return '';
}

function attrsToRecord(attrs: OtlpKeyValue[] = []): Record<string, string | number | boolean> {
  return Object.fromEntries(attrs.map(a => [a.key, extractAttrValue(a.value)]));
}

// POST — OTLP/HTTP JSON trace receiver
// Vercel sends ExportTraceServiceRequest: { "resourceSpans": [...] }
// Responds with ExportTraceServiceResponse: {} (OTLP spec)
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    // Protobuf format — binary, cannot parse as JSON. Accept and discard.
    if (contentType.includes('application/x-protobuf')) {
      return NextResponse.json({});
    }

    const body = await request.text();

    // Empty body (Vercel's drain config test ping)
    if (!body.trim()) {
      return NextResponse.json({});
    }

    // Prefer the new generic name first, then fall back to older trace-specific
    // env vars so existing deployments can migrate without breaking the drain.
    const drainSecret =
      process.env.DRAIN_SECRET ??
      process.env.VERCEL_TRACE_DRAIN_SECRET ??
      process.env.VERCEL_TRACING_DRAIN_SECRET;
    const signature = request.headers.get('x-vercel-signature');

    // Unset secret fails closed in production, like /api/analytics/vercel, so
    // anyone who finds this URL can't write spans into the database; dev and
    // preview without a secret still accept unsigned payloads for testing.
    if (drainSecret) {
      if (!signature || !verifyVercelDrainSignature(drainSecret, body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Drain secret not configured' }, { status: 401 });
    }

    let payload: OtlpExportRequest;
    try {
      payload = JSON.parse(body) as OtlpExportRequest;
    } catch {
      // Unparseable — accept and discard so config check passes
      return NextResponse.json({});
    }

    if (!payload.resourceSpans?.length) {
      return NextResponse.json({});
    }

    // Routes whose spans we never persist — prevents the drain and cron routes
    // from writing spans that would re-enter the collector and loop.
    const DRAIN_EXCLUDED_ROUTES = new Set(['/api/drains/traces', '/api/cron/db-cleanup']);

    const spanWrites: Array<{
      traceId: string;
      spanId: string;
      parentSpanId?: string;
      operationName: string;
      serviceName: string;
      spanKind: string;
      startTime: bigint;
      duration: bigint;
      statusCode: string;
      statusMessage?: string;
      attributes?: Record<string, string | number | boolean>;
      events?: Array<{
        name: string;
        timeUnixNano: string;
        attributes: Record<string, string | number | boolean>;
      }>;
    }> = [];

    // Process each resourceSpans batch
    for (const resourceSpan of payload.resourceSpans) {
      const resourceAttrs = attrsToRecord(resourceSpan.resource?.attributes);
      const projectId =
        (resourceAttrs['vercel.projectId'] as string) ||
        (resourceAttrs['service.name'] as string) ||
        'unknown';
      const deploymentId = resourceAttrs['vercel.deploymentId'] as string | undefined;

      for (const scopeSpan of resourceSpan.scopeSpans ?? []) {
        const spans = scopeSpan.spans ?? [];
        if (!spans.length) continue;

        // All spans in a scopeSpans batch share the same traceId
        const traceId = spans[0].traceId;
        const spanIds = new Set(spans.map(s => s.spanId));

        // Root span: no parentSpanId, or parentSpanId not in this batch
        const rootSpan =
          spans.find(s => !s.parentSpanId || !spanIds.has(s.parentSpanId)) ?? spans[0];

        const startTimes = spans.map(s => BigInt(s.startTimeUnixNano));
        const endTimes = spans.map(s => BigInt(s.endTimeUnixNano));
        const traceStart = startTimes.reduce((a, b) => (a < b ? a : b));
        const traceEnd = endTimes.reduce((a, b) => (a > b ? a : b));
        const hasErrors = spans.some(s => s.status?.code === 2);

        const rootAttrs = attrsToRecord(rootSpan.attributes);
        const requestPath =
          (rootAttrs['http.target'] as string) ||
          (rootAttrs['url.path'] as string) ||
          (rootAttrs['http.url'] as string) ||
          undefined;
        const requestMethod =
          (rootAttrs['http.method'] as string) ||
          (rootAttrs['http.request.method'] as string) ||
          undefined;

        // Skip persisting spans from infrastructure routes to prevent loops.
        if (requestPath && DRAIN_EXCLUDED_ROUTES.has(requestPath.split('?')[0])) {
          continue;
        }

        try {
          await prisma.vercelTrace.upsert({
            where: { traceId },
            update: {
              endTime: traceEnd,
              totalDuration: traceEnd - traceStart,
              spanCount: spans.length,
              hasErrors,
            },
            create: {
              traceId,
              rootSpanId: rootSpan.spanId,
              startTime: traceStart,
              endTime: traceEnd,
              totalDuration: traceEnd - traceStart,
              spanCount: spans.length,
              hasErrors,
              projectId,
              deploymentId,
              requestPath,
              requestMethod,
              metadata: JSON.parse(JSON.stringify({ resource: resourceAttrs })),
            },
          });

          for (const span of spans) {
            const spanAttrs = JSON.parse(JSON.stringify(trimAttrs(attrsToRecord(span.attributes))));
            const startNano = BigInt(span.startTimeUnixNano);
            const endNano = BigInt(span.endTimeUnixNano);

            spanWrites.push({
              traceId,
              spanId: span.spanId,
              parentSpanId: span.parentSpanId,
              operationName: span.name,
              serviceName:
                (resourceAttrs['service.name'] as string) ?? SITE_NAME,
              spanKind: SPAN_KINDS[span.kind ?? 0] ?? 'internal',
              startTime: startNano,
              duration: endNano - startNano,
              statusCode: otlpStatusToString(span.status?.code),
              statusMessage: span.status?.message,
              attributes: spanAttrs,
              events: span.events
                ? JSON.parse(JSON.stringify(span.events.map(e => ({
                    name: e.name,
                    timeUnixNano: e.timeUnixNano,
                    attributes: attrsToRecord(e.attributes),
                  }))))
                : undefined,
            });
          }
        } catch (dbError) {
          console.error('Trace storage error:', dbError);
          // Continue processing remaining batches
        }
      }
    }

    if (spanWrites.length) {
      try {
        // OTLP exports completed spans. If Vercel retries the same batch, keep
        // the first stored copy and drop duplicates at the database boundary.
        await prisma.vercelTraceSpan.createMany({
          data: spanWrites,
          skipDuplicates: true,
        });
      } catch (dbError) {
        console.error('Trace span storage error:', dbError);
      }
    }

    // OTLP/HTTP success response — spec requires {}
    return NextResponse.json({});

  } catch (error) {
    console.error('Trace drain error:', error);
    // Return {} even on error so Vercel does not retry endlessly
    return NextResponse.json({});
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'otlp-trace-drain',
    timestamp: new Date().toISOString(),
  });
}
