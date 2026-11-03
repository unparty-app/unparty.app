import { SITE_EMAIL, SITE_TITLE } from '@/app/constants/organization';

/**
 * The privacy policy and terms (src/data/privacypolicy.json, termsofuse.json)
 * name the site and its contact address as {site} and {email}, filled from
 * FoundersConfig here, so a copy's policies show its own address and email.
 * The rest of the wording is the owner's to review and make their own.
 */
export function fillLegal<T>(value: T): T {
  if (typeof value === 'string') return value.replaceAll('{email}', SITE_EMAIL).replaceAll('{site}', SITE_TITLE) as T;
  if (Array.isArray(value)) return value.map(fillLegal) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, fillLegal(v)])) as T;
  }
  return value;
}
