import { NextResponse } from 'next/server';
import { listProjects } from '@/lib/projects';
import { projectAbout } from '@/lib/project-about';

// One project's about (AboutComponent), built with the site like its belt
// (/api/belt): the stories, docs and path are read on the server, and a page
// loads only its own
export const dynamic = 'force-static';

export function generateStaticParams() {
  return listProjects().map((project) => ({ project: project.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  return NextResponse.json({ sections: await projectAbout(project) });
}
