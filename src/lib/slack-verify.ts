import { createHmac, timingSafeEqual } from 'crypto'

// Requests older than this are refused, so a captured request can't be replayed
const MAX_AGE_SECONDS = 60 * 5

/**
 * Verifies a request really came from Slack, as Slack documents it: an HMAC
 * SHA-256 of `v0:{timestamp}:{raw body}` with the app's Signing Secret, sent
 * as `X-Slack-Signature: v0={hex}` next to `X-Slack-Request-Timestamp`.
 * Pass the body exactly as received, before any parsing.
 */
export function verifySlackRequest(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string
): boolean {
  if (!timestamp || !signature) return false

  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > MAX_AGE_SECONDS) {
    return false
  }

  const expected = `v0=${createHmac('sha256', signingSecret).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
