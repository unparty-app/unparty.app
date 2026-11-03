'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUnpppVisitTracking } from '../hooks/useUnpppVisitTracking';

interface UnpppVisitTrackerProps {
  unpppId: string;
}

// Records a visit toward ALL_UNPPPS_VISITED (see api/analytics/unppp-visit),
// but only when the current route is actually that unppp's own page — a
// component that merely displays unppp content under a passed-in id (e.g.
// /about rendering <AboutComponent unpppId="theunpartyapp" />) must not be
// misrecorded as a visit to that unppp. Renders nothing; mount it anywhere
// on a real /theunparty* (or /about-style aliased) page.
const UnpppVisitTracker = ({ unpppId }: UnpppVisitTrackerProps) => {
  const pathname = usePathname();
  const { trackUnpppVisit } = useUnpppVisitTracking();

  useEffect(() => {
    const isOwnRoute = pathname === '/' ? unpppId === 'theunpartyapp' : pathname.slice(1) === unpppId;
    if (isOwnRoute) trackUnpppVisit(unpppId);
  }, [pathname, unpppId, trackUnpppVisit]);

  return null;
};

export default UnpppVisitTracker;
