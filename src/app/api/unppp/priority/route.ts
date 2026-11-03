import { NextResponse } from 'next/server';
import { getUnpppPriorityData } from '../../../../utils/unpppPriority';

export const dynamic = 'force-static';

export function GET() {
  const data = getUnpppPriorityData();
  return NextResponse.json({ data, count: data.length });
}
