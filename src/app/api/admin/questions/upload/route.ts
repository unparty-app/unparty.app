/**
 * Admin Question Upload API
 * 
 * POST /api/admin/questions/upload
 * 
 * Allows administrators to upload or update questions with full Zod validation.
 * This endpoint prepares the system for future admin UIs where questions can be
 * managed dynamically instead of editing foundersquestions.json directly.
 * 
 * Features:
 * - Always validates with Zod (strict mode)
 * - Requires admin authentication
 * - Detailed validation error messages
 * - Batch upload support
 * - Syncs to database via Prisma
 * 
 * Example Request:
 * POST /api/admin/questions/upload
 * {
 *   "categoryId": "core",
 *   "questions": [
 *     {
 *       "id": "core_q1",
 *       "text": "What drives you?",
 *       "type": "text",
 *       "model": "about"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import {
  validateBatchQuestionUpload,
  QuestionValidationError
} from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import type { Question } from '@/types/questions';

/**
 * Map question type from our system to Prisma enum
 * Prisma schema has: TEXT, MULTIPLE_CHOICE, RANKING
 */
function mapQuestionTypeToPrisma(type: string): 'TEXT' | 'MULTIPLE_CHOICE' | 'RANKING' {
  switch (type) {
    case 'multipleChoice':
      return 'MULTIPLE_CHOICE';
    case 'ranking':
      return 'RANKING';
    case 'text':
    case 'scale': // Scale questions stored as TEXT with scale metadata
    default:
      return 'TEXT';
  }
}

/**
 * Sync single question to database
 */
async function syncQuestionToDatabase(
  question: Question,
  _categoryId: string,
  stepId: string
): Promise<void> {
  await prisma.question.upsert({
    where: { id: question.id },
    update: {
      text: question.text,
      type: mapQuestionTypeToPrisma(question.type),
      choices: question.choices || [],
      model: question.model,
      audience: question.audience || 'published',
      order: question.order || 0
    },
    create: {
      id: question.id,
      stepId: stepId, // Required foreign key
      text: question.text,
      type: mapQuestionTypeToPrisma(question.type),
      choices: question.choices || [],
      model: question.model,
      audience: question.audience || 'published',
      order: question.order || 0
    }
  });
}

/**
 * POST /api/admin/questions/upload
 * Upload questions with validation
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const denied = await adminGuard();
    if (denied) return denied;

    const body = await request.json();

    // Validate the upload data
    const validatedData = validateBatchQuestionUpload(body);

    // Get or create step for this category
    const step = await prisma.step.findFirst({
      where: {
        category: validatedData.categoryId.toUpperCase()
      }
    });

    if (!step) {
      return NextResponse.json(
        {
          error: 'Step not found',
          message: `No step found for category '${validatedData.categoryId}'. Create the step first.`
        },
        { status: 404 }
      );
    }

    // Sync questions to database
    const syncResults = await Promise.allSettled(
      validatedData.questions.map((question) =>
        syncQuestionToDatabase(question, validatedData.categoryId, step.id)
      )
    );

    // Count successes and failures
    const succeeded = syncResults.filter((r) => r.status === 'fulfilled').length;
    const failed = syncResults.filter((r) => r.status === 'rejected').length;
    const failures = syncResults
      .map((r, index) => ({
        questionId: validatedData.questions[index].id,
        error: r.status === 'rejected' ? r.reason?.message : null
      }))
      .filter((f) => f.error);

    return NextResponse.json({
      success: true,
      message: 'Questions uploaded and synced',
      stats: {
        total: validatedData.questions.length,
        succeeded,
        failed
      },
      failures: failed > 0 ? failures : undefined
    });
  } catch (error) {
    console.error('[Admin Upload] Error:', error);

    // Handle validation errors
    if (error instanceof QuestionValidationError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }

    // Handle admin auth errors
    if (error instanceof Error && error.message.includes('Admin')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/questions/upload
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/questions/upload',
    method: 'POST',
    description: 'Upload and validate questions with admin authentication',
    authentication: 'Required: Admin user',
    validation: 'Always enabled (Zod strict mode)',
    requestBody: {
      categoryId: 'string (required) - Category ID to assign questions to',
      questions: 'array (required) - Array of question objects'
    },
    questionSchema: {
      id: 'string (required) - Unique question identifier',
      text: 'string (required) - Question prompt',
      type: 'enum (required) - text | multipleChoice | ranking | scale',
      model: 'enum (required) - about | build | connect | unparty',
      choices: 'string[] (optional) - Required for multipleChoice/ranking',
      scaleMin: 'number (optional) - Required for scale questions',
      scaleMax: 'number (optional) - Required for scale questions',
      scaleStep: 'number (optional) - Increment for scale slider',
      scalePrefix: 'string (optional) - Prefix for scale display (e.g., "$")',
      scaleSuffix: 'string (optional) - Suffix for scale display (e.g., "%")',
      scaleLabels: 'array (optional) - Labels at specific scale values'
    },
    example: {
      categoryId: 'core',
      questions: [
        {
          id: 'core_q1',
          text: 'What drives you?',
          type: 'text',
          model: 'about'
        },
        {
          id: 'core_q2',
          text: 'Rate your confidence',
          type: 'scale',
          model: 'about',
          scaleMin: 0,
          scaleMax: 100,
          scaleStep: 10,
          scaleSuffix: '%'
        }
      ]
    }
  });
}
