import type { Handler } from '@netlify/functions';
import { getSheetsClient } from '../../src/lib/google-sheets';

export const handler: Handler = async () => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing GOOGLE_SHEETS_ID' }) };
    }

    const sheets = await getSheetsClient();

    // Read all data
    const range = 'Reservations!A1:AD';
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];
    if (rows.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Reservations sheet is empty' }) };
    }

    const [header, ...data] = rows;
    
    const bookingIdIdx = header.indexOf('booking_id');
    const initialEmailSentIdx = header.indexOf('initial_email_sent');
    const emailSentAtIdx = header.indexOf('email_sent_at');
    const formRespondedIdx = header.indexOf('form_responded');
    const questioningIdx = header.indexOf('questioning');
    const receptionCompletedIdx = header.indexOf('reception_completed');
    const notesIdx = header.indexOf('notes');

    if (bookingIdIdx === -1) {
      return { statusCode: 500, body: JSON.stringify({ error: 'booking_id column not found' }) };
    }

    // Find all TEST-* rows
    const updates: { range: string; values: string[][] }[] = [];
    let resetCount = 0;

    data.forEach((row, index) => {
      const bookingId = row[bookingIdIdx] || '';
      if (!bookingId.startsWith('TEST-')) return;

      const sheetRowNum = index + 2; // header=1, data starts at 2

      // Reset all flags to pending state
      if (initialEmailSentIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + initialEmailSentIdx)}${sheetRowNum}`,
          values: [['FALSE']],
        });
      }
      if (emailSentAtIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + emailSentAtIdx)}${sheetRowNum}`,
          values: [['']],
        });
      }
      if (formRespondedIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + formRespondedIdx)}${sheetRowNum}`,
          values: [['FALSE']],
        });
      }
      if (questioningIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + questioningIdx)}${sheetRowNum}`,
          values: [['FALSE']],
        });
      }
      if (receptionCompletedIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + receptionCompletedIdx)}${sheetRowNum}`,
          values: [['FALSE']],
        });
      }
      if (notesIdx !== -1) {
        updates.push({
          range: `Reservations!${String.fromCharCode(65 + notesIdx)}${sheetRowNum}`,
          values: [['']],
        });
      }

      resetCount++;
    });

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { data: updates, valueInputOption: 'USER_ENTERED' },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, resetCount }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }) };
  }
};

