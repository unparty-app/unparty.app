'use client';
import { useEffect } from 'react';
import Chat from '../components/Chat';
import AuthorAvatar from '../components/editorial/AuthorAvatar';
import { useTheme } from '../contexts/ThemeContext';
import { useUserTracking } from '../hooks/useUserTracking';

const ThemeDivider = ({ colorValue }: { colorValue: string }) => (
  <div className="flex w-screen items-center gap-3 mx-[calc(50%-50vw)]">
    <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: colorValue }} />
    <div className="flex shrink-0 items-center gap-2">
      <div className="size-2 rounded-full" style={{ backgroundColor: colorValue }} />
      <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: colorValue }} />
      <div className="size-2 rounded-full" style={{ backgroundColor: colorValue }} />
    </div>
    <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: colorValue }} />
  </div>
);

const STATS = [
  {
    eyebrow: 'BUILD ME',
    value: 'ABOUT',
    unit: 'UNPARTY',
    narrative: 'you want to build unparty.app together.',
  },
  {
    eyebrow: 'CONNECT ME',
    value: 'BUILD',
    unit: 'TOGETHER',
    narrative: 'you want to learn about building your own unparty.app.',
  },
  {
    eyebrow: 'LEARN ME',
    value: 'CONNECT',
    unit: 'SOLUTIONS',
    narrative: 'you want to explore your own ideas.',
  },
];

export default function Connect() {
  const { colorValue } = useTheme();
  const { trackPillarUsage } = useUserTracking();

  useEffect(() => {
    // Track that user accessed the CONNECT pillar
    trackPillarUsage({
      pillar: 'CONNECT',
      action: 'page_visit',
      metadata: {
        timestamp: new Date(),
        page: '/connect'
      }
    });
  }, [trackPillarUsage]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 py-8">
      {/* Theme divider */}
      <ThemeDivider colorValue={colorValue} />

      {/* Hero */}
      <header className="space-y-4 text-left">
        <p
          className="font-vt323 text-xs font-bold uppercase tracking-widest"
          style={{ color: colorValue }}
        >
          CONNECT.
        </p>
        <h1
          className="font-vt323 text-3xl font-bold leading-none tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          style={{ color: colorValue }}
        >
          starting somewhere.
        </h1>
        <p
          className="max-w-2xl font-space-grotesk text-sm leading-relaxed md:text-base"
          style={{ color: 'var(--text-muted)' }}
        >
          The first hello to a stranger is always the most awkward one, but we do have to start somewhere.
        </p>
      </header>

      {/* Conversation */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 overflow-hidden rounded-full p-1 shadow-sm"
            style={{ backgroundColor: 'var(--background)' }}
          >
            <div
              className="size-12 overflow-hidden rounded-full border-2 transition-transform duration-200 hover:scale-105"
              style={{ borderColor: colorValue }}
            >
              <AuthorAvatar src="/covers/cover-001.png" alt="" />
            </div>
          </div>
          <div>
            <h2
              className="font-vt323 text-2xl font-bold leading-tight tracking-tight"
              style={{ color: colorValue }}
            >
              hello! i am human.
            </h2>
           
          </div>
        </div>

        <div
          className="vh-card-elevated rounded-xl border p-6 sm:p-8"
          style={{
            borderColor: `${colorValue}40`,
            backgroundColor: 'var(--background)',
          }}
        >
          <Chat />
        </div>
      </section>

      {/* Stat band */}
      <section
        className="w-screen px-4 py-12 mx-[calc(50%-50vw)] sm:px-6 lg:px-12"
        style={{ backgroundColor: `${colorValue}10` }}
      >
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.eyebrow} className="space-y-2">
              <p
                className="font-vt323 text-xs font-bold uppercase tracking-widest"
                style={{ color: colorValue }}
              >
                {stat.eyebrow}
              </p>
              <p className="font-vt323 text-5xl leading-none md:text-6xl" style={{ color: 'var(--foreground)' }}>
                {stat.value}
                <span className="ml-2 font-vt323 text-lg uppercase" style={{ color: 'var(--text-muted)' }}>
                  {stat.unit}
                </span>
              </p>
              <p className="font-space-grotesk text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>
                {stat.narrative}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing divider */}
      <ThemeDivider colorValue={colorValue} />
    </main>
  );
}
