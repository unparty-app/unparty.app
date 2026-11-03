import { NextResponse } from 'next/server';
import { projectBelts } from '@/lib/project-belt';

// One project's belt (StatsLayoutWrapper), built with the site: a page loads
// only its own instead of every project's riding along in every page's HTML
export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(projectBelts()).map((project) => ({ project }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const belt = projectBelts()[project];
  return belt ? NextResponse.json(belt) : NextResponse.json({ error: 'No such project' }, { status: 404 });
}
