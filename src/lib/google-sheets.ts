import { google } from 'googleapis';

export async function getSheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  }

  const creds = JSON.parse(serviceAccountJson);
  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
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


