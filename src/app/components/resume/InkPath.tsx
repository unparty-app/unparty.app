'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import InkStage, { BEAT_MS, inkDuration } from '../ink/InkStage';
import { InkLine, InkSweep, InkWord } from '../ink/primitives';
import { penArrowhead, penRainbow, penRainbowArrival } from '../ink/pen';
import { PATH_STAGES, type PathStop } from './types';

interface InkPathProps {
  stops: PathStop[];
  label: string; // What the chart shows, for screen readers
  focus?: string; // The project that breathes; the one furthest along when missing
  highlight?: string[]; // Keep these bright and dim the rest (a recommended path)
}

const CIRCLE = 56;
const MAX_ARC = 120; // The tallest an arc gets, so the chart stays short

/**
 * Where each project stands and where it leads, drawn in ink
 * (components/ink), edge to edge: one row of the house cover circles, grouped
 * by stage (idea, building, shipped, selling, in that order, each named under
 * a rule beneath its group), and an
 * arc over the row from a project to each one it leads to, as tall as the
 * distance it covers, ending in an arrowhead. The circles arrive left to
 * right, the stage rules sweep in under them, then the arcs draw. The
 * project furthest along breathes, or `focus`; `highlight` keeps a set of
 * projects bright and dims the rest, for a recommended path. Wider than the screen, the row swipes.
 *
 * The arcs are measured from where the circles actually sit, so they hold at
 * any width.
 */
