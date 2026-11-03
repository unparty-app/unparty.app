import { google } from 'googleapis';

// Writing to the owner's Google Sheet (src/lib/sheet.ts reads it). Server
// only: the Google client is large and its keys never reach a browser

// The code a write answers with when the owner hasn't set writing up
export const SHEET_WRITE_OFF = 'sheet-write-off';

/** Whether the owner set up writing to their sheet (a service account it is shared with) */
export function sheetWriteConnected(): boolean {
  return Boolean(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

/** Add one row under the last one on the sheet's first tab */
export async function appendSheetRow(values: string[]): Promise<void> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  // A key pasted into .env keeps its line breaks as \n
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT(email, undefined, key, ['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}
