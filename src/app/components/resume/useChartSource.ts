'use client';

import { useEffect, useState } from 'react';

/**
 * A chart's props, from the embed or from the site owner's live resume: when
 * an embed names a `source` ('shipped', 'stack', 'path'…) instead of carrying
 * its data, the props come from /api/resume, so any article can show the
 * owner's own chart without writing their numbers into it. Null until there
 * is something to draw (or when the owner has nothing for that part).
 */
export function useChartSource<T extends Record<string, unknown>>(props: Record<string, unknown>, has: (props: Record<string, unknown>) => boolean): T | null {
  const source = typeof props.source === 'string' ? props.source : null;
  const own = has(props);
  const [fetched, setFetched] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (own || !source) return;
    let cancelled = false;
    fetch(`/api/resume?part=${encodeURIComponent(source)}`)
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!cancelled && data?.props) setFetched(data.props);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [own, source]);

  if (own) return props as T;
  return fetched ? ({ ...fetched, ...props } as T) : null;
}
