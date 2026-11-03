import { MessageCircle, Drill, PlaneTakeoff, BugPlay, Brackets, AppWindow } from '@/app/components/icons';

import { SITE_WIDGETS } from '@/app/constants/organization';
import { BUILD_SPACE, SPACES } from '@/app/constants/pageNav';

import type { HandDrawnIconComponent } from '@/app/components/icons';

/**
 * The widget tray (#560): first the site's own spaces, then any outside apps
 * the owner lists. A space is a page of this site. Party and admin need
 * sign-in, so a visitor who can't open one gets its demo in the panel
 * (components/space-demo), built from this copy's own data; build is public
 * and always opens
 */
export interface SpaceWidget {
  kind: 'space';
  id: string;      // stable key, used in aria ids
  label: string;   // Badge text in panel header + trigger aria-label
  icon: HandDrawnIconComponent;
  href: string;
  // Who opens the page itself: anyone, anyone signed in, or an admin. The rest
  // see the demo
  opens: 'anyone' | 'signed-in' | 'admin';
}

/** An outside app, framed in the panel (FoundersConfig.json apps.widgets) */
export interface FrameWidget {
  kind: 'frame';
  id: string;
  label: string;
  title: string;   // iframe title attribute
  icon: HandDrawnIconComponent;
  src: string;     // iframe URL — mounted only while the panel is open
}

export type WidgetConfig = SpaceWidget | FrameWidget;

// The spaces, with the labels and hand-drawn icons they have everywhere else
// (constants/pageNav)
const OPENS: Record<string, SpaceWidget['opens']> = { party: 'signed-in', admin: 'admin', build: 'anyone' };
const SPACE_WIDGETS: SpaceWidget[] = [...SPACES, BUILD_SPACE].map((space) => ({
  kind: 'space',
  id: space.label,
  label: space.label,
  icon: space.icon,
  href: space.href,
  opens: OPENS[space.label] ?? 'signed-in',
}));

// Icon names FoundersConfig.json's apps.widgets can use; anything else shows
// a plain app window
const WIDGET_ICONS: Record<string, HandDrawnIconComponent> = {
  'message-circle': MessageCircle,
  'drill': Drill,
  'plane-takeoff': PlaneTakeoff,
  'bug-play': BugPlay,
  'brackets': Brackets,
};

// The dock is designed for at most 6 items — beyond that the expanded stack
// outgrows short mobile viewports — so the owner's apps fill what's left
export const WIDGETS: WidgetConfig[] = [
  ...SPACE_WIDGETS,
  ...SITE_WIDGETS.slice(0, 6 - SPACE_WIDGETS.length).map((widget): FrameWidget => ({
    kind: 'frame',
    ...widget,
    icon: WIDGET_ICONS[widget.icon] ?? AppWindow,
  })),
];
