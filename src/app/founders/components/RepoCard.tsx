'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock } from '@/app/components/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { processLanguages } from '@/utils/language-calculations';
import { getUnpppForRepoName } from '@/utils/unppp-repo-mapping';
import Badge from '../../components/Badge';
import type { MergedRepo } from '../founder-data';

interface RepoCardProps {
  repo: MergedRepo;
}

/**
 * Repository card sized for the article ScrollRow (280px items), rendered
 * with the unppp card convention from `/unppp/[type]`: repos are mapped to
 * unppps via UnpppsConfig.json, so cards reuse the unppp cover, color and
 * name, and link to both the internal unppp page and the GitHub repo.
 * Repos without a unppp mapping fall back to a compact GitHub-only card.
 */
export default function RepoCard({ repo }: RepoCardProps) {
  const { colorValue } = useTheme();
  const { meta, live } = repo;

  const releases = meta.enhanced_metrics?.releases_count ?? live?.totalReleases ?? 0;
  const commits30d = meta.enhanced_metrics?.time_bounded_commits?.commits_last_30_days ?? 0;
  const contributors = meta.enhanced_metrics?.contributors_count ?? 0;
  const isPrivate = live?.isPrivate ?? meta.visibility === 'private';
  const description = live?.description || meta.description;
  const url = live?.url || meta.url;

  const unppp = useMemo(() => getUnpppForRepoName(meta.name), [meta.name]);
  const repoColor = unppp?.color && unppp.color !== 'null' ? unppp.color.trim() : colorValue;
  const repoCover = unppp?.cover && unppp.cover !== 'null' ? unppp.cover : null;

  const languageBar = useMemo(() => {
    if (live?.languages?.length) return live.languages;
    return processLanguages(meta.enhanced_metrics?.languages_detail ?? {}).map(lang => ({
      name: lang.name,
      percentage: lang.percentage,
      color: lang.color,
    }));
  }, [live, meta]);

  const statsLine = `${commits30d} c/30d · ${releases} shipped · ${contributors} ${contributors === 1 ? 'builder' : 'builders'}`;

  // Fallback: repos without a unppp mapping keep the compact GitHub-only card
  if (!unppp) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block h-full rounded-xl border border-border bg-background p-4 transition-all duration-300 hover:shadow-md"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            className="font-google-sans-code text-xs font-bold uppercase leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            {meta.name}
          </h3>
          {isPrivate && <Lock size={12} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}
        </div>

        {description && (
          <p
            className="mb-3 line-clamp-2 font-space-grotesk text-xs leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>
        )}

        <div className="mb-3 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
          {statsLine}
        </div>

        {languageBar.length > 0 && (
          <div
            className="flex h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--background-highlight)' }}
          >
            {languageBar.slice(0, 3).map(lang => (
              <div
                key={lang.name}
                style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
        )}

        <div
          className="absolute inset-x-4 -top-px h-0.5 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundColor: colorValue }}
        />
      </a>
    );
  }

  // unppp card: cover + colored body, linking to the internal unppp page
  // (overlay Link) with a separate GitHub anchor layered above it.
  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200"
      style={{ borderColor: `${repoColor}40` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = repoColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${repoColor}40`;
      }}
    >
      <Link
        href={`/${unppp.id}`}
        aria-label={`View ${meta.name} unppp page`}
        className="absolute inset-0 z-0"
      />

      {/* Cover Image - clean, no overlay */}
      {repoCover && (
        <div className="pointer-events-none relative h-[130px] flex-shrink-0 overflow-hidden">
          <Image
            src={`/covers/${repoCover}.png`}
            alt={meta.name}
            fill
            sizes="280px"
            loading="lazy"
            className="object-cover"
          />
        </div>
      )}

      {/* Card Body */}
      <div
        className="pointer-events-none flex flex-1 flex-col gap-3 p-4"
        style={{ backgroundColor: repoColor }}
      >
        {/* Repo Name */}
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="primary"
            size="lg"
            style={{
              borderColor: repoColor,
              color: 'var(--foreground)',
              backgroundColor: repoColor,
            }}
          >
            {meta.name}
          </Badge>
          {isPrivate && (
            <Lock size={12} className="mt-1 shrink-0" style={{ color: 'var(--background)' }} />
          )}
        </div>

        {description && (
          <p
            className="line-clamp-2 font-space-grotesk text-xs leading-relaxed"
            style={{ color: 'var(--background)' }}
          >
            {description}
          </p>
        )}

        {/* Stats */}
        <div className="font-vt323 text-sm" style={{ color: 'var(--background)' }}>
          {statsLine}
        </div>

        {languageBar.length > 0 && (
          <div
            className="flex h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--background-highlight)' }}
          >
            {languageBar.slice(0, 3).map(lang => (
              <div
                key={lang.name}
                style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
        )}

        {/* CTAs: internal unppp page + GitHub */}
        <div
          className="mt-auto flex items-center justify-between gap-2 text-sm font-google-sans-code font-medium"
          style={{ color: 'var(--background)' }}
        >
          <span className="flex items-center gap-2">
            <span>MORE.</span>
            <svg
              className="size-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto relative z-10 underline-offset-2 hover:underline"
            aria-label={`View ${meta.name} on GitHub`}
          >
            GITHUB.
          </a>
        </div>
      </div>
    </div>
  );
}
