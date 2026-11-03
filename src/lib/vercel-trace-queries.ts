import { prisma } from '@/lib/prisma';
import type { TraceQueryFilters, TraceMetrics } from '@/types/vercel-traces';

/**
 * Helper utilities for querying Vercel Trace Drain data
 * Provides common trace queries for performance monitoring and debugging
 */
export class VercelTraceQueries {
  /**
   * Get recent traces with optional filtering
   */
  static async getTraces(filters: TraceQueryFilters = {}) {
    const {
      startTime,
      endTime,
      hasErrors,
      requestPath,
      minDuration,
      maxDuration,
      limit = 50,
      offset = 0,
    } = filters;

    const where: Record<string, unknown> = {};

    if (startTime || endTime) {
      where.startTime = {};
      if (startTime) (where.startTime as Record<string, unknown>).gte = BigInt(startTime.getTime() * 1000000);
      if (endTime) (where.startTime as Record<string, unknown>).lte = BigInt(endTime.getTime() * 1000000);
    }

    if (typeof hasErrors === 'boolean') {
      where.hasErrors = hasErrors;
    }

    if (requestPath) {
      where.requestPath = { contains: requestPath };
    }

    if (minDuration) {
      where.totalDuration = { ...((where.totalDuration as object) || {}), gte: BigInt(minDuration * 1000000) };
    }

    if (maxDuration) {
      where.totalDuration = { ...((where.totalDuration as object) || {}), lte: BigInt(maxDuration * 1000000) };
    }

    const traces = await prisma.vercelTrace.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        spans: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    // Convert BigInt to number for JSON serialization
    return traces.map(trace => ({
      ...trace,
      startTime: Number(trace.startTime),
      endTime: Number(trace.endTime),
      totalDuration: Number(trace.totalDuration),
      spans: trace.spans.map(span => ({
        ...span,
        startTime: Number(span.startTime),
        duration: Number(span.duration),
      })),
    }));
  }

