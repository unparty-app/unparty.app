import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const audienceFilter = searchParams.get('audience') || 'published';

    // Get steps with their questions from database
    const steps = await prisma.step.findMany({
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

    // Transform to match the original JSON structure
    const categories = steps
      .filter(step => step.questions.length > 0) // Only include steps with questions
      .map(step => ({
        id: step.category.toLowerCase(),
        label: step.category,
        step: step.category,
        audience: audienceFilter,
        questions: step.questions.map(question => ({
          id: question.id,
          text: question.text,
          type: question.type === 'MULTIPLE_CHOICE' ? 'multipleChoice' : question.type.toLowerCase(),
          model: question.model,
          choices: question.choices
        }))
      }));

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Failed to load founders questions:', error)
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    )
  }
}