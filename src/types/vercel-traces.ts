/**
 * Type definitions for Vercel Trace Drain events
 * Based on OpenTelemetry Trace specification
 * 
 * @see https://vercel.com/docs/drains/reference/traces
 */

/**
 * Span status codes
 */
export type SpanStatusCode = 'OK' | 'ERROR' | 'UNSET';

/**
 * Span kinds as defined by OpenTelemetry
 */
export type SpanKind = 'server' | 'client' | 'producer' | 'consumer' | 'internal';

/**
 * Span status information
 */
export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

/**
 * Span event - notable moment during span execution
 */
export interface SpanEvent {
  name: string;
  timestamp: number; // Unix timestamp in nanoseconds
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Link to another span (for distributed tracing)
 */
export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Resource information about the service
 */
export interface Resource {
  'service.name': string;
  'service.version'?: string;
  'service.environment'?: string;
  'telemetry.sdk.name'?: string;
  'telemetry.sdk.version'?: string;
  'telemetry.sdk.language'?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Individual trace span from Vercel
 */
export interface VercelTraceSpan {
  // Identifiers
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  
  // Operation details
  operationName: string;
  serviceName: string;
  kind: SpanKind;
  
  // Timing (nanoseconds)
  startTime: number;
  duration: number;
  
  // Status
  status: SpanStatus;
  
  // Additional context
  attributes: Record<string, string | number | boolean>;
  events?: SpanEvent[];
  links?: SpanLink[];
  
  // Vercel-specific context
  requestId?: string;
  deploymentId?: string;
  projectId?: string;
  region?: string;
}

/**
 * Complete trace event containing multiple spans
 */
export interface VercelTraceEvent {
  // Batch metadata
  resource: Resource;
  
  // Span data
  spans: VercelTraceSpan[];
  
  // Batch identifiers
  batchId?: string;
  exportTime?: number;
}

/**
 * Trace drain webhook payload (array of trace events)
 */
export type VercelTraceBatch = VercelTraceEvent[];

/**
 * Attributes commonly found in Vercel infrastructure spans
 */
export interface VercelInfrastructureAttributes {
  'http.method'?: string;
  'http.url'?: string;
  'http.target'?: string;
  'http.status_code'?: number;
  'http.request.method'?: string;
  'http.response.status_code'?: number;
  'url.path'?: string;
  'url.query'?: string;
  'user_agent.original'?: string;
  'server.address'?: string;
  'client.address'?: string;
  'vercel.runtime'?: string;
  'vercel.region'?: string;
  'vercel.deployment.id'?: string;
  'vercel.cache.status'?: string;
  'vercel.function.name'?: string;
  'next.span_name'?: string;
  'next.span_type'?: string;
  'next.route'?: string;
  'next.page'?: string;
}

/**
 * Attributes for fetch spans
 */
export interface FetchSpanAttributes {
  'http.method': string;
  'http.url': string;
  'http.status_code'?: number;
  'http.response_content_length'?: number;
  'net.peer.name'?: string;
  'net.peer.port'?: number;
}

/**
 * Custom span attributes for cover/story operations
 */
export interface StorySpanAttributes {
  'story.cover_id': string;
  'story.title'?: string;
  'story.author'?: string;
  'story.published'?: boolean;
  'unppp.id'?: string;
  'unppp.name'?: string;
  'unppp.priority'?: number;
  'unppp.category'?: string;
}

/**
 * Processed trace for storage and querying
 */
export interface ProcessedTrace {
  traceId: string;
  rootSpanId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  spanCount: number;
  hasErrors: boolean;
  requestPath?: string;
  requestMethod?: string;
  projectId: string;
  deploymentId?: string;
  spans: ProcessedSpan[];
}

/**
 * Processed span for storage
 */
export interface ProcessedSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  spanKind: SpanKind;
  startTime: number;
  duration: number;
  statusCode: SpanStatusCode;
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
  events?: SpanEvent[];
}

/**
 * Trace query filters
 */
export interface TraceQueryFilters {
  startTime?: Date;
  endTime?: Date;
  hasErrors?: boolean;
  requestPath?: string;
  operationName?: string;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  offset?: number;
}

/**
 * Trace aggregation metrics
 */
export interface TraceMetrics {
  totalTraces: number;
  errorRate: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  topPaths: Array<{ path: string; count: number; avgDuration: number }>;
  topOperations: Array<{ name: string; count: number; avgDuration: number }>;
}