  /**
   * Get a single trace by ID with all spans
   */
  static async getTraceById(traceId: string) {
    const trace = await prisma.vercelTrace.findUnique({
      where: { traceId },
      include: {
        spans: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!trace) return null;

    return {
      ...trace,
      startTime: Number(trace.startTime),
      endTime: Number(trace.endTime),
      totalDuration: Number(trace.totalDuration),
      spans: trace.spans.map(span => ({
        ...span,
        startTime: Number(span.startTime),
        duration: Number(span.duration),
      })),
    };
  }

  /**
   * Get traces for a specific request path (e.g., /story/cover-001)
   */
  static async getTracesForPath(pathPattern: string, limit = 20) {
    const traces = await prisma.vercelTrace.findMany({
      where: {
        requestPath: { contains: pathPattern },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      select: {
        traceId: true,
        requestPath: true,
        requestMethod: true,
        totalDuration: true,
        spanCount: true,
        hasErrors: true,
        startTime: true,
      },
    });

    return traces.map(trace => ({
      ...trace,
      startTime: Number(trace.startTime),
      totalDuration: Number(trace.totalDuration),
      // Convert nanoseconds to milliseconds for readability
      durationMs: Number(trace.totalDuration) / 1000000,
    }));
  }

  /**
   * Get performance metrics for a time range
   */
  static async getMetrics(startTime: Date, endTime: Date): Promise<TraceMetrics> {
    const startNs = BigInt(startTime.getTime() * 1000000);
    const endNs = BigInt(endTime.getTime() * 1000000);

    // Get all traces in range
    const traces = await prisma.vercelTrace.findMany({
      where: {
        startTime: { gte: startNs, lte: endNs },
      },
      select: {
        totalDuration: true,
        hasErrors: true,
        requestPath: true,
      },
    });

    if (traces.length === 0) {
      return {
        totalTraces: 0,
        errorRate: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        topPaths: [],
        topOperations: [],
      };
    }

    // Calculate basic metrics
    const durations = traces.map(t => Number(t.totalDuration));
    durations.sort((a, b) => a - b);

    const totalTraces = traces.length;
    const errorCount = traces.filter(t => t.hasErrors).length;
    const errorRate = (errorCount / totalTraces) * 100;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / totalTraces;

    // Calculate percentiles
    const p50Index = Math.floor(totalTraces * 0.5);
    const p95Index = Math.floor(totalTraces * 0.95);
    const p99Index = Math.floor(totalTraces * 0.99);

    // Group by path
    const pathCounts = new Map<string, { count: number; totalDuration: number }>();
    for (const trace of traces) {
      const path = trace.requestPath || 'unknown';
      const existing = pathCounts.get(path) || { count: 0, totalDuration: 0 };
      pathCounts.set(path, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + Number(trace.totalDuration),
      });
    }

    const topPaths = Array.from(pathCounts.entries())
      .map(([path, data]) => ({
        path,
        count: data.count,
        avgDuration: data.totalDuration / data.count / 1000000, // Convert to ms
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top operations from spans
    const operationCounts = await prisma.vercelTraceSpan.groupBy({
      by: ['operationName'],
      _count: { operationName: true },
      _avg: { duration: true },
      where: {
        trace: {
          startTime: { gte: startNs, lte: endNs },
        },
      },
      orderBy: {
        _count: { operationName: 'desc' },
      },
      take: 10,
    });

    const topOperations = operationCounts.map(op => ({
      name: op.operationName,
      count: op._count.operationName,
      avgDuration: Number(op._avg.duration || 0) / 1000000, // Convert to ms
    }));

    return {
      totalTraces,
      errorRate,
      avgDuration: avgDuration / 1000000, // Convert to ms
      p50Duration: durations[p50Index] / 1000000,
      p95Duration: durations[p95Index] / 1000000,
      p99Duration: durations[p99Index] / 1000000,
      topPaths,
      topOperations,
    };
  }

  /**
   * Get traces for cover/story routes specifically
   */
  static async getStoryTraces(coverId?: string, limit = 20) {
    const pathPattern = coverId ? `/story/${coverId}` : '/story/';
    
    const traces = await prisma.vercelTrace.findMany({
      where: {
        requestPath: { contains: pathPattern },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        spans: {
          where: {
            OR: [
              { operationName: { contains: 'story' } },
              { operationName: { contains: 'render' } },
              { operationName: { contains: 'fetch' } },
            ],
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return traces.map(trace => {
      // Extract coverId from path
      const pathMatch = trace.requestPath?.match(/\/story\/(cover-\d+)/);
      const extractedCoverId = pathMatch ? pathMatch[1] : null;

      return {
        traceId: trace.traceId,
        coverId: extractedCoverId,
        requestPath: trace.requestPath,
        durationMs: Number(trace.totalDuration) / 1000000,
        spanCount: trace.spanCount,
        hasErrors: trace.hasErrors,
        startTime: new Date(Number(trace.startTime) / 1000000),
        keySpans: trace.spans.map(span => ({
          operation: span.operationName,
          durationMs: Number(span.duration) / 1000000,
          status: span.statusCode,
        })),
      };
    });
  }

  /**
   * Get error traces for debugging
   */
  static async getErrorTraces(limit = 20) {
    const traces = await prisma.vercelTrace.findMany({
      where: { hasErrors: true },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        spans: {
          where: { statusCode: 'ERROR' },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return traces.map(trace => ({
      traceId: trace.traceId,
      requestPath: trace.requestPath,
      requestMethod: trace.requestMethod,
      durationMs: Number(trace.totalDuration) / 1000000,
      startTime: new Date(Number(trace.startTime) / 1000000),
      errorSpans: trace.spans.map(span => ({
        operation: span.operationName,
        error: span.statusMessage,
        attributes: span.attributes,
      })),
    }));
  }

  /**
   * Clean up old traces (retention policy)
   */
  static async cleanupOldTraces(
    traceRetentionDays: number = 30,
    spanRetentionDays: number = 7
  ) {
    const traceCutoffTime = new Date();
    traceCutoffTime.setDate(traceCutoffTime.getDate() - traceRetentionDays);
    const traceCutoffNs = BigInt(traceCutoffTime.getTime() * 1000000);

    const spanCutoffTime = new Date();
    spanCutoffTime.setDate(spanCutoffTime.getDate() - spanRetentionDays);
    const spanCutoffNs = BigInt(spanCutoffTime.getTime() * 1000000);

    const deletedSpans = await prisma.vercelTraceSpan.deleteMany({
      where: {
        startTime: { lt: spanCutoffNs },
      },
    });

    const deletedTraces = await prisma.vercelTrace.deleteMany({
      where: {
        startTime: { lt: traceCutoffNs },
      },
    });

    return {
      deletedTraces: deletedTraces.count,
      deletedSpans: deletedSpans.count,
      retentionDays: {
        traces: traceRetentionDays,
        spans: spanRetentionDays,
      },
    };
  }
}
