import { dbOn, noDatabase } from '@/lib/db-on';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/challenges/[challengeId]/vote
 * 
 * Save or update a user's vote for a challenge poll
 * 
 * Request body:
 * - articleSlug: string (required)
 * - selectedOption: 'stepOne' | 'stepTwo' | 'stepThree' (required)
 * 
 * Returns:
 * - 200: Vote saved successfully
 * - 401: Unauthorized (no userId)
 * - 400: Invalid _request body
 * - 500: Server error
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to vote.' },
        { status: 401 }
      );
    }
    if (!dbOn()) return noDatabase();

    // Parse _request body
    const body = await _request.json();
    const { articleSlug, selectedOption } = body;

    // Validate required fields
    if (!articleSlug || !selectedOption) {
      return NextResponse.json(
        { error: 'Missing required fields: articleSlug, selectedOption' },
        { status: 400 }
      );
    }

    // Validate selectedOption value
    const validOptions = ['stepOne', 'stepTwo', 'stepThree'];
    if (!validOptions.includes(selectedOption)) {
      return NextResponse.json(
        { error: 'Invalid selectedOption. Must be stepOne, stepTwo, or stepThree' },
        { status: 400 }
      );
    }

    const { challengeId } = await params;

    // Upsert the vote (create or update)
    const response = await prisma.challengeResponse.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      update: {
        selectedOption,
        updatedAt: new Date(),
      },
      create: {
        userId,
        challengeId,
        articleSlug,
        selectedOption,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vote saved successfully',
      response: {
        id: response.id,
        selectedOption: response.selectedOption,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Challenge Vote API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save vote' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/challenges/[challengeId]/vote
 * 
 * Get the current user's vote for a challenge
 * 
 * Returns:
 * - 200: User's vote or null if not voted
 * - 401: Unauthorized (no userId)
 * - 500: Server error
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your vote.' },
        { status: 401 }
      );
    }

    const { challengeId } = await params;

    // Fetch user's vote
    const vote = await prisma.challengeResponse.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      select: {
        id: true,
        selectedOption: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      vote: vote || null,
    });
  } catch (error) {
    console.error('[Challenge Vote GET API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote' },
      { status: 500 }
    );
  }
}
