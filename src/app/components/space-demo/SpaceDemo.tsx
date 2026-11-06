'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { SITE_NAME, SITE_TITLE, SITE_URL, FOUNDER, BRAND_COLORS, WAITLIST_ON, PRIVATE_REPOS_ON, CHECKOUT_ON } from '../../constants/organization';
import { listFounderProjects, projectStage } from '@/lib/projects';
import { PATH_STAGES } from '../resume/types';
import type { Problem, ProblemVersion } from '@/lib/worksheet';
import ProblemCard from '../problems/ProblemCard';
import BuildYoursCard from '../build-yours/BuildYoursCard';
import { SettingsGroup, ValueRow, ToggleRow, LinkRow } from '../../admin/components/Settings';
import { MANAGE } from '../../admin/manage';
import type { SpaceWidget } from '../widgetRegistry';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
// How long each beat of a demo waits for the one before it
const BEAT_MS = 450;

/**
 * Counts the demo's beats up to `last`, one every BEAT_MS, so its parts arrive
 * in order. Reduced motion starts at the end: the finished page, still
 */
function useBeats(last: number): number {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is a browser setting the server can't read: the demo jumps to its last beat once mounted
      setBeat(last);
      return;
    }
    const tick = window.setInterval(() => setBeat((b) => (b >= last ? b : b + 1)), BEAT_MS);
    return () => window.clearInterval(tick);
  }, [last]);
  return beat;
}

