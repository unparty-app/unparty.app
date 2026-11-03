import { dbOn, noDatabase } from '@/lib/db-on';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { validateQuestionResponse, logValidationIssues, QuestionResponseRequestSchema, QuestionValidationError } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category') || 'core';
    const audienceFilter = searchParams.get('audience') || 'published';

    // Get step with questions for the category
    const step = await prisma.step.findFirst({
      where: {
        category: categoryId.toUpperCase()
      },
      include: {
        questions: {
          where: {
            audience: audienceFilter
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!step) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get user responses only if authenticated
    let userResponses: Array<{ questionId: string; responseData: unknown; updatedAt: Date; organizationId: string | null }> = [];
    
    if (userId) {
      userResponses = await prisma.userQuestionResponse.findMany({
        where: {
          userId,
          organizationId: orgId ?? null,
          questionId: {
            in: step.questions.map(q => q.id)
          }
        }
      });
    }

    // Map questions with user responses (if authenticated)
    const questionsWithResponses = step.questions.map(question => {
      const userResponse = userResponses.find(response => response.questionId === question.id);
      return {
        id: question.id,
        text: question.text,
        type: question.type === 'MULTIPLE_CHOICE' ? 'multiple_choice' : question.type.toLowerCase(),
        model: question.model,
        choices: question.choices,
        userResponse: userResponse ? {
          responseData: userResponse.responseData,
          completedAt: userResponse.updatedAt.toISOString(),
          organizationId: userResponse.organizationId
        } : null
      };
    });

    return NextResponse.json({
      category: {
        id: categoryId,
        label: step.category,
        step: step.category,
        audience: audienceFilter
      },
      questions: questionsWithResponses,
      progress: {
        completed: userResponses.length,
        total: step.questions.length,
        percentage: Math.round((userResponses.length / step.questions.length) * 100)
      },
      context: {
        organizationId: orgId ?? null,
        authenticated: !!userId
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!dbOn()) return noDatabase();

    const body = await request.json();
    const { questionId, responseData } = body;

    // Basic null checks (always required)
    if (!questionId || responseData === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId and responseData' },
        { status: 400 }
      );
    }

    // Always log validation issues for monitoring. When ENABLE_QUESTION_VALIDATION=true,
    // validateQuestionResponse throws and the invalid response is rejected.
    logValidationIssues(body, QuestionResponseRequestSchema, 'POST /api/questions');
    try {
      validateQuestionResponse(body);
    } catch (validationError) {
      if (validationError instanceof QuestionValidationError) {
        return NextResponse.json(
          { error: validationError.message, details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Handle upsert based on whether we have organization context
    let response;
    if (orgId) {
      // Organization context - use compound unique constraint
      response = await prisma.userQuestionResponse.upsert({
        where: {
          userId_questionId_organizationId: {
            userId,
            questionId,
            organizationId: orgId
          }
        },
        update: {
          responseData,
          updatedAt: new Date()
        },
        create: {
          userId,
          questionId,
          organizationId: orgId,
          responseData,
          // Keep deprecated fields for backward compatibility during migration
          categoryId: null,
          questionType: question.type
        }
      });
    } else {
      // Personal response - find by userId and questionId where organizationId is null
      const existingResponse = await prisma.userQuestionResponse.findFirst({
        where: {
          userId,
          questionId,
          organizationId: null
        }
      });

      if (existingResponse) {
        response = await prisma.userQuestionResponse.update({
          where: { id: existingResponse.id },
          data: {
            responseData,
            updatedAt: new Date()
          }
        });
      } else {
        response = await prisma.userQuestionResponse.create({
          data: {
            userId,
            questionId,
            organizationId: null,
            responseData,
            // Keep deprecated fields for backward compatibility during migration
            categoryId: null,
            questionType: question.type
          }
        });
      }
    }

    // After saving response, check if any question-based steps are now complete
    try {
      // Find step that contains this question
      const stepWithQuestion = await prisma.step.findFirst({
        where: {
          questions: {
            some: {
              id: questionId
            }
          }
        },
        include: {
          questions: {
            where: {
              audience: 'published'
            }
          },
          userProgress: {
            where: { userId },
            take: 1
          }
        }
      });

      if (stepWithQuestion && stepWithQuestion.questions.length > 0) {
        // Check if all published questions in this step are now answered
        const userResponses = await prisma.userQuestionResponse.findMany({
          where: {
            userId,
            organizationId: orgId ?? null,
            questionId: {
              in: stepWithQuestion.questions.map(q => q.id)
            }
          }
        });

        const isCompleted = userResponses.length === stepWithQuestion.questions.length;
        const existingProgress = stepWithQuestion.userProgress[0];

        if (isCompleted && !existingProgress?.completed) {
          // Mark step as completed
          const completionData = {
            questionsTotal: stepWithQuestion.questions.length,
            questionsAnswered: userResponses.length,
            completionType: 'questions'
          };

          if (existingProgress) {
            await prisma.userStepProgress.update({
              where: { id: existingProgress.id },
              data: {
                completed: true,
                completedAt: new Date(),
                userAnswer: JSON.stringify(completionData)
              }
            });
          } else {
            await prisma.userStepProgress.create({
              data: {
                userId,
                stepId: stepWithQuestion.id,
                completed: true,
                completedAt: new Date(),
                startedAt: new Date(),
                userAnswer: JSON.stringify(completionData)
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to trigger step completion check:', error);
      // Don't fail the response save if completion check fails
    }

    return NextResponse.json({ 
      success: true, 
      response: {
        ...response,
        updatedAt: response.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving question response:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}