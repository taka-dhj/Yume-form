import type { Handler } from '@netlify/functions';
import { getSheetsClient } from '../../src/lib/google-sheets';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { to, subject, bodyText, bookingId, emailType } = body;

    if (!to || !subject || !bodyText) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: to, subject, bodyText' }) };
    }

    // Email sending implementation
    // For now, we'll use a simple console log and return success
    // In production, integrate with SendGrid, AWS SES, or other email service
    
    console.log('Email would be sent:', {
      to,
      subject,
      body: bodyText,
      from: process.env.EMAIL_FROM || 'noreply@yumedono.com',
    });

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: process.env.EMAIL_FROM, subject, text: bodyText });

    // Update status and save email history if bookingId provided
    if (bookingId && emailType) {
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      if (spreadsheetId) {
        const sheets = await getSheetsClient();
        
        // Read sheet to find row
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Reservations!A1:AD',
        });
        const rows = res.data.values || [];
        
        if (rows.length > 0) {
          const [header, ...data] = rows;
          const bookingIdIdx = header.indexOf('booking_id');
          const emailHistoryIdx = header.indexOf('email_history');
          const initialEmailSentIdx = header.indexOf('initial_email_sent');
          const receptionCompletedIdx = header.indexOf('reception_completed');
          const emailSentAtIdx = header.indexOf('email_sent_at');
          
          if (bookingIdIdx !== -1) {
            const rowIndex = data.findIndex((r) => r[bookingIdIdx] === bookingId);
            
            if (rowIndex !== -1) {
              const sheetRowNum = rowIndex + 2;
              const updates: { range: string; values: string[][] }[] = [];
              
              // Save email history
              if (emailHistoryIdx !== -1) {
                const existingHistory = data[rowIndex][emailHistoryIdx] || '';
                let history: any[] = [];
                try {
                  history = existingHistory ? JSON.parse(existingHistory) : [];
                } catch {
                  history = [];
                }
                
                history.push({
                  type: emailType,
                  to,
                  subject,
                  body: bodyText,
                  sentAt: new Date().toISOString(),
                });
                
                updates.push({
                  range: `Reservations!${String.fromCharCode(65 + emailHistoryIdx)}${sheetRowNum}`,
                  values: [[JSON.stringify(history)]],
                });
              }
              
              // Update status flags
              if (emailType === 'initial' && initialEmailSentIdx !== -1) {
                updates.push({
                  range: `Reservations!${String.fromCharCode(65 + initialEmailSentIdx)}${sheetRowNum}`,
                  values: [['TRUE']],
                });
                
                if (emailSentAtIdx !== -1) {
                  updates.push({
                    range: `Reservations!${String.fromCharCode(65 + emailSentAtIdx)}${sheetRowNum}`,
                    values: [[new Date().toISOString()]],
                  });
                }
              } else if (emailType === 'reception' && receptionCompletedIdx !== -1) {
                updates.push({
                  range: `Reservations!${String.fromCharCode(65 + receptionCompletedIdx)}${sheetRowNum}`,
                  values: [['TRUE']],
                });
              }
              
              if (updates.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                  spreadsheetId,
                  requestBody: { data: updates, valueInputOption: 'USER_ENTERED' },
                });
              }
            }
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Email sent successfully (simulated)' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Error' }),
    };
  }
};
