import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listRankingQuestions() {
  try {
    const questions = await prisma.question.findMany({
      where: { type: 'RANKING' },
      select: {
        id: true,
        text: true,
        type: true,
        choices: true,
        audience: true,
        step: {
          select: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n=== RANKING QUESTIONS ===\n');
    if (questions.length === 0) {
      console.log('⚠️  No RANKING questions found in database');
      console.log('\nYou need to create one at http://localhost:3000/admin/questions\n');
      console.log('Steps:');
      console.log('1. Click "Create Question"');
      console.log('2. Select Type: RANKING');
      console.log('3. Category: entrepreneurship');
      console.log('4. Title: "Rank common avoidances in entrepreneurship"');
      console.log('5. Add 5-7 choices (e.g., Fear of failure, Perfectionism, etc.)');
    } else {
      questions.forEach((q, i) => {
        console.log(`[${i + 1}] ID: ${q.id}`);
        console.log(`    Text: ${q.text}`);
        console.log(`    Category: ${q.step?.category || 'N/A'}`);
        console.log(`    Audience: ${q.audience}`);
        console.log(`    Choices (${q.choices?.length || 0}):`);
        q.choices?.forEach((choice, idx) => {
          console.log(`      ${idx + 1}. ${choice}`);
        });
        console.log('');
      });
      
      console.log('\n📋 To use in CITRUS article, copy one of the IDs above');
    }
    
    const allQuestions = await prisma.question.count();
    console.log(`\nTotal questions in database: ${allQuestions}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listRankingQuestions();
