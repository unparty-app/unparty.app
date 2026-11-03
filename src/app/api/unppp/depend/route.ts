import { NextResponse } from 'next/server';
import { getDependItems } from '@/utils/dependCosts';

export const dynamic = 'force-static';

export function GET() {
  try {
    const data = getDependItems();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error('Error loading depend cost data:', error);
    return NextResponse.json({ error: 'Failed to load depend cost data', data: [], count: 0 }, { status: 500 });
  }
}
