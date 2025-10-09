import type { Handler } from '@netlify/functions';
import { readReservationsSheet, readReservationsRaw } from '../../src/lib/google-sheets';

function parseDate(value: string | number): string {
  if (!value) return '';
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const serial = Number(value);
    // Excel epoch: 1899-12-30 (but Excel incorrectly treats 1900 as leap year)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  }
  
  // If it's already a date string, validate and return
  const dateStr = value.toString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse as date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  
  return dateStr;
}

export const handler: Handler = async () => {
  try {
    const rows = await readReservationsSheet();
    const raw = await readReservationsRaw();
    const reservations = rows.map((r: any) => {
      const initialEmailSent = ['TRUE', 'true', '1'].includes((r.initial_email_sent || '').toString());
      const formResponded = ['TRUE', 'true', '1'].includes((r.form_responded || '').toString());
      const questioning = ['TRUE', 'true', '1'].includes((r.questioning || '').toString());
      const completed = ['TRUE', 'true', '1'].includes((r.reception_completed || '').toString());

      const status = completed
        ? 'completed'
        : questioning
        ? 'questioning'
        : formResponded
        ? 'responded'
        : initialEmailSent
        ? 'email_sent'
        : 'pending';

      return {
        bookingId: r.booking_id || '',
        guestName: r.guest_name || '',
        email: r.email || '',
        checkinDate: parseDate(r.checkin_date),
        nights: Number(r.nights || 0),
        otaName: r.ota_name || '',
        dinnerIncluded: (r.dinner_included || 'Unknown') as 'Yes' | 'No' | 'Unknown',
        initialEmailSent,
        emailSentAt: r.email_sent_at || undefined,
        status,
        notes: r.notes || '',
        emailHistory: r.email_history || '',
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ reservations, total: reservations.length, debug: { header: raw[0] || null, firstRow: raw[1] || null } }),
      headers: { 'content-type': 'application/json' },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || 'Internal Error' }),
      headers: { 'content-type': 'application/json' },
    };
  }
};
