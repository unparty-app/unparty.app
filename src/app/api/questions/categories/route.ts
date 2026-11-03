import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const audienceFilter = searchParams.get('audience') || 'published';
    const stepFilter = searchParams.get('step');

    // Get steps with their published questions
    const steps = await prisma.step.findMany({
      where: stepFilter ? {
        category: stepFilter.toUpperCase()
      } : undefined,
      include: {
        questions: {
          where: {
            audience: audienceFilter
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        category: 'asc'
      }
    });

    // Get all user responses to calculate progress (only when authenticated)
    const userResponses = userId
      ? await prisma.userQuestionResponse.findMany({
          where: {
            userId,
            organizationId: orgId ?? null
          }
        })
      : [];

    // Calculate progress for each category
    const categoriesWithProgress = steps
      .filter(step => step.questions.length > 0) // Only include steps with published questions
      .map(step => {
        const categoryResponses = userResponses.filter(response => 
          step.questions.some(q => q.id === response.questionId)
        );
        const progress = {
          completed: categoryResponses.length,
          total: step.questions.length,
          percentage: Math.round((categoryResponses.length / step.questions.length) * 100)
        };

        return {
          id: step.category.toLowerCase(),
          label: step.category,
          step: step.category,
          audience: audienceFilter,
          questionCount: step.questions.length,
          progress
        };
      });

    // Calculate overall progress for filtered categories
    const totalQuestions = categoriesWithProgress.reduce((sum, cat) => sum + cat.questionCount, 0);
    const completedQuestions = categoriesWithProgress.reduce((sum, cat) => sum + cat.progress.completed, 0);

    return NextResponse.json({
      categories: categoriesWithProgress,
      overallProgress: {
        completed: completedQuestions,
        total: totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
      },
      context: {
        organizationId: orgId ?? null,
        authenticated: !!userId
      }
    });

  } catch (error) {
    console.error('Error fetching question categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}