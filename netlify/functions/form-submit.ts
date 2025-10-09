import type { Handler } from '@netlify/functions';
import { getSheetsClient } from '../../src/lib/google-sheets';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { bookingId, formData } = body;

    if (!bookingId || !formData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing bookingId or formData' }) };
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing GOOGLE_SHEETS_ID' }) };
    }

    const sheets = await getSheetsClient();

    // Read Reservations sheet to find row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Reservations!A1:AD',
    });
    const rows = res.data.values || [];
    if (rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Reservations sheet is empty' }) };
    }

    const [header, ...data] = rows;
    const bookingIdIdx = header.indexOf('booking_id');
    const formRespondedIdx = header.indexOf('form_responded');
    const notesIdx = header.indexOf('notes');

    if (bookingIdIdx === -1) {
      return { statusCode: 500, body: JSON.stringify({ error: 'booking_id column not found' }) };
    }

    const rowIndex = data.findIndex((r) => r[bookingIdIdx] === bookingId);
    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: `Booking ID ${bookingId} not found` }) };
    }

    const sheetRowNum = rowIndex + 2; // header=1, data starts at 2

    // Update form_responded flag and save form data to notes column
    const updates: { range: string; values: string[][] }[] = [];
    if (formRespondedIdx !== -1) {
      updates.push({
        range: `Reservations!${String.fromCharCode(65 + formRespondedIdx)}${sheetRowNum}`,
        values: [['TRUE']],
      });
    }

    // Save form response JSON to notes column
    if (notesIdx !== -1) {
      const formResponseJson = JSON.stringify({
        submittedAt: new Date().toISOString(),
        ...formData,
      });
      updates.push({
        range: `Reservations!${String.fromCharCode(65 + notesIdx)}${sheetRowNum}`,
        values: [[formResponseJson]],
      });
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { data: updates, valueInputOption: 'USER_ENTERED' },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, bookingId }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }),
    };
  }
};
