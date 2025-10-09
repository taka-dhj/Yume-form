import { google } from 'googleapis';

export async function getSheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  }

  const creds = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function readReservationsSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID');
  }
  const sheets = await getSheetsClient();

  const range = 'Reservations!A1:AD';
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];

  const [header, ...data] = rows;
  return data.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((col: string, idx: number) => {
      obj[col] = (row[idx] ?? '').toString();
    });
    return obj;
  });
}

export async function readReservationsRaw() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID');
  }
  const sheets = await getSheetsClient();
  const range = 'Reservations!A1:AD';
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  return rows;
}

export async function updateReservationStatus(bookingId: string, status: 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed') {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID');
  }

  const sheets = await getSheetsClient();
  const range = 'Reservations!A1:AD';
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  if (rows.length === 0) throw new Error('No data in sheet');

  const [header, ...data] = rows;
  const bookingIdIdx = header.indexOf('booking_id');
  const initialEmailSentIdx = header.indexOf('initial_email_sent');
  const formRespondedIdx = header.indexOf('form_responded');
  const questioningIdx = header.indexOf('questioning');
  const receptionCompletedIdx = header.indexOf('reception_completed');
  const emailSentAtIdx = header.indexOf('email_sent_at');

  if (bookingIdIdx === -1) throw new Error('booking_id column not found');

  const rowIndex = data.findIndex((r) => r[bookingIdIdx] === bookingId);
  if (rowIndex === -1) throw new Error(`Booking ID ${bookingId} not found`);

  const sheetRowNum = rowIndex + 2; // header=1, data starts at 2

  // Map status to flags
  // Note: questioning takes priority over responded in status calculation
  const flags = {
    initial_email_sent: status !== 'pending',
    form_responded: status === 'responded' || status === 'completed',
    questioning: status === 'questioning',
    reception_completed: status === 'completed',
  };

  const updates: { range: string; values: string[][] }[] = [];

  if (initialEmailSentIdx !== -1) {
    updates.push({
      range: `Reservations!${String.fromCharCode(65 + initialEmailSentIdx)}${sheetRowNum}`,
      values: [[flags.initial_email_sent ? 'TRUE' : 'FALSE']],
    });
  }
  if (formRespondedIdx !== -1) {
    updates.push({
      range: `Reservations!${String.fromCharCode(65 + formRespondedIdx)}${sheetRowNum}`,
      values: [[flags.form_responded ? 'TRUE' : 'FALSE']],
    });
  }
  if (questioningIdx !== -1) {
    updates.push({
      range: `Reservations!${String.fromCharCode(65 + questioningIdx)}${sheetRowNum}`,
      values: [[flags.questioning ? 'TRUE' : 'FALSE']],
    });
  }
  if (receptionCompletedIdx !== -1) {
    updates.push({
      range: `Reservations!${String.fromCharCode(65 + receptionCompletedIdx)}${sheetRowNum}`,
      values: [[flags.reception_completed ? 'TRUE' : 'FALSE']],
    });
  }

  // email_sent_at: set current time if transitioning to email_sent and not already set
  if (emailSentAtIdx !== -1 && status === 'email_sent') {
    const currentVal = data[rowIndex][emailSentAtIdx] || '';
    if (!currentVal) {
      updates.push({
        range: `Reservations!${String.fromCharCode(65 + emailSentAtIdx)}${sheetRowNum}`,
        values: [[new Date().toISOString()]],
      });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { data: updates, valueInputOption: 'USER_ENTERED' },
    });
  }

  return { ok: true, bookingId, status };
}


