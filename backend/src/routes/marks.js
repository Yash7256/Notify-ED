const express = require('express');
const supabase = require('../services/supabaseClient');
const { sendEmail } = require('../services/notifications');
const { sendInAppNotification } = require('../services/inAppNotificationService');
const { validateSubmitPayload, validateResendPayload, MARK_RANGES } = require('../utils/validation');

const router = express.Router();

function serializeError(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

function composeMessages(student, subjectName, mark) {
  const displayName = student?.name || 'Student';
  const subject = subjectName || 'Subject';

  const emailSubject = `Marks update for ${subject}`;
  const emailHtml = `
    <p>Hi ${displayName},</p>
    <p>Your marks for <strong>${subject}</strong> are now available.</p>
    <ul>
      <li>Mid-term: ${mark.midTerm} / ${MARK_RANGES.midTerm.max}</li>
      <li>End-term: ${mark.endTerm} / ${MARK_RANGES.endTerm.max}</li>
      <li>Assignment: ${mark.assignment} / ${MARK_RANGES.assignment.max}</li>
      <li>Attendance: ${mark.attendance}%</li>
    </ul>
    <p>If you have any questions, please reach out to your course instructor.</p>
  `;

  return { emailSubject, emailHtml };
}

async function logNotification({ studentId, markId, channel, result }) {
  const payload = {
    student_id: studentId,
    marks_id: markId || null,
    channel,
    status: result.status === 'fulfilled' ? 'sent' : 'failed',
    error_message: result.status === 'rejected' ? serializeError(result.reason) : null,
    sent_at: result.status === 'fulfilled' ? new Date().toISOString() : null
  };

  const { error } = await supabase.from('notification_logs').insert(payload);
  if (error) {
    console.error(`[notify] Failed to log ${channel} notification for student ${studentId}:`, error.message);
  } else {
    console.log(`[notify] Logged ${channel} notification for student ${studentId} (status: ${payload.status})`);
  }
}

router.post('/submit', async (req, res) => {
  const validationError = validateSubmitPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const { submittedBy, marks, sessionId: clientSessionId } = req.body;
  console.log(`[submit] submittedBy=${submittedBy || 'n/a'}, sessionId=${clientSessionId || 'new'}, rows=${marks.length}`);

  try {
    let sessionId = clientSessionId;
    if (!sessionId) {
      const { data: sessionRow, error: sessionError } = await supabase
        .from('marks_sessions')
        .insert({ created_by: submittedBy || null })
        .select('id')
        .single();

      if (sessionError) {
        console.error('[submit] Failed to create marks_session:', sessionError.message);
        return res.status(500).json({ success: false, error: 'Unable to create marks session' });
      }

      sessionId = sessionRow.id;
      console.log(`[submit] Created marks_session ${sessionId}`);
    }

    const markRows = marks.map((entry) => ({
      session_id: sessionId,
      subject_id: entry.subjectId,
      student_id: entry.studentId,
      mid_term: entry.midTerm,
      end_term: entry.endTerm,
      assignment: entry.assignment,
      attendance: entry.attendance
    }));

    const { data: upsertedMarks, error: upsertError } = await supabase
      .from('marks')
      .upsert(markRows, { onConflict: 'session_id,student_id,subject_id' })
      .select();

    if (upsertError) {
      console.error('[submit] Upsert marks failed:', upsertError.message);
      return res.status(500).json({ success: false, error: 'Failed to save marks' });
    }

    console.log(`[submit] Upserted ${upsertedMarks?.length || 0} marks rows`);

    const studentIds = [...new Set(marks.map((m) => m.studentId))];
    const subjectIds = [...new Set(marks.map((m) => m.subjectId))];
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id,name,email')
      .in('id', studentIds);

    const { data: subjects, error: subjectsError } = await supabase
      .from('semester_subjects')
      .select('id,subject_name')
      .in('id', subjectIds);

    if (studentsError) {
      console.error('[submit] Fetch students failed:', studentsError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
    if (subjectsError) {
      console.error('[submit] Fetch subjects failed:', subjectsError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
    }

    const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
    const subjectMap = Object.fromEntries((subjects || []).map((s) => [s.id, s.subject_name]));
    const findMarkRow = (studentId, subjectId) =>
      (upsertedMarks || []).find((row) => row.student_id === studentId && row.subject_id === subjectId);

    let emailSent = 0;
    let inAppSent = 0;
    const failed = [];

    for (const entry of marks) {
      const student = studentMap[entry.studentId];
      const markRow = findMarkRow(entry.studentId, entry.subjectId);

      if (!student) {
        console.warn(`[submit] Student ${entry.studentId} not found; skipping notifications`);
        failed.push({ studentId: entry.studentId, channel: 'email', reason: 'Student not found' });
        continue;
      }

      const subjectName = subjectMap[entry.subjectId] || entry.subjectId || 'Subject';
      const { emailSubject, emailHtml } = composeMessages(student, subjectName, entry);

      const emailPromise = student.email
        ? sendEmail(student.email, emailSubject, emailHtml)
        : Promise.reject(new Error('Email address is required for this student'));

      const [emailResult, inAppResult] = await Promise.allSettled([
        emailPromise,
        sendInAppNotification(student.id, student.name, entry.subjectId, subjectName, entry)
      ]);

      if (emailResult.status === 'rejected') {
        console.error(`[notify] Email failed for student ${student.id}:`, serializeError(emailResult.reason));
      }
      if (inAppResult.status === 'rejected') {
        console.error(`[notify] In-app notification failed for student ${student.id}:`, serializeError(inAppResult.reason));
      }

      await logNotification({ studentId: student.id, markId: markRow?.id, channel: 'email', result: emailResult });

      if (emailResult.status === 'fulfilled') {
        emailSent += 1;
      } else {
        failed.push({ studentId: student.id, channel: 'email', reason: serializeError(emailResult.reason) });
      }

      if (inAppResult.status === 'fulfilled') {
        inAppSent += 1;
      } else {
        failed.push({ studentId: student.id, channel: 'inapp', reason: serializeError(inAppResult.reason) });
      }
    }

    return res.status(200).json({
      success: true,
      notified: { email: emailSent, inApp: inAppSent },
      failed
    });
  } catch (err) {
    console.error('[submit] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/resend-failed', async (req, res) => {
  const validationError = validateResendPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const { ids } = req.body;
  console.log(`[resend] Retrying ${ids.length} notification logs`);

  try {
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('id,student_id,marks_id,channel,status')
      .in('id', ids);

    if (logsError) {
      console.error('[resend] Fetch logs failed:', logsError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch notification logs' });
    }

    const failedLogs = (logs || []).filter((log) => log.status === 'failed');
    if (failedLogs.length === 0) {
      return res.status(200).json({ success: true, retried: { email: 0 }, failed: [], message: 'No failed logs to retry' });
    }

    const studentIds = [...new Set(failedLogs.map((log) => log.student_id))];
    const markIds = [...new Set(failedLogs.map((log) => log.marks_id).filter(Boolean))];

    const [{ data: students, error: studentsError }, { data: marksData, error: marksError }] = await Promise.all([
      supabase.from('students').select('id,name,email').in('id', studentIds),
      supabase
        .from('marks')
        .select('id,subject_id,student_id,mid_term,end_term,assignment,attendance')
        .in('id', markIds)
    ]);

    if (studentsError) {
      console.error('[resend] Fetch students failed:', studentsError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }

    if (marksError) {
      console.error('[resend] Fetch marks failed:', marksError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch marks' });
    }

    const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
    const markMap = Object.fromEntries((marksData || []).map((m) => [m.id, m]));

    let emailSent = 0;
    const failed = [];

    for (const log of failedLogs) {
      const student = studentMap[log.student_id];
      const mark = log.marks_id ? markMap[log.marks_id] : null;

      if (!student || !mark) {
        failed.push({ logId: log.id, reason: 'Student or mark not found' });
        continue;
      }

      const markPayload = {
        midTerm: mark.mid_term,
        endTerm: mark.end_term,
        assignment: mark.assignment,
        attendance: mark.attendance
      };

      const { emailSubject, emailHtml } = composeMessages(student, mark.subject_id, markPayload);

      const result = await Promise.allSettled([sendEmail(student.email, emailSubject, emailHtml)]).then((r) => r[0]);

      const status = result.status === 'fulfilled' ? 'sent' : 'failed';
      const updatePayload = {
        status,
        error_message: result.status === 'rejected' ? serializeError(result.reason) : null,
        sent_at: result.status === 'fulfilled' ? new Date().toISOString() : null
      };

      const { error: updateError } = await supabase
        .from('notification_logs')
        .update(updatePayload)
        .eq('id', log.id);

      if (updateError) {
        console.error(`[resend] Failed to update log ${log.id}:`, updateError.message);
      }

      if (status === 'sent') {
        emailSent += 1;
      } else {
        failed.push({ logId: log.id, channel: log.channel, reason: serializeError(result.reason) });
      }
    }

    return res.status(200).json({
      success: true,
      retried: { email: emailSent },
      failed
    });
  } catch (err) {
    console.error('[resend] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
