import { NextResponse } from 'next/server';
import { generateStatusFromPriorityScores } from '../../../utils/buildStatusParser';

/**
 * API Route to fetch build status data
 * GET /api/status
 */
export const revalidate = 300;

export async function GET() {
  try {
    const data = await generateStatusFromPriorityScores();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch build status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load build status'
      },
      { status: 500 }
    );
  }
}
