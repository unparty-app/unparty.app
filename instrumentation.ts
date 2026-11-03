import { registerOTel } from '@vercel/otel';
import { SITE_NAME } from '@/app/constants/organization';
import {
  ParentBasedSampler,
  SamplingDecision,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import type {
  Sampler,
  SamplingResult,
} from '@opentelemetry/sdk-trace-base';
import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api';

// Routes that must never generate OTel spans — prevents the trace drain, cron
// routes, and analytics drain from feeding back into the collector and
// amplifying event counts.
const EXCLUDED_ROUTE_PREFIXES = ['/api/drains/', '/api/cron/', '/api/analytics/'];

class RoutedSampler implements Sampler {
  private readonly base: Sampler;

  constructor(base: Sampler) {
    this.base = base;
  }

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[]
  ): SamplingResult {
    const path = (
      (attributes['http.target'] as string | undefined) ??
      (attributes['url.path'] as string | undefined) ??
      (attributes['http.url'] as string | undefined) ??
      ''
    );
    if (EXCLUDED_ROUTE_PREFIXES.some(p => path.startsWith(p))) {
      return { decision: SamplingDecision.NOT_RECORD };
    }
    return this.base.shouldSample(context, traceId, spanName, spanKind, attributes, links);
  }

  toString(): string {
    return `RoutedSampler(${this.base.toString()})`;
  }
}

export function register() {
  registerOTel({
    // The site name from FoundersConfig, so a copy's traces carry its own name
    serviceName: SITE_NAME,
    attributes: {
      'service.environment': process.env.VERCEL_ENV || 'development',
      'service.version': process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    },
    // Sample 10% of traces to control Vercel Observability event volume.
    // Wrap in RoutedSampler to hard-drop spans from infrastructure routes
    // (drain + cron) and break the collector → drain → DB → collector loop.
    traceSampler: new RoutedSampler(
      new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(0.1) })
    ),
  });
}
