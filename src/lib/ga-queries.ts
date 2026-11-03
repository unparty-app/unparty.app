import { google, analyticsdata_v1beta } from 'googleapis';

/**
 * GA4 Data API query layer for /article and /story organic-traffic reporting
 * (theunpartyapp#664). Mirrors the shape of VercelAnalyticsQueries — static
 * methods, Date-range params — but reads from Google Analytics instead of
 * the Vercel Analytics drain, since GA is the source for organic-search
 * segmented sessions.
 *
 * Auth follows the same JWT service-account pattern already used for Sheets
 * in scripts/migrate-books.ts (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY),
 * just with the analytics.readonly scope. The service account additionally
 * needs Viewer access granted on the GA4 property itself (GA4 Admin →
 * Property Access Management) — a GCP-side credential alone is not enough.
 */

const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

let cachedClient: Promise<analyticsdata_v1beta.Analyticsdata> | null = null;
let hasLoggedInit = false;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[ga-queries] Missing required env var ${name}. Set it in .env.local — see .env.example for the expected format.`
    );
  }
  return value;
}

function getPropertyResourceName(): string {
  const propertyId = requireEnv('GA4_PROPERTY_ID');
  if (!/^\d+$/.test(propertyId)) {
    throw new Error(
      `[ga-queries] GA4_PROPERTY_ID="${propertyId}" doesn't look like a GA4 property ID (expected a numeric ID, e.g. "406090681" — this is NOT the "G-XXXXXXX" measurement ID). Find it in GA4 Admin → Property Settings.`
    );
  }
  return `properties/${propertyId}`;
}

async function getAnalyticsClient(): Promise<analyticsdata_v1beta.Analyticsdata> {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = (async () => {
    const serviceAccountEmail = requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    let privateKey = requireEnv('GOOGLE_PRIVATE_KEY');

    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error(
        '[ga-queries] GOOGLE_PRIVATE_KEY is not properly formatted (missing "-----BEGIN PRIVATE KEY-----"). Check the value wasn\'t truncated or double-escaped in .env.local.'
      );
    }

    const jwt = new google.auth.JWT(serviceAccountEmail, undefined, privateKey, [ANALYTICS_SCOPE]);

    try {
      await jwt.authorize();
    } catch (err) {
      console.error(
        `[ga-queries] Failed to authorize service account "${serviceAccountEmail}" for scope ${ANALYTICS_SCOPE}. ` +
          'This is usually a bad/expired GOOGLE_PRIVATE_KEY, or a mismatch between the key and GOOGLE_SERVICE_ACCOUNT_EMAIL. ' +
          'Raw error:',
        err
      );
      throw err;
    }

    if (!hasLoggedInit) {
      console.log(`[ga-queries] Authorized as ${serviceAccountEmail} for GA4 Data API access.`);
      hasLoggedInit = true;
    }

    return google.analyticsdata({ version: 'v1beta', auth: jwt });
  })();

  // Don't cache a rejected auth attempt — let the next call retry cleanly.
  cachedClient.catch(() => {
    cachedClient = null;
  });

  return cachedClient;
}

function formatGaDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Wraps a runReport call with logging that distinguishes the two most
 * common misconfigurations: a GA4-side permission problem (service account
 * not added as Viewer on the property) vs. a bad property ID / malformed
 * request. Both look like opaque 4xx errors from the googleapis client
 * otherwise.
 */
async function runReport(
  requestBody: analyticsdata_v1beta.Schema$RunReportRequest,
  context: string
): Promise<analyticsdata_v1beta.Schema$RunReportResponse> {
  const property = getPropertyResourceName();
  const client = await getAnalyticsClient();

  try {
    const response = await client.properties.runReport({ property, requestBody });
    return response.data;
  } catch (err) {
    const gaxiosErr = err as { code?: number | string; response?: { data?: { error?: { status?: string; message?: string } } } };
    const status = gaxiosErr.response?.data?.error?.status;
    const message = gaxiosErr.response?.data?.error?.message ?? String(err);

    const apiNotEnabled = /has not been used in project|it is disabled/i.test(message);

    if (apiNotEnabled) {
      console.error(
        `[ga-queries] ${context}: the Google Analytics Data API isn't enabled on the GCP project behind this service account. ` +
          `Fix: enable it at the URL in Google's message below, then wait a few minutes for it to propagate. ` +
          `Google's message: ${message}`
      );
    } else if (status === 'PERMISSION_DENIED' || gaxiosErr.code === 403) {
      console.error(
        `[ga-queries] ${context}: PERMISSION_DENIED on ${property}. ` +
          'The API is enabled and the service account authenticated, but it likely hasn\'t been granted access to this ' +
          'specific GA4 property. Fix: GA4 Admin → Property Access Management → add the service account email as a Viewer. ' +
          `Google's message: ${message}`
      );
    } else if (status === 'INVALID_ARGUMENT' || gaxiosErr.code === 400) {
      console.error(
        `[ga-queries] ${context}: INVALID_ARGUMENT for ${property} — check GA4_PROPERTY_ID is the numeric property ID, ` +
          `not the "G-XXXXXXX" measurement ID or a stray value. Google's message: ${message}`
      );
    } else {
      console.error(`[ga-queries] ${context}: request to ${property} failed. Google's message: ${message}`, err);
    }

    throw err;
  }
}

