const watiApiKey = process.env.WATI_API_KEY;
const watiInstanceId = process.env.WATI_INSTANCE_ID;
const watiTemplateName = process.env.WATI_TEMPLATE_NAME || 'marks_update';
const watiBroadcastName = process.env.WATI_BROADCAST_NAME || 'Marks Update';
const watiLanguageCode = process.env.WATI_TEMPLATE_LANGUAGE || 'en';
const customWhatsappWebhook = process.env.CUSTOM_WHATSAPP_WEBHOOK_URL;
const customWhatsappToken = process.env.CUSTOM_WHATSAPP_WEBHOOK_TOKEN || '';

if (typeof fetch !== 'function') {
  throw new Error('Global fetch API is not available. Please run on Node 18+');
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 2, delayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      console.warn(`[whatsappService] Attempt ${attempt + 1} failed: ${err.message}${isLast ? '' : ' (retrying...)'}`);
      if (!isLast) await delay(delayMs);
    }
  }
  throw lastError;
}

function buildMessage(studentName, subjectName, marks) {
  const total = marks.total ?? (Number(marks.midTerm || 0) + Number(marks.endTerm || 0) + Number(marks.assignment || 0));
  const warnAttendance = marks.attendance !== undefined && marks.attendance < 75;
  const warningLine = warnAttendance ? '\n⚠️ Attendance is below 75%' : '';

  return `📊 *Marks Update*
Hi ${studentName}, your marks for *${subjectName}* have been updated:
• Mid Term: ${marks.midTerm ?? 0}/30
• End Term: ${marks.endTerm ?? 0}/50
• Assignment: ${marks.assignment ?? 0}/20
• Attendance: ${marks.attendance ?? 0}%
• *Total: ${total}/100*${warningLine}`;
}

async function sendViaWatiTemplate(phone, studentName, subjectName, marks, messageText) {
  if (!watiApiKey || !watiInstanceId) throw new Error('WATI configuration is missing');

  const total = marks.total ?? (Number(marks.midTerm || 0) + Number(marks.endTerm || 0) + Number(marks.assignment || 0));
  const payload = {
    template_name: watiTemplateName,
    broadcast_name: watiBroadcastName,
    language_code: watiLanguageCode,
    receivers: [phone],
    parameters: [
      { name: 'student_name', value: studentName },
      { name: 'subject_name', value: subjectName },
      { name: 'mid_term', value: marks.midTerm ?? 0 },
      { name: 'end_term', value: marks.endTerm ?? 0 },
      { name: 'assignment', value: marks.assignment ?? 0 },
      { name: 'attendance', value: `${marks.attendance ?? 0}%` },
      { name: 'total', value: total },
      { name: 'message_body', value: messageText }
    ]
  };

  const url = `https://app.wati.io/api/v1/instances/${watiInstanceId}/msgTemplate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${watiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WATI template send failed (${response.status}): ${body}`);
  }
  return { success: true };
}

async function sendViaCustomWebhook(phone, messageText, payloadExtras = {}) {
  if (!customWhatsappWebhook) throw new Error('Custom WhatsApp webhook not configured');
  const response = await fetch(customWhatsappWebhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customWhatsappToken ? { Authorization: `Bearer ${customWhatsappToken}` } : {})
    },
    body: JSON.stringify({
      to: phone,
      message: messageText,
      ...payloadExtras
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Custom WhatsApp service failed (${response.status}): ${body}`);
  }

  return { success: true };
}

async function sendMarksWhatsApp(phone, studentName, subjectName, marks) {
  if (!phone) throw new Error('Phone number is required');

  const messageText = buildMessage(studentName, subjectName, marks);

  const attemptSend = async () => {
    if (customWhatsappWebhook) {
      return sendViaCustomWebhook(phone, messageText, { studentName, subjectName, marks });
    }

    if (watiApiKey && watiInstanceId) {
      return sendViaWatiTemplate(phone, studentName, subjectName, marks, messageText);
    }

    console.warn('[whatsappService] No WhatsApp provider configured; skipping send.');
    return { success: true, skipped: true };
  };

  return withRetry(attemptSend);
}

module.exports = { sendMarksWhatsApp };
