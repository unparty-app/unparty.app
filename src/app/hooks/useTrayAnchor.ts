import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export interface TrayAnchor {
  top: number;
  bottom: number;
  left: number;
  /** Distance from the right viewport edge to the trigger's right edge. */
  rightOffset: number;
}

// useLayoutEffect measures before paint (no first-frame misposition) but
// warns during SSR; these trays only position after mount anyway.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Viewport-coordinate anchor for a tray portaled to document.body, measured
 * from its trigger while open (and kept fresh on resize/scroll). Static
 * offsets can't align portaled trays with in-header triggers:
 * .navbar-container's perspective transform shrinks the header contents
 * toward center by a width-dependent amount, so the trigger's *visual* rect
 * must be measured instead.
 */
export function useTrayAnchor(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean
): TrayAnchor | null {
  const [anchor, setAnchor] = useState<TrayAnchor | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        rightOffset: window.innerWidth - rect.right,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, triggerRef]);

  return anchor;
}
