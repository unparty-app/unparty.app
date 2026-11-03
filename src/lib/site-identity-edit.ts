/**
 * Who a site says it is, changed from an imported brand (#807): a set of
 * FoundersConfig `site` fields, edited in the file's own text so nothing else
 * in it moves. Plain text in, plain text out, so it can be checked on its own.
 */

export const SITE_IDENTITY_LIMITS = { name: 60, tagline: 140, description: 300 } as const;

export type SiteIdentityField = keyof typeof SITE_IDENTITY_LIMITS;
export type SiteIdentity = Partial<Record<SiteIdentityField, string>>;

const FIELDS = Object.keys(SITE_IDENTITY_LIMITS) as SiteIdentityField[];

/** The fields worth writing: known, text, not blank. An error names what's too long */
export function cleanSiteIdentity(value: unknown): { identity: SiteIdentity } | { error: string } {
  if (!value || typeof value !== 'object') return { error: 'Send a name, tagline or description' };
  const identity: SiteIdentity = {};
  for (const field of FIELDS) {
    const raw = (value as Record<string, unknown>)[field];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== 'string') return { error: `${field} must be text` };
    const text = raw.trim().replace(/\s+/g, ' ');
    if (text.length > SITE_IDENTITY_LIMITS[field]) return { error: `${field} can be at most ${SITE_IDENTITY_LIMITS[field]} characters` };
    if (text) identity[field] = text;
  }
  return Object.keys(identity).length ? { identity } : { error: 'Send a name, tagline or description' };
}

/**
 * The config text with these `site` fields set, keeping the rest of the file's
 * formatting. `founder` has its own `name`, so each field is looked for only
 * after `"site"`, and the result is checked: only these fields may have
 * changed, or it throws before anything reaches the file.
 */
export function withSiteIdentity(text: string, identity: SiteIdentity): string {
  const before = JSON.parse(text);
  const start = text.indexOf('"site"');
  if (start < 0) throw new Error('No site in this config');

  let next = text;
  for (const field of FIELDS) {
    const value = identity[field];
    if (value === undefined) continue;
    const pattern = new RegExp(`"${field}":\\s*"(?:[^"\\\\]|\\\\.)*"`);
    const at = next.slice(start).search(pattern);
    if (at < 0) throw new Error(`No site.${field} in this config`);
    // Replacer functions, so a $ in the brand stays a $
    next = next.slice(0, start) + next.slice(start).replace(pattern, () => `"${field}": ${JSON.stringify(value)}`);
  }

  const expected = { ...before, site: { ...before.site, ...identity } };
  if (JSON.stringify(JSON.parse(next)) !== JSON.stringify(expected)) throw new Error('That edit would have changed more than the site');
  return next;
}
