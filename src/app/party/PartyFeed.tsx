"use client"
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';
import { useBrandColorsContext } from '../contexts/BrandColorsContext';
import { Lightbulb } from '@/app/components/icons';
import DiscoBallScene from '../../components/DiscoBall';
import PageAsterisk from '../components/PageAsterick';
import ScrollRow from '../../components/HorizontalRow';
import ProblemFeed from '../components/problems/ProblemFeed';
import ProjectBelt from '../components/ProjectBelt';
import type { Problem } from '@/lib/worksheet';
import type { ProjectBelt as ProjectBeltData } from '@/lib/project-belt';

// The owner's problems (#748 / #749): cards or a table, each problem opening
// as an article. Then what this site has released, to take into your own
// repo (#454)
const PartyFeed = ({ releases }: { releases: ProjectBeltData | null }) => {
  const { colorValue: themeColorValue } = useTheme();
  const { brandColors } = useBrandColorsContext();
  // A saved brand palette (ImportColorsCssModal's "Save to account") wins over the theme
  const colorValue = brandColors?.primary || themeColorValue;
  const { data, loading } = useFetch<{ problems: Problem[] }>('/api/problem/mine');
  const problems = data?.problems ?? [];

  return (
    <main className="w-full pt-8">
      <div className="mx-auto mb-6 max-w-5xl text-left">
        <div
          className="mb-4 inline-flex items-center gap-3 rounded-full border px-4 py-2"
          style={{ borderColor: colorValue, backgroundColor: `${colorValue}10` }}
        >
          <Lightbulb size={18} strokeWidth={1.2} color={colorValue} />
          <div className="h-4 w-px" style={{ backgroundColor: colorValue, opacity: 0.3 }} />
          <span className="font-vt323 text-sm text-[var(--foreground)] opacity-70">
            {loading ? '…' : `${problems.length} problem${problems.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <h1 className="font-vt323 text-3xl font-bold uppercase text-[var(--foreground)]">your problems.</h1>
      </div>

      {!loading && <ProblemFeed problems={problems} color={colorValue} newHref="/waitlist/apply" />}

      {releases && (
        <section className="mx-auto mt-12 max-w-5xl text-left">
          <h2 className="font-vt323 text-3xl font-bold uppercase text-[var(--foreground)]">take what&apos;s released.</h2>
          <ProjectBelt belt={releases} fill color={colorValue} className="mt-4" label="releases to take into your own repo" />
        </section>
      )}

      <ScrollRow
        items={[
          <PageAsterisk key="page-asterisk" />,
          <DiscoBallScene key="disco-ball-scene" />
        ]}
        moreLink="/party"
        maxItems={5}
      />
    </main>
  );
};

export default PartyFeed;
