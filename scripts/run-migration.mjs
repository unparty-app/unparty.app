import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inline SKU generator
function generateSKU(prefix = "UNP", year) {
  if (!year) {
    year = new Date().getFullYear();
  }
  const uniqueId = randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${uniqueId}-${year}`;
}

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

async function authorizeGoogle() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured');
  }
  if (!process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('GOOGLE_PRIVATE_KEY is not configured');
  }
  if (!process.env.GOOGLE_SHEETS_ID) {
    throw new Error('GOOGLE_SHEETS_ID is not configured');
  }

  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('GOOGLE_PRIVATE_KEY is not properly formatted');
  }

  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

async function migrateBooks() {
  try {
    console.log('Starting book migration from Google Sheets to database...');

    const sheets = await authorizeGoogle();
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

    // Get data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A2:L',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} books in Google Sheets`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const [
        , // id: rows get fresh ids on insert
        title,
        author,
        quote,
        page,
        publisher,
        publisherLink,
        inStock,
        claimedBy,
        claimedAt,
        shippingFee,
        condition
      ] = row;

      // Skip if missing required fields
      if (!title || !author) {
        console.log(`Skipping row with missing title or author: ${title || 'N/A'}`);
        skippedCount++;
        continue;
      }

      try {
        // Check if book already exists (by title and author combination)
        const existingBook = await prisma.book.findFirst({
          where: {
            title: title,
            author: author,
          }
        });

        if (existingBook) {
          console.log(`Book already exists: ${title} by ${author}`);
          skippedCount++;
          continue;
        }

        // Generate SKU
        let sku;
        let attempts = 0;
        do {
          sku = generateSKU();
          const existingWithSku = await prisma.book.findUnique({
            where: { sku }
          });
          if (!existingWithSku) break;
          attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
          throw new Error(`Failed to generate unique SKU for ${title}`);
        }

        // Create book in database
        await prisma.book.create({
          data: {
            sku,
            title,
            author,
            quote: quote || null,
            page: page ? parseInt(page) : null,
            publisher: publisher || null,
            publisherLink: publisherLink || null,
            inStock: inStock === 'TRUE',
            claimedBy: claimedBy || null,
            claimedAt: claimedAt ? new Date(claimedAt) : null,
            shippingFee: shippingFee ? parseFloat(shippingFee) : null,
            condition: condition || null,
            paymentStatus: claimedBy ? 'PAID' : 'PENDING',
          }
        });

        console.log(`✓ Migrated: ${title} by ${author} (SKU: ${sku})`);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating book "${title}":`, error);
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`- Migrated: ${migratedCount} books`);
    console.log(`- Skipped: ${skippedCount} books`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyMigration() {
  try {
    console.log('\nVerifying migration...');

    const totalBooks = await prisma.book.count();
    const availableBooks = await prisma.book.count({
      where: { inStock: true }
    });
    const claimedBooks = await prisma.book.count({
      where: { inStock: false }
    });

    console.log(`Database contains ${totalBooks} books:`);
    console.log(`- Available: ${availableBooks}`);
    console.log(`- Claimed: ${claimedBooks}`);

    // Sample a few records
    const sampleBooks = await prisma.book.findMany({
      take: 3,
      select: {
        sku: true,
        title: true,
        author: true,
        inStock: true,
        paymentStatus: true,
      }
    });

    console.log('\nSample migrated books:');
    sampleBooks.forEach((book) => {
      console.log(`- ${book.sku}: "${book.title}" by ${book.author} (${book.inStock ? 'Available' : 'Claimed'})`);
    });

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateBooks()
  .then(() => verifyMigration())
  .catch(console.error);
