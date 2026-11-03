import { PrismaClient } from '@prisma/client'
import foundersQuestions from '../src/app/founders/foundersquestions.json' with { type: 'json' }

const prisma = new PrismaClient()

async function migrateQuestionsToNewStructure() {
  console.log('🚀 Starting migration to new Question/Step architecture...')

  try {
    // Step 1: Create category-based Steps
    console.log('📝 Creating category-based Steps...')
    
    const categorySteps = []
    for (const category of foundersQuestions.categories) {
      const step = await prisma.step.upsert({
        where: { id: `step-${category.id}` },
        update: {},
        create: {
          id: `step-${category.id}`,
          title: `${category.label} Assessment`,
          description: `Complete your ${category.label.toLowerCase()} business assessment`,
          category: category.label, // "CORE", "BUDGET", etc.
          status: 'PENDING',
          priority: 'MEDIUM',
          visibility: category.audience === 'published' ? 'ALL_USERS' : 'ORGANIZATION_ONLY'
        }
      })
      categorySteps.push(step)
      console.log(`  ✅ Created step: ${step.title}`)
    }

    // Step 2: Create Questions from foundersquestions.json
    console.log('❓ Creating Questions from foundersquestions.json...')
    
    let questionCount = 0
    for (const category of foundersQuestions.categories) {
      const stepId = `step-${category.id}`
      
      for (let i = 0; i < category.questions.length; i++) {
        const question = category.questions[i]
        
        // Convert question type to match enum
        let questionType = question.type.toUpperCase()
        if (questionType === 'MULTIPLECHOICE') {
          questionType = 'MULTIPLE_CHOICE'
        }
        
        await prisma.question.upsert({
          where: { id: question.id },
          update: {},
          create: {
            id: question.id,
            stepId: stepId,
            text: question.text,
            type: questionType,
            choices: question.choices || [],
            model: question.model || 'unparty', // Default model if missing
            audience: category.audience,
            order: i + 1
          }
        })
        questionCount++
      }
      console.log(`  ✅ Created ${category.questions.length} questions for ${category.label}`)
    }

    console.log('✅ Migration completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`  - Created ${categorySteps.length} category steps`)
    console.log(`  - Created ${questionCount} questions`)

    // Note: UserStepProgress and UserQuestionResponse migration will be handled 
    // when users start using the new system

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateQuestionsToNewStructure()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })