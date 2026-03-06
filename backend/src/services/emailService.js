const nodemailer = require('nodemailer');

const collegeName = process.env.COLLEGE_NAME || 'Your College Name';
const customEmailWebhook = process.env.CUSTOM_EMAIL_WEBHOOK_URL;
const customEmailToken = process.env.CUSTOM_EMAIL_WEBHOOK_TOKEN || '';
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.FROM || `NotifyED <no-reply@notifyed.local>`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 2, delayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      console.warn(`[emailService] Attempt ${attempt + 1} failed: ${err.message}${isLast ? '' : ' (retrying...)'}`);
      if (!isLast) await delay(delayMs);
    }
  }
  throw lastError;
}

function renderEmailHtml({ studentName, subjectName, marks }) {
  const totalScore = marks.total ?? (Number(marks.midTerm || 0) + Number(marks.endTerm || 0) + Number(marks.assignment || 0));
  const attendanceColor = (marks.attendance ?? 0) >= 75 ? '#0f9d58' : '#d93025';

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f2f5fb;padding:24px;color:#111827;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,0.06);overflow:hidden;">
      <header style="background:linear-gradient(120deg,#0f4c81,#185a9d);color:#fff;padding:18px 24px;">
        <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">${collegeName}</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px;">${subjectName}</div>
      </header>
      <main style="padding:24px;">
        <p style="margin:0 0 10px;font-size:16px;">Dear <strong>${studentName}</strong>,</p>
        <p style="margin:0 0 18px;">Your marks for <strong>${subjectName}</strong> have been updated. Please find the summary below:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:10px 8px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">Component</th>
              <th style="text-align:right;padding:10px 8px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">Mid Term</td>
              <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #e2e8f0;">${marks.midTerm ?? 0} / 30</td>
            </tr>
            <tr>
              <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">End Term</td>
              <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #e2e8f0;">${marks.endTerm ?? 0} / 50</td>
            </tr>
            <tr>
              <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">Assignment</td>
              <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #e2e8f0;">${marks.assignment ?? 0} / 20</td>
            </tr>
            <tr>
              <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">Attendance</td>
              <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #e2e8f0;color:${attendanceColor};font-weight:600;">${marks.attendance ?? 0}%</td>
            </tr>
            <tr>
              <td style="padding:12px 8px;background:#f8fafc;font-weight:700;">Total</td>
              <td style="padding:12px 8px;text-align:right;background:#f8fafc;font-weight:700;color:#0f4c81;">${totalScore} / 100</td>
            </tr>
          </tbody>
        </table>
        <p style="margin:0 0 12px;">If you notice any discrepancy, please contact the Examination Cell.</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">This is an automated notification from the Examination Cell.</p>
      </main>
    </div>
  </div>
  `;
}

async function sendMarksEmail(studentEmail, studentName, subjectName, marks) {
  if (!studentEmail) throw new Error('Student email is required');
  const html = renderEmailHtml({ studentName, subjectName, marks });
  const subject = `Marks Update: ${subjectName}`;

  const sendViaSmtp = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) throw new Error('SMTP is not configured');
    const transporter = smtpHost.includes('gmail')
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass }
        })
      : nodemailer.createTransport({
          host: smtpHost,
          port: 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass }
        });
    await transporter.sendMail({
      from: smtpFrom,
      to: studentEmail,
      subject,
      html
    });
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
      body: JSON.stringify({
        to: studentEmail,
        subject,
        html,
        metadata: { studentName, subjectName }
      })
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Custom email service failed (${resp.status}): ${body}`);
    }
    return { success: true };
  };

  const send = async () => {
    if (smtpHost && smtpUser && smtpPass) return sendViaSmtp();
    return sendViaWebhook();
  };

  return withRetry(send);
}

module.exports = { sendMarksEmail };
