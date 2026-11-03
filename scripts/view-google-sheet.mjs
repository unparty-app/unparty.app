import { google } from 'googleapis';

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
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );

  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

async function viewGoogleSheet() {
  try {
    console.log('\n📊 FETCHING DATA FROM GOOGLE SHEET\n');
    console.log('='.repeat(80));

    const sheets = await authorizeGoogle();
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

    console.log(`\nSheet ID: ${SHEET_ID}\n`);

    // Get header row first
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:L1',
    });

    const headers = headerResponse.data.values?.[0] || [];
    console.log('📋 Headers:', headers.join(' | '));
    console.log('='.repeat(80));

    // Get data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A2:L',
    });

    const rows = dataResponse.data.values || [];
    console.log(`\n📚 Total Books in Sheet: ${rows.length}\n`);

    if (rows.length === 0) {
      console.log('❌ No book data found in the Google Sheet\n');
      return;
    }

    // Display all books
    rows.forEach((row, index) => {
      const [
        id,
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

      console.log(`\n${index + 1}. ${inStock === 'TRUE' ? '✅' : '❌'} ${title || 'NO TITLE'}`);
      if (id) console.log(`   ID: ${id}`);
      console.log(`   Author: ${author || 'Unknown'}`);
      if (quote) console.log(`   Quote: "${quote}"`);
      if (page) console.log(`   Page: ${page}`);
      if (publisher) console.log(`   Publisher: ${publisher}`);
      if (publisherLink) console.log(`   Link: ${publisherLink}`);
      if (condition) console.log(`   Condition: ${condition}`);
      if (shippingFee) console.log(`   Shipping Fee: $${shippingFee}`);
      console.log(`   In Stock: ${inStock || 'N/A'}`);

      if (claimedBy) {
        console.log(`   🔒 Claimed By: ${claimedBy}`);
        if (claimedAt) console.log(`   Claimed At: ${claimedAt}`);
      }

      console.log('-'.repeat(80));
    });

    // Summary statistics
    const inStockCount = rows.filter(row => row[7] === 'TRUE').length;
    const claimedCount = rows.filter(row => row[7] === 'FALSE' || row[8]).length;
    const withQuotes = rows.filter(row => row[3]).length;
    const withShippingFee = rows.filter(row => row[10]).length;

    console.log('\n📊 SUMMARY:');
    console.log(`   Total Books: ${rows.length}`);
    console.log(`   In Stock: ${inStockCount}`);
    console.log(`   Claimed: ${claimedCount}`);
    console.log(`   With Quotes: ${withQuotes}`);
    console.log(`   With Shipping Fee: ${withShippingFee}`);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    if (error.code === 403) {
      console.error('\n❌ Permission denied. Make sure the service account has access to the Google Sheet.');
      console.error('   Share the sheet with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    } else if (error.code === 404) {
      console.error('\n❌ Google Sheet not found. Check the GOOGLE_SHEETS_ID environment variable.');
    } else {
      console.error('\n❌ Error fetching Google Sheet:', error.message);
    }
  }
}

viewGoogleSheet();
