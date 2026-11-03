import { NextResponse, type NextRequest } from 'next/server';
import { CHART_COMPONENT, CHART_PARTS, chartProps, getFounderResume, type ChartPart } from '@/app/founders/resume-data';

/**
 * GET /api/resume?part=shipped|effort|momentum|stack|views|path|focus
 *
 * One of the site owner's resume charts, as the props its ink chart takes:
 * { part, component, props }, or 404 when the owner has nothing to show
 * there (VIEWS. stays 404 unless founder.resume.views is on). Public, like
 * /founders, which shows the same charts: it lets any article embed the
 * owner's live charts by name (componentProps: { source: 'shipped' })
 * instead of carrying their data. The owner's words are /api/words.
 */
export async function GET(request: NextRequest) {
  const part = request.nextUrl.searchParams.get('part') as ChartPart | null;
  if (!part || !CHART_PARTS.includes(part)) {
    return NextResponse.json({ error: `part must be one of ${CHART_PARTS.join(', ')}` }, { status: 400 });
  }

  const props = chartProps(await getFounderResume(), part);
  if (!props) return NextResponse.json({ error: `nothing to show for ${part}` }, { status: 404 });

  return NextResponse.json(
    { part, component: CHART_COMPONENT[part], props },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
