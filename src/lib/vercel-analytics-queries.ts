import { prisma } from '@/lib/prisma';

/**
 * Helper utilities for querying Vercel Analytics Drain data
 * Provides common analytics queries for dashboards and reports
 */
export class VercelAnalyticsQueries {
  /**
   * Get top pages by pageviews in a time range
   */
  static async getTopPages(startTime: Date, endTime: Date, limit = 10) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelPageview.groupBy({
      by: ['path'],
      _count: { path: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      orderBy: {
        _count: { path: 'desc' },
      },
      take: limit,
    });

    return results.map(r => ({ path: r.path, views: r._count.path }));
  }

  /**
   * Get unique visitors count
   */
  static async getUniqueVisitors(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const result = await prisma.vercelPageview.findMany({
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      distinct: ['deviceId'],
      select: { deviceId: true },
    });

    return result.length;
  }

  /**
   * Get event counts by event name
   */
  static async getEventCounts(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelEvent.groupBy({
      by: ['eventName'],
      _count: { eventName: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      orderBy: {
        _count: { eventName: 'desc' },
      },
    });

    return results.map(r => ({ name: r.eventName, count: r._count.eventName }));
  }

  /**
   * Get geographic distribution
   */
  static async getGeographicDistribution(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelPageview.groupBy({
      by: ['country'],
      _count: { country: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        country: { not: null },
      },
      orderBy: {
        _count: { country: 'desc' },
      },
    });

    return results.map(r => ({ country: r.country, count: r._count.country }));
  }

  /**
   * Get browser distribution
   */
  static async getBrowserDistribution(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelPageview.groupBy({
      by: ['clientName'],
      _count: { clientName: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        clientName: { not: null },
      },
      orderBy: {
        _count: { clientName: 'desc' },
      },
    });

    return results.map(r => ({ browser: r.clientName, count: r._count.clientName }));
  }

  /**
   * Get device type distribution
   */
  static async getDeviceTypeDistribution(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelPageview.groupBy({
      by: ['deviceType'],
      _count: { deviceType: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        deviceType: { not: null },
      },
      orderBy: {
        _count: { deviceType: 'desc' },
      },
    });

    return results.map(r => ({ deviceType: r.deviceType, count: r._count.deviceType }));
  }

  /**
   * Get pageview counts grouped by path, unfiltered/unlimited (unlike
   * getTopPages) — callers needing to map paths to product ids need full
   * coverage, not just a top-N slice.
   */
  static async getPageviewsByPath(startTime: Date, endTime: Date) {
    const startTimestamp = BigInt(startTime.getTime());
    const endTimestamp = BigInt(endTime.getTime());

    const results = await prisma.vercelPageview.groupBy({
      by: ['path'],
      _count: { path: true },
      where: {
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      orderBy: {
        _count: { path: 'desc' },
      },
    });

    return results.map(r => ({ path: r.path, views: r._count.path }));
  }
}
