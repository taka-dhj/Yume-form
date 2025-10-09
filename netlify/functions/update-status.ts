import type { Handler } from '@netlify/functions';
import { updateReservationStatus } from '../../src/lib/google-sheets';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing bookingId or status' }) };
    }

    const validStatuses = ['pending', 'email_sent', 'responded', 'questioning', 'completed'];
    if (!validStatuses.includes(status)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) };
    }

    const result = await updateReservationStatus(bookingId, status);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'Internal Error' }) };
  }
};
