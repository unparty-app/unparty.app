import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/challenges/[challengeId]/results
 * 
 * Get aggregated poll results for a challenge
 * 
 * Returns vote counts and percentages for each option
 * 
 * Response format:
 * {
 *   totalVotes: number,
 *   results: {
 *     stepOne: { count: number, percentage: number },
 *     stepTwo: { count: number, percentage: number },
 *     stepThree: { count: number, percentage: number }
 *   }
 * }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;

    // Fetch all votes for this challenge
    const votes = await prisma.challengeResponse.findMany({
      where: {
        challengeId,
      },
      select: {
        selectedOption: true,
      },
    });

    // Count votes for each option
    const voteCounts = {
      stepOne: 0,
      stepTwo: 0,
      stepThree: 0,
    };

    votes.forEach((vote) => {
      if (vote.selectedOption in voteCounts) {
        voteCounts[vote.selectedOption as keyof typeof voteCounts]++;
      }
    });

    const totalVotes = votes.length;

    // Calculate percentages
    const results = {
      stepOne: {
        count: voteCounts.stepOne,
        percentage: totalVotes > 0 ? Math.round((voteCounts.stepOne / totalVotes) * 100) : 0,
      },
      stepTwo: {
        count: voteCounts.stepTwo,
        percentage: totalVotes > 0 ? Math.round((voteCounts.stepTwo / totalVotes) * 100) : 0,
      },
      stepThree: {
        count: voteCounts.stepThree,
        percentage: totalVotes > 0 ? Math.round((voteCounts.stepThree / totalVotes) * 100) : 0,
      },
    };

    return NextResponse.json({
      totalVotes,
      results,
    });
  } catch (error) {
    console.error('[Challenge Results API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
