const supabase = require('./supabaseClient');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 2, delayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      console.warn(`[inAppNotification] Attempt ${attempt + 1} failed: ${err.message}${isLast ? '' : ' (retrying...)'}`);
      if (!isLast) await delay(delayMs);
    }
  }
  throw lastError;
}

function buildMessage(studentName, subjectName, marks, subjectId) {
  const subjectLabel = subjectName || subjectId || 'Subject';
  const total = marks.total ?? (Number(marks.midTerm || 0) + Number(marks.endTerm || 0) + Number(marks.assignment || 0));
  const attendanceLine = marks.attendance !== undefined ? `Attendance: ${marks.attendance}%` : null;

  const title = `Marks updated for ${subjectLabel}`;
  const bodyLines = [
    `Hi ${studentName || 'Student'}, your marks are now available.`,
    `Mid Term: ${marks.midTerm ?? 0}/30 • End Term: ${marks.endTerm ?? 0}/50 • Assignment: ${marks.assignment ?? 0}/20`,
    `Total: ${total}/100`,
  ];
  if (attendanceLine) bodyLines.push(attendanceLine);

  return { title, body: bodyLines.join('\n'), total };
}

async function sendInAppNotification(studentId, studentName, subjectId, subjectName, marks) {
  if (!studentId) throw new Error('studentId is required for in-app notification');

  const { title, body, total } = buildMessage(studentName, subjectName, marks, subjectId);

  const insert = async () => {
    const { error } = await supabase.from('in_app_notifications').insert({
      student_id: studentId,
      subject_id: subjectId || null,
      title,
      body,
      metadata: {
        subjectName: subjectName || subjectId,
        marks,
        total,
        createdAt: new Date().toISOString(),
      },
    });

    if (error) throw new Error(error.message || 'Failed to insert in-app notification');
    return { success: true };
  };

  return withRetry(insert);
}

module.exports = { sendInAppNotification };
