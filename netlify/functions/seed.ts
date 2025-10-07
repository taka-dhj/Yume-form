import type { Handler } from '@netlify/functions';
import { getSheetsClient } from '../../src/lib/google-sheets';

type HeaderMap = Record<string, number>;

function buildHeaderIndex(headers: string[]): HeaderMap {
  const index: HeaderMap = {};
  headers.forEach((h, i) => {
    index[h] = i;
  });
  return index;
}

function makeRow(headers: string[], values: Record<string, string | number | boolean | undefined>): (string | number)[] {
  const row: (string | number)[] = Array(headers.length).fill('');
  const idx = buildHeaderIndex(headers);
  Object.entries(values).forEach(([key, value]) => {
    if (key in idx) {
      row[idx[key]] = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : (value ?? '').toString();
    }
  });
  return row;
}

export const handler: Handler = async () => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing GOOGLE_SHEETS_ID' }) };
    }

    const sheets = await getSheetsClient();

    // Read header row
    const range = 'Reservations!A1:AD';
    const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = headerRes.data.values || [];
    if (rows.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Reservations sheet has no header' }) };
    }
    const header = rows[0] as string[];

    // Prepare 9 dummy rows
    const today = new Date();
    const toIsoDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

    const values = Array.from({ length: 9 }).map((_, i) => {
      const num = (i + 1).toString().padStart(3, '0');
      const checkin = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      return makeRow(header, {
        booking_id: `TEST-${num}`,
        guest_name: `John Doe ${num}`,
        email: `john${num}@example.com`,
        checkin_date: toIsoDate(checkin),
        nights: (i % 3) + 1,
        ota_name: ['Booking.com', 'Expedia', 'Agoda'][i % 3],
        dinner_included: ['Unknown', 'Yes', 'No'][i % 3],
        initial_email_sent: false,
        email_sent_at: '',
        form_responded: false,
        questioning: false,
        reception_completed: false,
        notes: 'seeded by /functions/seed'
      });
    });

    // Append
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Reservations!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, inserted: values.length }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'Internal Error' }) };
  }
};


