import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { to, subject, bodyText } = body;

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
