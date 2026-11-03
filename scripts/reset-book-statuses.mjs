import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
  }
}

loadEnv();

const prisma = new PrismaClient();

async function resetBookStatuses(setAsAvailable = false) {
  try {
    console.log('\n📚 RESETTING BOOK STATUSES\n');
    console.log('='.repeat(80));

    // Get current state
    const totalBooks = await prisma.book.count();
    const currentlyAvailable = await prisma.book.count({ where: { inStock: true } });
    const currentlyClaimed = await prisma.book.count({ where: { claimedBy: { not: null } } });

    console.log('\n📊 CURRENT STATE:');
    console.log(`   Total Books: ${totalBooks}`);
    console.log(`   Currently Available: ${currentlyAvailable}`);
    console.log(`   Currently Claimed: ${currentlyClaimed}`);
    console.log('\n' + '='.repeat(80));

    // Reset all books
    console.log(`\n🔄 Resetting all books to ${setAsAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}...`);
    console.log('   - Clearing all claim data (claimedBy, claimedAt)');
    console.log('   - Resetting payment status to PENDING');
    console.log('   - Clearing shipping addresses and payment IDs\n');

    const result = await prisma.book.updateMany({
      data: {
        inStock: setAsAvailable,
        claimedBy: null,
        claimedAt: null,
        paymentStatus: 'PENDING',
        shippingAddress: null,
        stripePaymentId: null,
      }
    });

    console.log(`✅ Successfully reset ${result.count} books\n`);
    console.log('='.repeat(80));

    // Verify new state
    const newAvailable = await prisma.book.count({ where: { inStock: true } });
    const newClaimed = await prisma.book.count({ where: { claimedBy: { not: null } } });

    console.log('\n📊 NEW STATE:');
    console.log(`   Total Books: ${totalBooks}`);
    console.log(`   Now Available: ${newAvailable}`);
    console.log(`   Now Claimed: ${newClaimed}`);
    console.log('\n' + '='.repeat(80));

    // Sample books
    console.log('\n📖 SAMPLE BOOKS (first 5):');
    const sampleBooks = await prisma.book.findMany({
      take: 5,
      select: {
        title: true,
        author: true,
        inStock: true,
        claimedBy: true,
      }
    });

    sampleBooks.forEach((book, index) => {
      console.log(`\n${index + 1}. ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Status: ${book.inStock ? '✅ Available' : '📚 Library'}`);
      console.log(`   Claimed: ${book.claimedBy ? `Yes (${book.claimedBy})` : 'No'}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error resetting book statuses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line argument
const setAsAvailable = process.argv.includes('--available');
const showHelp = process.argv.includes('--help') || process.argv.includes('-h');

if (showHelp) {
  console.log(`
📚 Reset Book Statuses Script

Usage:
  node scripts/reset-book-statuses.mjs [OPTIONS]

Options:
  --available    Set all books as available (inStock = true)
  (default)      Set all books as unavailable (inStock = false)
  --help, -h     Show this help message

Examples:
  # Reset all books to unavailable/library mode
  node scripts/reset-book-statuses.mjs

  # Reset all books to available/ready to claim
  node scripts/reset-book-statuses.mjs --available

What this script does:
  - Resets inStock status for all books
  - Clears all claim data (claimedBy, claimedAt)
  - Resets payment status to PENDING
  - Clears shipping addresses and Stripe payment IDs
  `);
  process.exit(0);
}

console.log(`\n🚀 Running reset with: ${setAsAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} mode\n`);
resetBookStatuses(setAsAvailable);
