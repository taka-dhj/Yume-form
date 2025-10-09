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

    // Prepare 13 dummy rows: 5 pending, 3 email_sent, 1 questioning, 4 completed, うち本日チェックイン2件
    const today = new Date();
    const toIsoDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

    const statuses = [
      ...Array(5).fill('pending'),
      ...Array(3).fill('email_sent'),
      'questioning',
      ...Array(4).fill('completed'),
    ];

    const values = statuses.map((status, i) => {
      const num = (i + 1).toString().padStart(3, '0');
      // 本日チェックイン2件: index 0, 7
      const daysOffset = (i === 0 || i === 7) ? 0 : i;
      const checkin = new Date(today.getTime() + daysOffset * 24 * 60 * 60 * 1000);

      const flags = {
        initial_email_sent: status !== 'pending',
        form_responded: status === 'responded' || status === 'questioning' || status === 'completed',
        questioning: status === 'questioning',
        reception_completed: status === 'completed',
      };

      return makeRow(header, {
        booking_id: `TEST-${num}`,
        guest_name: `John Doe ${num}`,
        email: `john${num}@example.com`,
        checkin_date: toIsoDate(checkin),
        nights: (i % 3) + 1,
        ota_name: ['Booking.com', 'Expedia', 'Agoda'][i % 3],
        dinner_included: ['Unknown', 'Yes', 'No'][i % 3],
        initial_email_sent: flags.initial_email_sent,
        email_sent_at: flags.initial_email_sent ? new Date().toISOString() : '',
        form_responded: flags.form_responded,
        questioning: flags.questioning,
        reception_completed: flags.reception_completed,
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


