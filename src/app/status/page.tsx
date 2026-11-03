import type { Metadata } from 'next';
import BuildStatus from '../components/BuildStatus';
import PriorityRows from './PriorityRows';
import { generateStatusFromPriorityScores } from '../../utils/buildStatusParser';
import { getUnpppPriorityData } from '../../utils/unpppPriority';
import { generatePageMetadata } from '../utils/ogMetadata';
import { SITE_TITLE } from '../constants/organization';

export const metadata: Metadata = generatePageMetadata({
  title: `STATUS | ${SITE_TITLE}`,
  description: `View all available routes, build statistics, and priorities for ${SITE_TITLE}, the app you build yourself.`,
  category: 'BUILD',
  coverId: 'cover-003',
  path: '/status',
});

export const revalidate = 300;

export default async function StatusPage() {
  const buildData = await generateStatusFromPriorityScores();
  const priorityData = getUnpppPriorityData();

  return (
    <main className="mx-auto w-full max-w-5xl">
    <div className="flex w-full flex-col gap-4 px-4 md:gap-6">
        {/* Status Component */}
        <BuildStatus data={buildData} showNavigation={true} />

        {/* The unppps by priority, as the house table */}
        <section className="mt-8" aria-label="UNPPP priority">
          <p className="font-google-sans-code text-[10px] uppercase tracking-wide md:text-xs" style={{ color: 'var(--text-muted)' }}>unppp priority.</p>
          <p className="mb-4 mt-1 font-space-grotesk text-sm text-[var(--foreground)]">
            ranked by dev investment, price, GitHub activity and commit velocity.
          </p>
          <PriorityRows entries={priorityData} />
        </section>
      </div>
    </main>
  );
}
