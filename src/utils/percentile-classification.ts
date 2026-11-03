/** Shared tercile percentile classifier — used by /api/unppp/priority-score
 *  and scripts/priority-count-debug.ts so the two never drift apart. */
export type Classification = 'YAH.' | 'MEH.' | 'NAH.'

export function classifyByPercentile(values: number[], value: number): Classification {
  const sorted = [...values].sort((a, b) => a - b)
  const rank = sorted.filter(v => v <= value).length / sorted.length
  if (rank >= 2 / 3) return 'YAH.'
  if (rank >= 1 / 3) return 'MEH.'
  return 'NAH.'
}
