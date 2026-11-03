import * as icons from './index';
import type { HandDrawnIconComponent } from './HandDrawnIcon';

/**
 * A hand-drawn icon by its export name ('Rocket'), for content that names an
 * icon as data: a hero's metadata.icon, and the outline entry it becomes.
 * An unknown name gives null.
 */
export function iconByName(name: string | undefined): HandDrawnIconComponent | null {
  if (!name) return null;
  const icon = (icons as Record<string, unknown>)[name];
  return typeof icon === 'function' ? (icon as HandDrawnIconComponent) : null;
}