export interface OrganicLandingPageRow {
  path: string;
  sessions: number;
  engagedSessions: number;
  avgEngagementTimeSeconds: number;
  bounceRate: number;
}

export interface OrganicTrafficSummary {
  pathPrefix: string;
  sessions: number;
  engagedSessions: number;
  avgEngagementTimeSeconds: number;
  pageCount: number;
}

export class GA4Queries {
  /**
   * Per-page organic-search performance for pages under a path prefix
   * (e.g. "/article/" or "/story/"). This is the "which individual
   * articles/stories are pulling traffic" number from #664's measurement
   * plan.
   */
  static async getOrganicLandingPages(
    startDate: Date,
    endDate: Date,
    pathPrefix: string,
    limit = 25
  ): Promise<OrganicLandingPageRow[]> {
    const data = await runReport(
      {
        dateRanges: [{ startDate: formatGaDate(startDate), endDate: formatGaDate(endDate) }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'userEngagementDuration' },
          { name: 'bounceRate' },
        ],
        dimensionFilter: {
          andGroup: {
            expressions: [
              { filter: { fieldName: 'landingPage', stringFilter: { matchType: 'BEGINS_WITH', value: pathPrefix } } },
              {
                filter: {
                  fieldName: 'sessionDefaultChannelGroup',
                  stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
                },
              },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: String(limit),
      },
      `getOrganicLandingPages(${pathPrefix})`
    );

    return (data.rows ?? []).map((row) => {
      const path = row.dimensionValues?.[0]?.value ?? '';
      const sessions = Number(row.metricValues?.[0]?.value ?? 0);
      const engagedSessions = Number(row.metricValues?.[1]?.value ?? 0);
      const totalEngagementSeconds = Number(row.metricValues?.[2]?.value ?? 0);
      const bounceRate = Number(row.metricValues?.[3]?.value ?? 0);

      return {
        path,
        sessions,
        engagedSessions,
        avgEngagementTimeSeconds: sessions > 0 ? totalEngagementSeconds / sessions : 0,
        bounceRate,
      };
    });
  }

  /**
   * Aggregate organic-search totals for a path prefix — the top-line
   * "is this prefix getting organic traffic at all" number. Sums across
   * up to `sampleSize` distinct pages under the prefix rather than issuing
   * a dimension-less report (GA4's Data API requires dimensionFilter
   * targets to also appear in `dimensions`).
   */
  static async getOrganicTrafficSummary(
    startDate: Date,
    endDate: Date,
    pathPrefix: string,
    sampleSize = 250
  ): Promise<OrganicTrafficSummary> {
    const rows = await this.getOrganicLandingPages(startDate, endDate, pathPrefix, sampleSize);

    const sessions = rows.reduce((sum, r) => sum + r.sessions, 0);
    const engagedSessions = rows.reduce((sum, r) => sum + r.engagedSessions, 0);
    const totalEngagementSeconds = rows.reduce((sum, r) => sum + r.avgEngagementTimeSeconds * r.sessions, 0);

    if (rows.length === sampleSize) {
      console.warn(
        `[ga-queries] getOrganicTrafficSummary(${pathPrefix}): hit sampleSize=${sampleSize} exactly — ` +
          'totals may be undercounting if there are more distinct pages under this prefix than the sample covers.'
      );
    }

    return {
      pathPrefix,
      sessions,
      engagedSessions,
      avgEngagementTimeSeconds: sessions > 0 ? totalEngagementSeconds / sessions : 0,
      pageCount: rows.length,
    };
  }
}
