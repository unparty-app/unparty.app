'use client';

import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../contexts/ThemeContext';

interface MermaidDiagramProps {
  content: string;
}

// A diagram this much wider than its frame is shown at its own size, in a
// track that scrolls sideways, instead of shrunk until its words can't be read
const SCROLL_PAST = 1.6;

/** A CSS color (a variable's value, a hex) as [r, g, b], read through the browser */
function rgbOf(color: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = color;
  document.body.appendChild(probe);
  const [r, g, b] = (getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).map(Number);
  probe.remove();
  return [r, g, b];
}

const hex = ([r, g, b]: [number, number, number]) => `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;

/** `amount` of `color` over `base`, as a solid color mermaid can use */
const mix = (color: [number, number, number], base: [number, number, number], amount: number) =>
  hex([0, 1, 2].map((i) => base[i] + (color[i] - base[i]) * amount) as [number, number, number]);

/**
 * Inline mermaid for ```mermaid fences in article markdown (the generic code
 * section would show the diagram's source as text). Drawn in the site's own
 * colors: the theme color for borders and lines, nodes tinted with it, the
 * page's background and text, in Google Sans Code; redrawn when the theme
 * changes. Wide diagrams (a long journey) keep their size and scroll sideways.
 * If mermaid can't read it, the source shows instead.
 */
export default function MermaidDiagram({ content }: MermaidDiagramProps) {
  const { colorValue } = useTheme();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [wide, setWide] = useState(false);
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    const box = diagramRef.current;
    if (!content || !box) return;
    let cancelled = false;

    const render = async () => {
      try {
        const root = getComputedStyle(document.documentElement);
        const background = rgbOf(root.getPropertyValue('--background').trim() || '#111');
        const foreground = rgbOf(root.getPropertyValue('--foreground').trim() || '#eee');
        const muted = root.getPropertyValue('--text-muted').trim() || hex(foreground);
        const accent = rgbOf(colorValue);
        const tint = mix(accent, background, 0.14);
        const faint = mix(accent, background, 0.07);

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: '"Google Sans Code", ui-monospace, monospace',
          flowchart: { curve: 'basis', padding: 14 },
          // A journey's sections in the theme color (its actors are colored
          // after drawing, below)
          journey: {
            sectionFills: [mix(accent, background, 0.18), mix(accent, background, 0.1)],
            sectionColours: [hex(foreground)],
          },
          themeVariables: {
            darkMode: true,
            fontSize: '14px',
            background: hex(background),
            mainBkg: tint,
            primaryColor: tint,
            primaryTextColor: hex(foreground),
            primaryBorderColor: colorValue,
            secondaryColor: faint,
            tertiaryColor: faint,
            nodeBorder: colorValue,
            lineColor: mix(accent, background, 0.75),
            textColor: hex(foreground),
            titleColor: hex(foreground),
            edgeLabelBackground: hex(background),
            clusterBkg: faint,
            clusterBorder: mix(accent, background, 0.4),
            noteBkgColor: faint,
            noteTextColor: hex(foreground),
            // A journey's sections and its smiling faces
            ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`fillType${i}`, mix(accent, background, i % 2 ? 0.1 : 0.18)])),
            faceColor: colorValue,
            actorBkg: tint,
            actorBorder: colorValue,
            actorTextColor: hex(foreground),
            labelTextColor: muted,
          },
        });

        const { svg } = await mermaid.render(id, content);
        if (cancelled || !diagramRef.current) return;
        diagramRef.current.innerHTML = svg;

        // A journey's actors keep mermaid's own green and lime whatever
        // journey.actorColours says (mermaid 11.15), so they're recolored here
        const actorColors = [colorValue, mix(accent, background, 0.5), hex(foreground)];
        diagramRef.current.querySelectorAll('circle[class^="actor-"]').forEach((circle) => {
          const n = Number(circle.getAttribute('class')?.split('-')[1]) || 0;
          circle.setAttribute('fill', actorColors[n % actorColors.length]);
        });

        // Its own width, from the viewBox, against the frame's
        const drawn = diagramRef.current.querySelector('svg');
        const natural = drawn?.viewBox?.baseVal?.width ?? 0;
        // (the frame, not the box: the box is hidden until it's drawn)
        const frame = diagramRef.current.parentElement?.clientWidth ?? 0;
        const isWide = frame > 0 && natural > frame * SCROLL_PAST;
        if (drawn) {
          drawn.removeAttribute('height');
          drawn.style.height = 'auto';
          drawn.style.maxWidth = isWide ? 'none' : `${natural}px`;
          drawn.style.width = isWide ? `${natural}px` : '100%';
        }
        setWide(isWide);
        setStatus('ready');
      } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        if (!cancelled) setStatus('error');
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [content, id, colorValue]);

  return (
    <figure
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: `${colorValue}26`, backgroundColor: `${colorValue}08` }}
      aria-busy={status === 'loading'}
    >
      <div className="overflow-x-auto p-4 sm:p-6">
        {status === 'loading' && (
          <div className="h-40 animate-pulse rounded-lg" style={{ backgroundColor: `${colorValue}0d` }} aria-hidden />
        )}
        {status === 'error' && (
          <pre className="overflow-x-auto font-geist-mono-google text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {content}
          </pre>
        )}
        <div ref={diagramRef} className={status === 'ready' ? 'block [&_svg]:block' : 'hidden'} />
      </div>
      {wide && status === 'ready' && (
        <figcaption className="border-t px-4 py-2 font-google-sans-code text-[10px] uppercase tracking-wide sm:px-6" style={{ borderColor: `${colorValue}1a`, color: 'var(--text-muted)' }}>
          scroll sideways to follow it →
        </figcaption>
      )}
    </figure>
  );
}
