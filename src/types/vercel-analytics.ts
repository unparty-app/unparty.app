/**
 * Type definitions for Vercel Analytics Drain events
 * Based on vercel.analytics.v2 schema
 */

export interface VercelAnalyticsEvent {
  schema: 'vercel.analytics.v2';
  eventType: 'pageview' | 'event';
  eventName?: string;
  eventData?: string;
  timestamp: number;
  projectId: string;
  ownerId: string;
  sessionId: number;
  deviceId: number;
  origin: string;
  path: string;
  referrer?: string;
  queryParams?: string;
  route?: string;
  country?: string;
  region?: string;
  city?: string;
  osName?: string;
  osVersion?: string;
  clientName?: string;
  clientType?: string;
  clientVersion?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  browserEngine?: string;
  browserEngineVersion?: string;
  sdkVersion?: string;
  sdkName?: string;
  sdkVersionFull?: string;
  vercelEnvironment?: string;
  vercelUrl?: string;
  flags?: string;
  deployment?: string;
}

export type VercelAnalyticsBatch = VercelAnalyticsEvent[];
