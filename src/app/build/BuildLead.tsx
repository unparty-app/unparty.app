'use client';

import { useEffect, Suspense } from 'react';
import BuildPortfolio from '../components/portfolio/BuildPortfolio';
import EditorialSection from '../components/editorial/EditorialSection';
import { useUserTracking } from '../hooks/useUserTracking';
import { SITE_NAME } from '../constants/organization';

/**
 * The top of /build, before the story of the work. First the builder's own
 * answer to "why build your own?" (#589): their why story (FoundersConfig
 * founder.why) as its highlights, when they've written it. Then the person's
 * stack and the components they want to make theirs (#1433), which reads the
 * stack from the query string, so it waits in Suspense
 */
export default function BuildLead({ whyCoverId }: { whyCoverId: string | null }) {
  const { trackPillarUsage } = useUserTracking();

  useEffect(() => {
    // Track that user accessed the BUILD pillar
    trackPillarUsage({
      pillar: 'BUILD',
      action: 'page_visit',
      metadata: {
        timestamp: new Date(),
        page: '/build'
      }
    });
  }, [trackPillarUsage]);

  return (
    <>
      {whyCoverId && (
        <>
          <EditorialSection section={{ id: 'why-line', type: 'heading', content: `why build your own ${SITE_NAME}?`, metadata: { line: true } }} isVisible articleSlug="build" />
          <EditorialSection section={{ id: 'why', type: 'component', metadata: { componentName: 'StoryPreview', componentProps: { coverId: whyCoverId } } }} isVisible articleSlug="build" />
        </>
      )}
      <Suspense fallback={null}>
        <BuildPortfolio />
      </Suspense>
    </>
  );
}
