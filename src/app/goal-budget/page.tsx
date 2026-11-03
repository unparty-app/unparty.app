import { Metadata } from 'next';
import GoalBudget from '../components/GoalBudget';
import { SITE_TITLE } from '../constants/organization';
import { ogImageUrl } from '../utils/ogMetadata';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = ogImageUrl({
    title: 'GOAL.',
    subtitle: 'THINK. PLAN. BUILD. Pick a goal, see what it costs on top of your stack, and tick off the steps that get you there.',
    category: 'TOOL',
  });

  return {
    title: `GOAL. | ${SITE_TITLE}`,
    description: 'Pick something to build or a plan to grow into, see what it costs on top of the stack you run, and tick off the SETUP. steps that get you there.',
    openGraph: {
      title: 'GOAL.',
      description: 'THINK. PLAN. BUILD. Pick a goal, see what it costs on top of your stack, and tick off the steps that get you there.',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Goal Budget Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'GOAL.',
      description: 'THINK. PLAN. BUILD.',
      images: [ogImage],
    },
  };
}

export default function GoalBudgetPage() {
  return (
    <main className="mx-auto w-full max-w-5xl">
      <GoalBudget />
    </main>
  );
}
