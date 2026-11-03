'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import InkStage from '../ink/InkStage';
import { InkLine, InkWord } from '../ink/primitives';
import { penArrowhead, penPath, wobble } from '../ink/pen';
import type { SystemLink, SystemNode } from './types';

interface InkSystemProps {
  hub: SystemNode;
  links: SystemLink[];
  label: string; // What the chart shows, for screen readers
}

const CIRCLE = 48;
const SMALL = 36;
const STROKE_W = 96;
const STROKE_H = 24;

/** Who does what, for screen readers: the arrow says it for everyone else */
const flow = (from: string, to: string, direction: SystemLink['direction']) =>
  direction === 'both' ? `${from} and ${to} talk both ways` : direction === 'in' ? `${to} sends to ${from}` : `${from} sends to ${to}`;

function Circle({ node, size, ring }: { node: SystemNode; size: number; ring: string }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-full border-2" style={{ width: size, height: size, borderColor: ring, backgroundColor: node.cover ? undefined : ring }}>
      {node.cover && <Image src={node.cover} alt="" fill sizes={`${size}px`} className="object-cover" />}
    </span>
  );
}

function Name({ node, beat }: { node: SystemNode; beat: number }) {
  const name = <span className="font-vt323 text-xl leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--theme-color)]">{node.name}</span>;
  return (
    <InkWord as="div" beat={beat} className="min-w-0 self-end">
      {node.href ? <Link href={node.href} className="group block">{name}</Link> : name}
    </InkWord>
  );
}

// On a phone the words get the whole width, under the row they belong to;
// above that they sit beside the circle, under the name
const ROW = 'grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 sm:grid-rows-[auto_auto]';
const BESIDE = 'sm:row-span-2';
const SAYS = 'col-span-3 mt-1 self-start font-space-grotesk text-xs leading-snug text-[var(--text-muted)] sm:col-span-1 sm:col-start-3 sm:mt-0 md:text-sm';

/**
 * How things connect while they run, drawn in ink (components/ink): one spine
 * down from the hub, a pen stroke out to each thing wired to it, and arrowheads
 * for which way things travel, each stroke's words saying what. Something
 * further along hangs off the node it talks to. Where InkPath shows what led to
 * what, this shows what's still connected now.
 *
 * It's rows, so it holds on a phone, where the words drop under their row. The
 * spine is measured from where the last row actually sits.
 */
export default function InkSystem({ hub, links, label }: InkSystemProps) {
  const { colorValue } = useTheme();
  const frameRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLLIElement>(null);
  const [spineEnd, setSpineEnd] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const row = lastRef.current?.querySelector<HTMLElement>('[data-stroke]');
      if (!row) return;
      const box = row.getBoundingClientRect();
      setSpineEnd(box.top - frame.getBoundingClientRect().top + box.height / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  if (links.length === 0) return null;
  const spineX = CIRCLE / 2;

  return (
    <InkStage>
      <div ref={frameRef} role="group" aria-label={label} className="relative text-left">
        {spineEnd !== null && (
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={CIRCLE} height={spineEnd} viewBox={`0 0 ${CIRCLE} ${spineEnd}`} aria-hidden="true">
            <InkLine
              d={penPath(Array.from({ length: 6 }, (_, i) => [spineX + wobble(i + 2, 2), CIRCLE + 2 + (i / 5) * (spineEnd - CIRCLE - 2)] as const))}
              length={spineEnd}
              width={2.2}
            />
          </svg>
        )}

        <div className="flex items-center gap-3">
          <Circle node={hub} size={CIRCLE} ring={colorValue} />
          <Name node={hub} beat={0} />
        </div>

        <ul className="mt-2">
          {links.map((link, index) => {
            const beat = 2 + index * 2;
            const y = STROKE_H / 2;
            const stroke = penPath(Array.from({ length: 5 }, (_, i) => [4 + (i / 4) * (STROKE_W - 8), y + wobble(i + index * 13, 3)] as const));
            const ends = [
              (link.direction === 'in' || link.direction === 'both') && penArrowhead([4, y + wobble(index * 13, 3)], Math.PI),
              (link.direction === 'out' || link.direction === 'both') && penArrowhead([STROKE_W - 4, y + wobble(4 + index * 13, 3)], 0),
            ].filter((end): end is string => !!end);
            return (
              <li key={link.node.name} ref={index === links.length - 1 ? lastRef : undefined} className="mt-5">
                <div style={{ marginLeft: spineX }} className={ROW}>
                  <svg data-stroke viewBox={`0 0 ${STROKE_W} ${STROKE_H}`} className={`h-auto w-16 overflow-visible sm:w-24 ${BESIDE}`} role="img" aria-label={flow(hub.name, link.node.name, link.direction)}>
                    <InkLine d={stroke} beat={beat} length={STROKE_W} width={2} />
                    {ends.map((d) => <InkLine key={d} d={d} beat={beat + 4} length={30} width={2} />)}
                  </svg>
                  <span className={BESIDE}><Circle node={link.node} size={CIRCLE} ring={colorValue} /></span>
                  <Name node={link.node} beat={beat + 2} />
                  <InkWord as="div" beat={beat + 2} className={`${SAYS} pl-3 sm:pl-0`}>{link.says}</InkWord>
                </div>

                {link.then && (
                  <div style={{ marginLeft: spineX }} className={`mt-3 pl-8 sm:pl-[7rem] ${ROW}`}>
                    <svg viewBox="0 0 40 28" className={`h-7 w-10 overflow-visible ${BESIDE}`} role="img" aria-label={flow(link.node.name, link.then.node.name, link.then.direction)}>
                      <InkLine d="M6 0 C5 10 7 15 16 15 L34 15" beat={beat + 3} length={50} width={1.8} />
                      {(link.then.direction === 'out' || link.then.direction === 'both') && <InkLine d={penArrowhead([35, 15], 0, 7)} beat={beat + 5} length={20} width={1.8} />}
                    </svg>
                    <span className={BESIDE}><Circle node={link.then.node} size={SMALL} ring={colorValue} /></span>
                    <Name node={link.then.node} beat={beat + 4} />
                    <InkWord as="div" beat={beat + 4} className={`${SAYS} pl-3 sm:pl-0`}>{link.then.says}</InkWord>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </InkStage>
  );
}
