'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import EditorialSection from './editorial/EditorialSection';
import ActionPill from './build-yours/ActionPill';
import { Download, X } from './icons';
import type { BeltRelease } from '@/lib/project-belt';

/**
 * ReleasesModal - what the belt's releases pill opens: each release with the
 * component it pairs with running live, then "take it" or "nah". Taking one
 * copies a prompt for the visitor's own LLM, which stores the release's files
 * in their repo (releases/<prefix>/<version>/), and shows what was copied.
 * "nah" closes. Loaded only when the pill is tapped (ProjectBelt), so the
 * component registry stays out of every page.
 */
export default function ReleasesModal({ releases, color, onClose }: { releases: BeltRelease[]; color?: string; onClose: () => void }) {
  const { colorValue: themeColor } = useTheme();
  const colorValue = color ?? themeColor;
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const take = async (release: BeltRelease) => {
    try {
      await navigator.clipboard.writeText(release.prompt);
    } catch {
      // No clipboard (an insecure origin, or denied): the prompt still shows below to copy by hand
    }
    setCopied(release.tag);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="releases" className="fixed inset-0 z-[60] overflow-y-auto p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--background)' }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative mx-auto my-8 w-full max-w-4xl rounded-xl border p-6 sm:p-8" style={{ borderColor: colorValue, backgroundColor: 'var(--background)' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close releases"
          className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-[var(--background-highlight)]"
        >
          <X size={20} color="var(--text-muted)" />
        </button>

        {releases.map((release, i) => (
          <article key={release.tag} className={i > 0 ? 'mt-12 border-t pt-10' : ''} style={i > 0 ? { borderColor: colorValue } : undefined}>
            <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              v{release.version}
            </p>
            <h2 className="mt-1 font-google-sans-code text-2xl font-bold text-[var(--foreground)]">{release.name}</h2>
            {release.summary && <p className="mt-3 max-w-2xl text-[var(--foreground)]">{release.summary}</p>}

            {release.component && (
              <EditorialSection
                section={{ id: `release-${release.tag}`, type: 'component', metadata: { componentName: release.component.name, componentProps: release.component.props } }}
              />
            )}

            <div className={`build-yours flex flex-wrap items-center gap-2 ${release.component ? '' : 'mt-6'}`}>
              <ActionPill
                verb="take it"
                note={copied === release.tag ? 'copied' : `v${release.version}`}
                onClick={() => take(release)}
                icon={Download}
                color={colorValue}
                label={`Take ${release.name} v${release.version}: copies a prompt for your LLM to store it in your repo`}
              />
              <ActionPill verb="nah" onClick={onClose} icon={X} color={colorValue} variant="line" label="Nah: close releases" delayMs={600} />
              <Link href={release.href} className="ml-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] underline-offset-4 hover:underline">
                notes
              </Link>
            </div>

            {copied === release.tag && (
              <div className="mt-4">
                <p className="font-google-sans-code text-xs text-[var(--text-muted)]">Paste this to your LLM in your own copy:</p>
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border p-4 font-google-sans-code text-xs text-[var(--foreground)]" style={{ borderColor: colorValue }}>
                  {release.prompt}
                </pre>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>,
    document.body
  );
}
