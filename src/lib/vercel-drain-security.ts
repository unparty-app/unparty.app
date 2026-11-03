import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify Vercel drain signature.
 *
 * Vercel drain events (log drains, trace drains, analytics drains) are signed
 * using HMAC-SHA1 with the drain's signature secret. The signature is sent as
 * a raw hex string in the x-vercel-signature header — no prefix like "sha256=".
 *
 * All Vercel drains (analytics, trace) share this scheme — do not use the
 * HMAC-SHA256 "sha256="-prefixed GitHub webhook convention for these.
 *
 * Ref: https://vercel.com/docs/drains/security
 */
export function verifyVercelDrainSignature(
  secret: string,
  rawBody: string,
  signature: string
): boolean {
  try {
    const expectedHex = createHmac('sha1', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHex);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}
