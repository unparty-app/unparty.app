import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exploreBooks() {
  try {
    console.log('\n📚 EXPLORING BOOKS DATABASE\n');
    console.log('='.repeat(80));

    // Get total count
    const totalBooks = await prisma.book.count();
    const inStockCount = await prisma.book.count({ where: { inStock: true } });
    const claimedCount = await prisma.book.count({ where: { inStock: false } });

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Books: ${totalBooks}`);
    console.log(`   In Stock: ${inStockCount}`);
    console.log(`   Claimed: ${claimedCount}\n`);
    console.log('='.repeat(80));

    // Get all books
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (books.length === 0) {
      console.log('\n❌ No books found in database\n');
      return;
    }

    console.log(`\n📖 ALL BOOKS (${books.length}):\n`);

    books.forEach((book, index) => {
      console.log(`\n${index + 1}. ${book.inStock ? '✅' : '❌'} ${book.title}`);
      console.log(`   SKU: ${book.sku}`);
      console.log(`   Author: ${book.author}`);
      if (book.quote) console.log(`   Quote: "${book.quote}"`);
      if (book.page) console.log(`   Page: ${book.page}`);
      if (book.publisher) console.log(`   Publisher: ${book.publisher}`);
      if (book.publisherLink) console.log(`   Link: ${book.publisherLink}`);
      if (book.condition) console.log(`   Condition: ${book.condition}`);
      if (book.shippingFee) console.log(`   Shipping Fee: $${book.shippingFee}`);
      console.log(`   Payment Status: ${book.paymentStatus}`);

      if (!book.inStock) {
        console.log(`   🔒 CLAIMED BY: ${book.claimedBy || 'Unknown'}`);
        console.log(`   Claimed At: ${book.claimedAt?.toISOString() || 'Unknown'}`);
        if (book.stripePaymentId) console.log(`   Stripe Payment: ${book.stripePaymentId}`);
      }

      console.log(`   Created: ${book.createdAt.toISOString()}`);
      console.log('-'.repeat(80));
    });

    // Show payment status breakdown
    console.log('\n💳 PAYMENT STATUS BREAKDOWN:');
    const paymentStats = await prisma.book.groupBy({
      by: ['paymentStatus'],
      _count: true
    });

    paymentStats.forEach(stat => {
      console.log(`   ${stat.paymentStatus}: ${stat._count}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error exploring books:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exploreBooks();
