'use client';
import { useEffect } from 'react';
import Chat from '../components/Chat';
import AuthorAvatar from '../components/editorial/AuthorAvatar';
import { FOUNDER } from '../constants/organization';
import { authorImageOf } from '@/lib/author-image';
import { useTheme } from '../contexts/ThemeContext';
import { useUserTracking } from '../hooks/useUserTracking';

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
      {/* TODO: SHOULD READ FROM FOUNDERSCONFIG SO THERE IS NOT HARDCODED COPY HERE */}
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
              {/* The owner's avatar (/admin → Your avatar), where /founders' "work with me" leads */}
              <AuthorAvatar src={authorImageOf(undefined) ?? '/logo.png'} alt={FOUNDER.name} />
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


    </main>
  );
}
