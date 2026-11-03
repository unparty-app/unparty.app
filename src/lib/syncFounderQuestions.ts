import { prisma } from '@/lib/prisma'
import { foundersQuestions } from '@/app/founders/foundersquestions'
import type { Question as FounderQuestion } from '@/types/questions'

/**
 * Map question types from TypeScript to database enum
 * Direct 1:1 mapping since database now includes SCALE
 */
function mapQuestionType(type: string) {
  const typeMap = {
    'text': 'TEXT',
    'multipleChoice': 'MULTIPLE_CHOICE',
    'ranking': 'RANKING',
    'scale': 'SCALE'  // Now supported in database enum
  } as const
  
  type QuestionTypeKeys = keyof typeof typeMap
  return typeMap[type as QuestionTypeKeys] || 'TEXT'
}

/**
 * Sync founder questions from foundersquestions.json to the database
 * Creates or updates Question records and associates them with a Step
 */
export async function syncFounderQuestions(stepId: string, founderQuestionIds: string[]) {
  if (!stepId || !Array.isArray(founderQuestionIds) || founderQuestionIds.length === 0) {
    return { success: false, error: 'Invalid parameters', syncedCount: 0 }
  }
  
  // Verify step exists
  const step = await prisma.step.findUnique({
    where: { id: stepId }
  })
  
  if (!step) {
    return { success: false, error: 'Step not found', syncedCount: 0 }
  }
  
  // Find all matching questions from foundersquestions.ts
  const questionsToSync: FounderQuestion[] = []
  
  for (const category of foundersQuestions.categories) {
    for (const question of category.questions) {
      if (founderQuestionIds.includes(question.id)) {
        questionsToSync.push(question)
      }
    }
  }
  
  if (questionsToSync.length !== founderQuestionIds.length) {
    const foundIds = questionsToSync.map(q => q.id)
    const missingIds = founderQuestionIds.filter(id => !foundIds.includes(id))
    console.warn(`Some question IDs not found in foundersquestions.ts:`, missingIds)
  }
  
  // Upsert questions to database
  const syncedQuestions = await Promise.all(
    questionsToSync.map(async (question) => {
      return await prisma.question.upsert({
        where: { id: question.id },
        create: {
          id: question.id,
          stepId: stepId,
          text: question.text,
          type: mapQuestionType(question.type),
          choices: question.choices || [],
          model: question.model,
          audience: 'published',
          order: 0
        },
        update: {
          stepId: stepId,
          text: question.text,
          type: mapQuestionType(question.type),
          choices: question.choices || [],
          model: question.model
        }
      })
    })
  )
  
  return {
    success: true,
    syncedCount: syncedQuestions.length,
    questionIds: syncedQuestions.map(q => q.id)
  }
}
