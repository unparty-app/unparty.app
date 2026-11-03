import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkQuestionSetup() {
  try {
    console.log('\n=== CHECKING QUESTION SETUP ===\n');
    
    // 1. Check if the questionId exists
    const questionId = 'brand_q1774908702179';
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        step: {
          select: {
            category: true,
            id: true
          }
        }
      }
    });
    
    if (!question) {
      console.log(`❌ Question ID "${questionId}" NOT FOUND in database`);
    } else {
      console.log(`✅ Question found:`);
      console.log(`   ID: ${question.id}`);
      console.log(`   Text: ${question.text}`);
      console.log(`   Type: ${question.type}`);
      console.log(`   Step Category: ${question.step?.category || 'NONE'}`);
      console.log(`   Choices: ${question.choices?.length || 0}`);
    }
    
    console.log('\n--- Available Categories/Steps ---\n');
    
    // 2. List all available categories (Steps)
    const steps = await prisma.step.findMany({
      select: {
        id: true,
        category: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        category: 'asc'
      }
    });
    
    if (steps.length === 0) {
      console.log('❌ No Steps/Categories found in database');
    } else {
      steps.forEach(step => {
        console.log(`   ${step.category} (${step._count.questions} questions)`);
      });
    }
    
    // 3. Check if ENTREPRENEURSHIP category exists
    const entrepreneurshipStep = steps.find(s => 
      s.category.toUpperCase() === 'ENTREPRENEURSHIP'
    );
    
    console.log('\n--- Solution ---\n');
    
    if (!entrepreneurshipStep) {
      console.log('❌ ENTREPRENEURSHIP category does NOT exist');
      console.log('\n💡 OPTION 1: Use existing "CORE" category');
      console.log('   Change categoryId from "entrepreneurship" to "core"');
      
      console.log('\n💡 OPTION 2: Create ENTREPRENEURSHIP category');
      console.log('   Visit /admin/steps and create a new step with category ENTREPRENEURSHIP');
    } else {
      console.log('✅ ENTREPRENEURSHIP category exists');
      console.log('   Step ID:', entrepreneurshipStep.id);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionSetup();