// A part that arrives on its beat: rising in, the icons in it drawing
// themselves (globals.css .ink-icons) after `--ink-delay`
function Arrive({ at, beat, children, className = '' }: { at: number; beat: number; children: ReactNode; className?: string }) {
  const here = beat >= at;
  return (
    <div
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${here ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} ${className}`}
      style={{ ['--ink-delay' as string]: '120ms' } as CSSProperties}
    >
      {here ? children : null}
    </div>
  );
}

/** The demo's opening: the space's own hand-drawn icon drawing itself, its name, and what it's for */
function DemoHead({ space, title, line }: { space: SpaceWidget; title: string; line: string }) {
  return (
    <header className="flex flex-col gap-3">
      <space.icon size={44} strokeWidth={1.4} themed />
      <p className={LABEL}>
        a look inside {SITE_NAME}&apos;s {space.label}.
      </p>
      <h2 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">{title}</h2>
      <p className="font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] opacity-80">{line}</p>
    </header>
  );
}

// The owner's projects as the problems they grew from: the real ProblemCard,
// each grown as many times as its stage is along the path (an idea hasn't
// grown, a shipped build has, twice). A copy with no projects of its own
// starts from the site itself, as its first problem
function ownProblems(): Problem[] {
  const own = listFounderProjects();
  const seeds = own.length
    ? own
    : [
        {
          id: 'site',
          name: SITE_NAME,
          color: undefined,
          stage: 'idea',
        } as const,
      ];
  return seeds.slice(0, 4).map((project) => {
    const version: ProblemVersion = {
      email: '',
      name: FOUNDER.name,
      ideaName: project.name ?? project.id,
      deadline: '',
      color: project.color,
      answeredQuestions: [],
      submissionId: project.id,
      status: '',
      submittedAt: '',
    };
    const stage = 'source' in project ? projectStage(project) : 'idea';
    const grew = Math.max(0, PATH_STAGES.indexOf(stage));
    return {
      id: project.id,
      ideaName: version.ideaName,
      color: project.color,
      latest: version,
      versions: Array.from({ length: grew + 1 }, () => version),
    };
  });
}

/** /party for a visitor: the owner's problems arriving, then growing into builds */
function PartyDemo({ space }: { space: SpaceWidget }) {
  const { colorValue } = useTheme();
  const problems = ownProblems();
  // Beats: the head, each card, the cards growing, the ask
  const grown = problems.length + 2;
  const beat = useBeats(grown + 1);
  return (
    <>
      <div inert>
        <DemoHead space={space} title="your problems." line={`Work an idea through, and it grows: each version a step closer to a build. These grew into what ${SITE_NAME} is today.`} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {problems.map((problem, i) => (
            <Arrive key={problem.id} at={1 + i} beat={beat}>
              {/* Every card starts as a first version, then grows to where it stands */}
              <ProblemCard problem={beat >= grown ? problem : { ...problem, versions: problem.versions.slice(0, 1) }} fallbackColor={colorValue} />
            </Arrive>
          ))}
        </div>
      </div>
      <Arrive at={grown + 1} beat={beat} className="mt-8">
        <BuildYoursCard fill placement="party-demo" />
      </Arrive>
    </>
  );
}

/** /admin for a visitor: this site's own settings, the switches easing into how they stand */
function AdminDemo({ space }: { space: SpaceWidget }) {
  const manage = MANAGE.slice(0, 5);
  const switches = [
    { title: 'Waitlist', detail: 'who gets into the party', on: WAITLIST_ON },
    {
      title: 'Checkout',
      detail: 'whether projects sell from their pages',
      on: CHECKOUT_ON,
    },
    {
      title: 'Private repos',
      detail: 'what your hours show',
      on: PRIVATE_REPOS_ON,
    },
  ];
  // Beats: the head, your site, the switches, each switch settling, manage, the ask
  const settled = 3 + switches.length;
  const beat = useBeats(settled + 2);
  const noop = () => {};
  return (
    <>
      <div inert>
        <DemoHead space={space} title="admin." line={`Settings for ${SITE_TITLE}. The switches, the services and the data are yours, and only yours.`} />
        <div className="mt-4 flex flex-col">
          <Arrive at={1} beat={beat}>
            <SettingsGroup id="demo-site" label="your site.">
              <ValueRow title="Name" value={SITE_TITLE} />
              <ValueRow title="Address" value={SITE_URL.replace(/^https?:\/\//, '')} />
              <ValueRow
                title="Brand colors"
                value={
                  <span className="flex justify-end gap-1">
                    {BRAND_COLORS.map((c) => (
                      <span key={c} className="size-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                }
              />
            </SettingsGroup>
          </Arrive>
          <Arrive at={2} beat={beat}>
            <SettingsGroup id="demo-switches" label="switches.">
              {/* Each switch starts off, then turns to how it stands on this site */}
              {switches.map((s, i) => (
                <ToggleRow key={s.title} title={s.title} detail={s.detail} on={beat >= 3 + i ? s.on : false} onToggle={noop} />
              ))}
            </SettingsGroup>
          </Arrive>
          <Arrive at={settled} beat={beat} className="ink-icons">
            <SettingsGroup id="demo-manage" label="manage.">
              {manage.map((m, i) => (
                <div
                  key={m.href}
                  style={
                    {
                      ['--ink-delay' as string]: `${i * 180}ms`,
                    } as CSSProperties
                  }
                >
                  <LinkRow href={m.href} icon={m.icon} title={m.label} detail={m.detail} />
                </div>
              ))}
            </SettingsGroup>
          </Arrive>
        </div>
      </div>
      <Arrive at={settled + 2} beat={beat} className="mt-6">
        <BuildYoursCard fill placement="admin-demo" />
      </Arrive>
    </>
  );
}

/**
 * SpaceDemo - a space this visitor can't open yet (#560), shown in the widget
 * tray's panel: what it does, played out with this copy's own data and the
 * real parts of the page (ProblemCard, the settings rows), ending on build
 * yours. The demonstration is to watch, not to use (inert), and a screen
 * reader hears what it shows in a sentence; the build yours ask is live, and
 * under it the site's owner signs in and goes on to `next`, the link that
 * opened the demo (a challenge's SETUP. step, /admin/stories…)
 */
export default function SpaceDemo({ space, next }: { space: SpaceWidget; next?: string }) {
  const summary =
    space.id === 'admin'
      ? `${SITE_TITLE}'s admin: its name, address and brand colors, its switches, and what it manages. Build your own to have yours.`
      : `${SITE_NAME}'s party: problems worked through until they grew into builds. Build your own to have yours.`;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">
      <p className="sr-only">{summary}</p>
      <div className="ink-icons">{space.id === 'admin' ? <AdminDemo space={space} /> : <PartyDemo space={space} />}</div>
      {/* The site's owner, on a new device or signed out: sign in, and go on to
          where they were heading */}
      <Link
        href={`/sign-in?redirect_url=${encodeURIComponent(next ?? space.href)}`}
        className="mt-6 inline-flex items-center gap-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
      >
        this is your site? sign in →
      </Link>
    </div>
  );
}
