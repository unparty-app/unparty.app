import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exploreAllTables() {
  try {
    console.log('\n🗄️  EXPLORING ALL DATABASE TABLES\n');
    console.log('='.repeat(80));

    // Books
    const bookCount = await prisma.book.count();
    console.log(`📚 Books: ${bookCount}`);

    // Articles
    const articleCount = await prisma.article.count();
    console.log(`📝 Articles: ${articleCount}`);

    // Steps
    const stepCount = await prisma.step.count();
    console.log(`📋 Steps: ${stepCount}`);

    // User Submissions
    const submissionCount = await prisma.userSubmission.count();
    console.log(`📤 User Submissions: ${submissionCount}`);

    // Questions
    const questionCount = await prisma.question.count();
    console.log(`❓ Questions: ${questionCount}`);

    // Step Categories
    const categoryCount = await prisma.stepCategory.count();
    console.log(`🏷️  Step Categories: ${categoryCount}`);

    // Repositories
    const repoCount = await prisma.repository.count();
    console.log(`🔗 Repositories: ${repoCount}`);

    // Tickets
    const ticketCount = await prisma.ticket.count();
    console.log(`🎫 Tickets: ${ticketCount}`);

    console.log('\n' + '='.repeat(80));

    // Show some sample data if available
    if (articleCount > 0) {
      console.log('\n📝 SAMPLE ARTICLES:');
      const articles = await prisma.article.findMany({ take: 3 });
      articles.forEach(a => console.log(`   - ${a.title} (${a.slug})`));
    }

    if (stepCount > 0) {
      console.log('\n📋 SAMPLE STEPS:');
      const steps = await prisma.step.findMany({ take: 3 });
      steps.forEach(s => console.log(`   - ${s.title} [${s.category}]`));
    }

    if (categoryCount > 0) {
      console.log('\n🏷️  CATEGORIES:');
      const categories = await prisma.stepCategory.findMany();
      categories.forEach(c => console.log(`   - ${c.name}: ${c.description || 'No description'}`));
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error exploring database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exploreAllTables();
