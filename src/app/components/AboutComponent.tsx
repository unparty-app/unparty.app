'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '../constants/organization';
import { findProjectById } from '@/lib/projects';
import { useFetch } from '@/hooks/useFetch';
import type { EditorialSection as EditorialSectionType } from '../constants/editorial-articles/types';
import EditorialSection from './editorial/EditorialSection';
import UnpppSteps from './UnpppSteps';
import UnpppVisitTracker from './UnpppVisitTracker';
import { InkUnderline } from './depend/ink';

/**
 * A project's about (#716): its name and what it is, then the chapters the
 * resume would give it, as article sections (src/lib/project-about.ts):
 * EFFORT. (its hours, and the stories and docs about it over time),
 * STORIES. (where it shows up), DOC. (how it works) and NEXT. (where it
 * leads), then its steps. Built with the site, one small file per project
 * (/api/about/<id>), from what every copy has, so a builder's project tells
 * its story the same way.
 */

interface AboutComponentProps {
  unpppId?: string; // Optional - if not provided, will derive from pathname
  className?: string;
}

const AboutComponent: React.FC<AboutComponentProps> = ({ unpppId, className = "" }) => {
  const pathname = usePathname();
  const project = findProjectById(unpppId || (pathname === '/' ? 'theunpartyapp' : pathname.slice(1)));
  const { data } = useFetch<{ sections: EditorialSectionType[] }>(project ? `/api/about/${project.id}` : null);

  return (
    <div className={`w-full text-left ${className}`}>
      {project && <UnpppVisitTracker unpppId={project.id} />}
      {/* The heading the hubs and /admin use: the name with an ink underline
          in the project's color, then what it is as a sentence */}
      <div>
        <h1 className="font-vt323 text-5xl uppercase leading-none text-[var(--foreground)] sm:text-6xl">{project?.name ?? SITE_NAME}</h1>
        <InkUnderline color={project?.color || '#0C0032'} className="mt-2 h-2 w-28" />
        {project?.description && (
          <p className="mt-4 max-w-2xl font-space-grotesk text-base leading-relaxed text-[var(--foreground)] sm:text-lg">{project.description}</p>
        )}
      </div>

      {/* Each chapter's hero draws its icon in as it would in the article
          (data-hero-sentinel), with its line and chart or rows under it */}
      <div className="mt-12 space-y-6">
        {data?.sections.map((section) => (
          <div key={section.id} className={section.type === 'hero' ? 'pt-10' : undefined} {...(section.type === 'hero' && { 'data-hero-sentinel': section.id })}>
            <EditorialSection section={section} />
          </div>
        ))}
      </div>

      {project && (
        <div className="mt-12">
          <UnpppSteps unpppId={project.id} unppp={{ cover: project.cover, coverVideo: (project as { coverVideo?: string }).coverVideo, color: project.color }} />
        </div>
      )}
    </div>
  );
};

export default AboutComponent;
