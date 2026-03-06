const express = require('express');
const supabase = require('../services/supabaseClient');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { semester, department, academicYear, students = [] } = req.body || {};

  if (!semester || !department || !academicYear) {
    return res.status(400).json({ success: false, error: 'semester, department, and academicYear are required' });
  }
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, error: 'students array is required' });
  }

  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('semester_subjects')
      .select('id, subject_code, subject_name, semester, department, credit')
      .eq('semester', semester)
      .eq('department', department);

    if (subjectsError) {
      console.error('[session:create] subjects query failed', subjectsError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
    }

    const enrollmentNos = students.map((s) => s.enrollmentNo).filter(Boolean);

    const { data: existingStudents, error: existingError } = await supabase
      .from('students')
      .select('id,enrollment_no,name,email,phone')
      .in('enrollment_no', enrollmentNos);

    if (existingError) {
      console.error('[session:create] fetch students failed', existingError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }

    const existingMap = new Map((existingStudents || []).map((s) => [s.enrollment_no, s]));
    const toInsert = students
      .filter((s) => !existingMap.has(s.enrollmentNo))
      .map((s) => ({
        enrollment_no: s.enrollmentNo,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        department
      }));

    let inserted = [];
    if (toInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await supabase
        .from('students')
        .insert(toInsert)
        .select('id,enrollment_no,name,email,phone');

      if (insertError) {
        console.error('[session:create] insert students failed', insertError.message);
        return res.status(500).json({ success: false, error: 'Failed to upsert students' });
      }
      inserted = insertedRows || [];
    }

    const allStudents = [...existingStudents, ...inserted];
    const studentsWithMarks = students
      .map((s) => {
        const matched = allStudents.find((row) => row.enrollment_no === s.enrollmentNo);
        return {
          studentId: matched?.id,
          name: matched?.name || s.name,
          enrollmentNo: s.enrollmentNo,
          marks: {}
        };
      })
      .sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' }));

    const { data: sessionRow, error: sessionError } = await supabase
      .from('marks_sessions')
      .insert({
        semester,
        department,
        academic_year: academicYear,
        excel_file_url: null
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[session:create] session insert failed', sessionError.message);
      return res.status(500).json({ success: false, error: 'Failed to create session' });
    }

    return res.status(200).json({
      success: true,
      sessionId: sessionRow.id,
      excelUrl: null,
      subjects: subjects || [],
      studentsWithMarks
    });
  } catch (err) {
    console.error('[session:create] unexpected error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
