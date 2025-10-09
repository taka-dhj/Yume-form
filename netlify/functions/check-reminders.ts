import type { Handler } from '@netlify/functions';
import { readReservationsSheet } from '../../src/lib/google-sheets';

export const handler: Handler = async () => {
  try {
    const rows = await readReservationsSheet();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderThresholds = [30, 21, 14, 7]; // Days before check-in to send reminders
    const remindersToSend: Array<{
      bookingId: string;
      guestName: string;
      email: string;
      checkinDate: string;
      daysUntil: number;
    }> = [];

    for (const r of rows) {
      const initialEmailSent = ['TRUE', 'true', '1'].includes((r.initial_email_sent || '').toString());
      const formResponded = ['TRUE', 'true', '1'].includes((r.form_responded || '').toString());
      
      // Skip if initial email not sent or already responded
      if (!initialEmailSent || formResponded) continue;
      
      // Skip if no email address
      if (!r.email) continue;

      const checkinDate = new Date(r.checkin_date);
      checkinDate.setHours(0, 0, 0, 0);
      const daysUntilCheckin = Math.ceil((checkinDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if today matches a reminder threshold
      if (reminderThresholds.includes(daysUntilCheckin)) {
        remindersToSend.push({
          bookingId: r.booking_id || '',
          guestName: r.guest_name || '',
          email: r.email || '',
          checkinDate: r.checkin_date || '',
          daysUntil: daysUntilCheckin,
        });
      }
    }

    // Send reminders
    const results = [];
    for (const reminder of remindersToSend) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '';
      const formUrl = `${baseUrl}/form?bookingId=${reminder.bookingId}`;

      const subject = `【夢殿】ご回答のお願い（再送）- ${reminder.checkinDate}ご宿泊`;
      const body = `${reminder.guestName} 様

いつもありがとうございます。

${reminder.checkinDate}のご宿泊まで、残り${reminder.daysUntil}日となりました。

以前お送りしたご質問フォームへのご回答をまだいただけておりません。
スムーズなご案内のため、お早めのご回答をお願いいたします。

【ご回答フォーム】
${formUrl}

ご回答いただけていない場合は、お手数ですが上記フォームよりご回答をお願いいたします。
すでにご回答済みの場合は、本メールをご放念ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${reminder.bookingId}`;

      // Call send-email function
      try {
        const res = await fetch(`${baseUrl}/.netlify/functions/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: reminder.email, subject, bodyText: body }),
        });
        
        results.push({
          bookingId: reminder.bookingId,
          success: res.ok,
          daysUntil: reminder.daysUntil,
        });
      } catch (err) {
        results.push({
          bookingId: reminder.bookingId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        checked: rows.length,
        remindersSent: results.length,
        results,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }),
    };
  }
};
