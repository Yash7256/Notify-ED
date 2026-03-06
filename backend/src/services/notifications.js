const nodemailer = require('nodemailer');

// Email configuration
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.FROM || 'NotifyED <no-reply@notifyed.local>';
const customEmailWebhook = process.env.CUSTOM_EMAIL_WEBHOOK_URL;
const customEmailToken = process.env.CUSTOM_EMAIL_WEBHOOK_TOKEN || '';

// WhatsApp configuration
const watiApiKey = process.env.WATI_API_KEY;
const watiInstanceId = process.env.WATI_INSTANCE_ID;
const customWhatsappWebhook = process.env.CUSTOM_WHATSAPP_WEBHOOK_URL;
const customWhatsappToken = process.env.CUSTOM_WHATSAPP_WEBHOOK_TOKEN || '';

if (typeof fetch !== 'function') {
  throw new Error('Global fetch API is not available. Please run on Node 18+');
}

async function sendEmail(to, subject, html) {
  if (!to) throw new Error('Email address is required');

  const sendViaSmtp = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) throw new Error('SMTP is not configured');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass }
    });
    await transporter.sendMail({ from: smtpFrom, to, subject, html });
    return { success: true };
  };

  const sendViaWebhook = async () => {
    if (!customEmailWebhook) throw new Error('No email provider configured (set SMTP_* or CUSTOM_EMAIL_WEBHOOK_URL)');
    const resp = await fetch(customEmailWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customEmailToken ? { Authorization: `Bearer ${customEmailToken}` } : {})
      },
      body: JSON.stringify({ to, subject, html })
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Custom email service failed (${resp.status}): ${body}`);
    }
    return { success: true };
  };

  if (smtpHost && smtpUser && smtpPass) return sendViaSmtp();
  return sendViaWebhook();
}

async function sendWhatsApp(phone, messageText) {
  if (!phone) throw new Error('Phone number is required');

  const sendViaWebhook = async () => {
    if (!customWhatsappWebhook) throw new Error('No WhatsApp provider configured (set CUSTOM_WHATSAPP_WEBHOOK_URL or WATI keys)');
    const response = await fetch(customWhatsappWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customWhatsappToken ? { Authorization: `Bearer ${customWhatsappToken}` } : {})
      },
      body: JSON.stringify({ to: phone, message: messageText })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Custom WhatsApp service failed (${response.status}): ${body}`);
    }
    return { success: true };
  };

  const sendViaWati = async () => {
    if (!watiApiKey || !watiInstanceId) throw new Error('WATI_API_KEY or WATI_INSTANCE_ID is not configured');
    const url = `https://app.wati.io/api/v1/instances/${watiInstanceId}/sendSessionMessage/${encodeURIComponent(phone)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${watiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messageText })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WATI send failed (${response.status}): ${body}`);
    }
    return { success: true };
  };

  if (customWhatsappWebhook) return sendViaWebhook();
  return sendViaWati();
}

module.exports = { sendEmail, sendWhatsApp };
