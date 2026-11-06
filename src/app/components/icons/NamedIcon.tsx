'use client';

import { iconByName } from './byName';
import type { HandDrawnIconProps } from './HandDrawnIcon';

/**
 * A hand-drawn icon named as data ('Rocket'): the first of `name` and its
 * fallbacks that exists, or nothing. For content that names its icon (a
 * hero's metadata.icon, a step's icon, a poem's), so a component renders
 * `<NamedIcon name={…} />` instead of looking the icon up itself.
 *
 * iconByName returns a module export, the same component every time for a
 * name, so rendering what it returns never remounts anything. React's
 * compiler can't see that from here, which is why its static-components rule
 * is set aside for this one line rather than at each place an icon is named.
 */
export default function NamedIcon({ name, fallback, ...props }: HandDrawnIconProps & { name?: string; fallback?: string | Array<string | undefined> }) {
  const Icon = [name, ...(Array.isArray(fallback) ? fallback : [fallback])].map(iconByName).find(Boolean) ?? null;
  if (!Icon) return null;
  // eslint-disable-next-line react-hooks/static-components -- a module export, the same component for a name (see above)
  return <Icon {...props} />;
}

/** Whether `name` (or one of its fallbacks) is a hand-drawn icon */
export const hasNamedIcon = (name?: string, ...fallback: Array<string | undefined>) => [name, ...fallback].some((n) => iconByName(n));
