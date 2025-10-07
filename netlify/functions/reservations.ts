import type { Handler } from '@netlify/functions';
import { readReservationsSheet, readReservationsRaw } from '../../src/lib/google-sheets';

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
        checkinDate: r.checkin_date || '',
        nights: Number(r.nights || 0),
        otaName: r.ota_name || '',
        dinnerIncluded: (r.dinner_included || 'Unknown') as 'Yes' | 'No' | 'Unknown',
        initialEmailSent,
        emailSentAt: r.email_sent_at || undefined,
        status,
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
