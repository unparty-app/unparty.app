/**
 * Priority bonus for unppps with at least one admin-linked Step.
 * A dynamic, DB-driven counterpart to the hardcoded CORE_BONUS/PRODUCT_BONUS
 * in unppp-priority-count.ts — see scripts/priority-count-debug.ts for the
 * consumer.
 */

export const STEP_LINK_BONUS = 30

export function getStepLinkPoints(unpppId: string, linkedUnpppIds: Set<string>): number {
  return linkedUnpppIds.has(unpppId) ? STEP_LINK_BONUS : 0
}
