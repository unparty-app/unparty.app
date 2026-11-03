import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';

/**
 * Tracing utilities for theunpartyapp
 * 
 * Provides helper functions for creating custom spans in the application.
 * Use these to trace story loading, cover operations, and other key workflows.
 * 
 * @example
 * ```typescript
 * import { withSpan, createStorySpan } from '@/lib/tracing';
 * 
 * // Using withSpan for automatic span management
 * const data = await withSpan('story.load', async (span) => {
 *   span.setAttribute('story.coverId', coverId);
 *   return await loadStoryData(coverId);
 * });
 * 
 * // Using createStorySpan for story-specific tracing
 * const span = createStorySpan('story.fetch', coverId);
 * try {
 *   const story = await fetchStory(coverId);
 *   span.setStatus({ code: SpanStatusCode.OK });
 *   return story;
 * } catch (error) {
 *   span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */

// Default tracer for the application
const TRACER_NAME = 'theunpartyapp';

/**
 * Get the application tracer
 */
export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Wrap an async operation in a span
 * 
 * @param name - Span name (e.g., 'story.fetch', 'database.query')
 * @param fn - Async function to execute within the span
 * @param attributes - Optional attributes to add to the span
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add initial attributes
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }

      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Record exception as span event
      if (error instanceof Error) {
        span.recordException(error);
      }
      
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Wrap a sync operation in a span
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  attributes?: Record<string, string | number | boolean>
): T {
  const tracer = getTracer();
  const span = tracer.startSpan(name);
  
  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }

    const result = fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (error instanceof Error) {
      span.recordException(error);
    }
    
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a span for story-related operations
 */
export function createStorySpan(
  operation: string,
  coverId: string,
  unpppId?: string
): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(`story.${operation}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'story.operation': operation,
      'story.cover_id': coverId,
    },
  });

  if (unpppId) {
    span.setAttribute('unppp.id', unpppId);
  }

  return span;
}

/**
 * Create a span for cover gallery operations
 */
export function createCoverSpan(
  operation: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const tracer = getTracer();
  return tracer.startSpan(`cover.${operation}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'cover.operation': operation,
      ...attributes,
    },
  });
}

/**
 * Create a span for database operations
 */
export function createDatabaseSpan(
  operation: string,
  model: string
): Span {
  const tracer = getTracer();
  return tracer.startSpan(`prisma.${operation}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.system': 'prisma',
      'db.operation': operation,
      'db.model': model,
    },
  });
}

/**
 * Create a span for API route handlers
 */
export function createApiSpan(
  method: string,
  route: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const tracer = getTracer();
  return tracer.startSpan(`api.${method.toLowerCase()}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': method,
      'http.route': route,
      ...attributes,
    },
  });
}

/**
 * Add UNPPP context to a span
 */
export function addUnpppContext(
  span: Span,
  unpppConfig: {
    id: string;
    name: string;
    priority?: number;
    category?: string | null;
    cover?: string;
    storyPublished?: boolean;
  }
): void {
  span.setAttribute('unppp.id', unpppConfig.id);
  span.setAttribute('unppp.name', unpppConfig.name);
  
  if (unpppConfig.priority !== undefined) {
    span.setAttribute('unppp.priority', unpppConfig.priority);
  }
  
  if (unpppConfig.category) {
    span.setAttribute('unppp.category', unpppConfig.category);
  }
  
  if (unpppConfig.cover) {
    span.setAttribute('unppp.cover', unpppConfig.cover);
  }
  
  if (unpppConfig.storyPublished !== undefined) {
    span.setAttribute('unppp.story_published', unpppConfig.storyPublished);
  }
}

/**
 * Add story metadata to a span
 */
export function addStoryContext(
  span: Span,
  story: {
    title?: string;
    author?: string;
    published?: boolean;
    category?: string;
    date?: string;
  }
): void {
  if (story.title) span.setAttribute('story.title', story.title);
  if (story.author) span.setAttribute('story.author', story.author);
  if (story.published !== undefined) span.setAttribute('story.published', story.published);
  if (story.category) span.setAttribute('story.category', story.category);
  if (story.date) span.setAttribute('story.date', story.date);
}

/**
 * Record timing metrics as span attributes
 */
export function recordTiming(
  span: Span,
  timings: {
    fetchTimeMs?: number;
    parseTimeMs?: number;
    renderTimeMs?: number;
    totalTimeMs?: number;
  }
): void {
  if (timings.fetchTimeMs !== undefined) {
    span.setAttribute('timing.fetch_ms', timings.fetchTimeMs);
  }
  if (timings.parseTimeMs !== undefined) {
    span.setAttribute('timing.parse_ms', timings.parseTimeMs);
  }
  if (timings.renderTimeMs !== undefined) {
    span.setAttribute('timing.render_ms', timings.renderTimeMs);
  }
  if (timings.totalTimeMs !== undefined) {
    span.setAttribute('timing.total_ms', timings.totalTimeMs);
  }
}

/**
 * Get the current active span (if any)
 */
export function getCurrentSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Run a function within a specific span context
 */
export function runInSpanContext<T>(
  span: Span,
  fn: () => T
): T {
  return context.with(trace.setSpan(context.active(), span), fn);
}

// Re-export useful types and constants
export { SpanStatusCode, SpanKind };
export type { Span, Tracer };
