/**
 * The site's LLM connection (#236, #396), one place every feature asks for a
 * model. unparty-app works without one: each feature that uses it (Thoughts
 * replies, free-text path recommendations) has a way to work without it.
 *
 * Three ways in, tried in this order:
 *
 * 1. A reader's own key (BYOK, #396). They paste an Anthropic key, which
 *    stays in their browser tab and comes with each request in a header. It
 *    goes straight to Anthropic, never through the owner's AI Gateway, so a
 *    bad key can't fall back to the owner's credits (Gateway retries a failed
 *    BYOK request on system credentials, and its budgets can't cap BYOK
 *    spend). Never stored, never logged.
 * 2. The owner's Anthropic key (ANTHROPIC_API_KEY), straight to Anthropic.
 *    One account; the owner caps spend in the Anthropic Console. A key made
 *    outside a workspace has to name one: ANTHROPIC_WORKSPACE_ID.
 * 3. The owner's AI Gateway (AI_GATEWAY_API_KEY, or Vercel's OIDC token on a
 *    deployment) with the model they pick in AI_GATEWAY_MODEL: any provider,
 *    fallbacks, Gateway budgets.
 *
 * Callers rate-limit the owner's paths per person. None set, there's no
 * model and the feature does without.
 */
import 'server-only';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

/** The header a reader's own key comes in. Read once per request, never stored */
export const VISITOR_KEY_HEADER = 'x-llm-key';

// The Anthropic model for the direct paths (a reader's key, the owner's
// ANTHROPIC_API_KEY): Anthropic's own model id, small and fast by default
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

export type LlmVia = 'visitor' | 'owner';

export interface LlmConnection {
  model: LanguageModel;
  via: LlmVia; // Whose key pays: the reader's own, or the owner's
}

const anthropic = (apiKey: string, workspaceId?: string) =>
  createAnthropic({ apiKey, ...(workspaceId ? { headers: { 'anthropic-workspace-id': workspaceId } } : {}) })(ANTHROPIC_MODEL);

const gatewayConfigured = () =>
  Boolean(process.env.AI_GATEWAY_MODEL && (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN));

/** Whether the owner has connected a model: their Anthropic key, or AI Gateway */
export function ownerLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) || gatewayConfigured();
}

/**
 * The model for this request: the reader's own key when they sent one, then
 * the owner's Anthropic key, then the owner's AI Gateway, otherwise null
 */
export function llmFor(request: Request): LlmConnection | null {
  const visitorKey = request.headers.get(VISITOR_KEY_HEADER)?.trim();
  if (visitorKey) return { model: anthropic(visitorKey), via: 'visitor' };
  if (process.env.ANTHROPIC_API_KEY) {
    return { model: anthropic(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_WORKSPACE_ID), via: 'owner' };
  }
  // A plain provider/model string routes through AI Gateway
  if (gatewayConfigured()) return { model: process.env.AI_GATEWAY_MODEL!, via: 'owner' };
  return null;
}