export default function InkPath({ stops, label, focus, highlight }: InkPathProps) {
  const { colorValue } = useTheme();
  const frameRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef(new Map<string, HTMLElement>());
  const [geometry, setGeometry] = useState<{ width: number; height: number; centers: Map<string, [number, number]> } | null>(null);

  // Along the row: stage by stage, and within a stage, following the path
  // (projects nothing leads to first, then where each leads), so linked
  // projects sit near each other and the arcs stay low
  const order = new Map<string, number>();
  const visit = (id: string) => {
    if (order.has(id)) return;
    order.set(id, order.size);
    stops.find(stop => stop.id === id)?.leadsTo?.forEach(visit);
  };
  stops.filter(stop => !stops.some(other => other.leadsTo?.includes(stop.id))).forEach(stop => visit(stop.id));
  stops.forEach(stop => visit(stop.id));
  const stages = PATH_STAGES.filter(stage => stops.some(stop => stop.stage === stage)).map(stage => ({
    stage,
    stops: stops.filter(stop => stop.stage === stage).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
  }));
  const furthest = focus ?? stages[stages.length - 1]?.stops[0]?.id;
  const lit = (id: string) => !highlight || highlight.includes(id);
  const links = stops.flatMap(stop =>
    (stop.leadsTo ?? []).filter(to => stops.some(other => other.id === to)).map(to => ({ from: stop.id, to }))
  );

  const measure = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    const centers = new Map<string, [number, number]>();
    circleRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      centers.set(id, [rect.left - box.left + rect.width / 2, rect.top - box.top + rect.height / 2]);
    });
    setGeometry({ width: box.width, height: box.height, centers });
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [measure]);

  if (stops.length === 0) return null;

  // Room above the row for the tallest arc: an arc starts just above its
  // circle (CIRCLE / 2 + 6 over its center) and rises its height from there
  const arcHeight = (from: [number, number], to: [number, number]) => Math.min(MAX_ARC, 24 + Math.abs(to[0] - from[0]) * 0.28);
  const headroom = geometry
    ? Math.max(32, ...links.map(({ from, to }) => {
        const a = geometry.centers.get(from);
        const b = geometry.centers.get(to);
        return a && b ? arcHeight(a, b) : 0;
      }))
    : MAX_ARC;
  let position = 0;

  return (
    <InkStage>
      <div className="w-screen mx-[calc(50%-50vw)] overflow-x-auto px-4 sm:px-6 lg:px-12">
        <div ref={frameRef} className="relative mx-auto w-max min-w-full" role="group" aria-label={label} style={{ paddingTop: headroom + 16 }}>
          <div className="flex w-max min-w-full justify-between gap-x-10">
            {stages.map(({ stage, stops: inStage }, column) => (
              <div key={stage}>
                <ul className="flex gap-8">
                  {inStage.map(stop => {
                    const ring = stop.color || colorValue;
                    const beat = column + 1 + position++ * 0.8;
                    const body = (
                      <>
                        <span
                          ref={el => {
                            if (el) circleRefs.current.set(stop.id, el);
                            else circleRefs.current.delete(stop.id);
                          }}
                          className="relative block shrink-0 rounded-full border-2"
                          style={{ width: CIRCLE, height: CIRCLE, borderColor: ring, backgroundColor: stop.cover ? undefined : ring }}
                        >
                          {stop.id === furthest && <span aria-hidden className="ink-now ink-now--soft absolute -inset-1 rounded-full border-2" style={{ borderColor: ring }} />}
                          {stop.cover && (
                            <span className="absolute inset-0 overflow-hidden rounded-full">
                              <Image src={stop.cover} alt="" fill sizes={`${CIRCLE}px`} className="object-cover" />
                            </span>
                          )}
                        </span>
                        <span className="block w-28">
                          <span className="block truncate font-vt323 text-xl leading-tight transition-colors group-hover:text-[var(--theme-color)]" style={{ color: 'var(--foreground)' }}>
                            {stop.name}
                          </span>
                          {stop.tagline && (
                            <span className="block truncate font-space-grotesk text-xs" style={{ color: 'var(--text-muted)' }}>
                              {stop.tagline}
                            </span>
                          )}
                        </span>
                      </>
                    );
                    return (
                      <li key={stop.id} className="transition-opacity duration-500 motion-reduce:transition-none" style={{ opacity: lit(stop.id) ? 1 : 0.28 }}>
                        <InkWord as="div" beat={beat}>
                          {stop.href ? (
                            <Link href={stop.href} className="group flex flex-col items-start gap-3">
                              {body}
                            </Link>
                          ) : (
                            <div className="flex flex-col items-start gap-3">{body}</div>
                          )}
                        </InkWord>
                      </li>
                    );
                  })}
                </ul>
                {/* The stage, under its group: a rule sweeping across it, then its name */}
                <InkSweep beat={column + 1} className="mt-5 h-px" style={{ backgroundColor: colorValue, opacity: 0.45 }}>
                  <span />
                </InkSweep>
                <InkWord as="div" beat={column + 2} className="mt-2 font-vt323 text-lg uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {stage}.
                </InkWord>
              </div>
            ))}
          </div>

          {geometry && links.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={geometry.width}
              height={geometry.height}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              aria-hidden="true"
            >
              {links.map(({ from, to }, index) => {
                const a = geometry.centers.get(from);
                const b = geometry.centers.get(to);
                if (!a || !b) return null;
                // From the top of one circle to the top of the other, over the row
                const lift = CIRCLE / 2 + 6;
                const toRight = b[0] > a[0];
                const start: [number, number] = [a[0] + (toRight ? 8 : -8), a[1] - lift];
                const end: [number, number] = [b[0] + (toRight ? -8 : 8), b[1] - lift];
                const height = arcHeight(a, b);
                const beat = stages.length + 1 + stops.length * 0.8 + index * 1.2;
                const length = Math.abs(end[0] - start[0]) + height * 1.5;
                return (
                  <g key={`${from}-${to}`}>
                    <InkLine d={penRainbow(start, end, height)} beat={beat} length={length} width={1.8} opacity={lit(from) && lit(to) ? 0.75 : 0.15} />
                    <InkLine
                      d={penArrowhead(end, penRainbowArrival(start, end, height))}
                      beat={beat + inkDuration(length) / BEAT_MS}
                      length={30}
                      width={1.8}
                      opacity={lit(from) && lit(to) ? 0.75 : 0.15}
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </InkStage>
  );
}
