-- migration.sql
-- Complete Supabase Schema SQL for PushMarks

-- 1. Table: students
-- Pre-seeded once for entire batch 2023-2027
CREATE TABLE IF NOT EXISTS students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_no text UNIQUE NOT NULL,
    name text,
    email text,
    phone text,
    department text,
    batch text,
    created_at timestamptz DEFAULT now()
);

-- 2. Table: semester_subjects
-- Pre-seeded; e.g. semester 6 has 6 subjects
CREATE TABLE IF NOT EXISTS semester_subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code text,
    subject_name text,
    semester int,
    department text,
    credit int,
    created_at timestamptz DEFAULT now()
);

-- 3. Table: marks_sessions
-- One session per upload
CREATE TABLE IF NOT EXISTS marks_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    semester int,
    department text,
    academic_year text,
    excel_file_url text, -- Supabase Storage signed URL
    created_by uuid,     -- Can map to auth.users if needed
    created_at timestamptz DEFAULT now()
);

-- 4. Table: marks
CREATE TABLE IF NOT EXISTS marks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES marks_sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES semester_subjects(id) ON DELETE CASCADE,
    mid_term numeric CHECK (mid_term BETWEEN 0 AND 30),
    end_term numeric CHECK (end_term BETWEEN 0 AND 50),
    assignment numeric CHECK (assignment BETWEEN 0 AND 20),
    attendance numeric CHECK (attendance BETWEEN 0 AND 100),
    total numeric GENERATED ALWAYS AS (COALESCE(mid_term, 0) + COALESCE(end_term, 0) + COALESCE(assignment, 0)) STORED,
    submitted_at timestamptz DEFAULT now(),
    UNIQUE(session_id, student_id, subject_id)
);

-- 5. Table: notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES students(id) ON DELETE CASCADE,
    marks_id uuid REFERENCES marks(id) ON DELETE CASCADE,
    channel text CHECK (channel IN ('email','whatsapp')),
    status text CHECK (status IN ('sent','failed','pending')) DEFAULT 'pending',
    error_message text,
    sent_at timestamptz
);

-- 6. Table: in_app_notifications (for student portal in-app alerts)
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES semester_subjects(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- RLS Policies: Authenticated professors can SELECT/INSERT/UPDATE all 6 tables
-- No anonymous access (anon access is restricted by default on RLS enable)
-- --------------------------------------------------------------------------

-- Drop existing policies to make this migration idempotent
DROP POLICY IF EXISTS "Allow auth users to SELECT students" ON students;
DROP POLICY IF EXISTS "Allow auth users to INSERT students" ON students;
DROP POLICY IF EXISTS "Allow auth users to UPDATE students" ON students;

DROP POLICY IF EXISTS "Allow auth users to SELECT semester_subjects" ON semester_subjects;
DROP POLICY IF EXISTS "Allow auth users to INSERT semester_subjects" ON semester_subjects;
DROP POLICY IF EXISTS "Allow auth users to UPDATE semester_subjects" ON semester_subjects;

DROP POLICY IF EXISTS "Allow auth users to SELECT marks_sessions" ON marks_sessions;
DROP POLICY IF EXISTS "Allow auth users to INSERT marks_sessions" ON marks_sessions;
DROP POLICY IF EXISTS "Allow auth users to UPDATE marks_sessions" ON marks_sessions;

DROP POLICY IF EXISTS "Allow auth users to SELECT marks" ON marks;
DROP POLICY IF EXISTS "Allow auth users to INSERT marks" ON marks;
DROP POLICY IF EXISTS "Allow auth users to UPDATE marks" ON marks;

DROP POLICY IF EXISTS "Allow auth users to SELECT notification_logs" ON notification_logs;
DROP POLICY IF EXISTS "Allow auth users to INSERT notification_logs" ON notification_logs;
DROP POLICY IF EXISTS "Allow auth users to UPDATE notification_logs" ON notification_logs;

DROP POLICY IF EXISTS "Allow auth users to SELECT in_app_notifications" ON in_app_notifications;
DROP POLICY IF EXISTS "Allow auth users to INSERT in_app_notifications" ON in_app_notifications;
DROP POLICY IF EXISTS "Allow auth users to UPDATE in_app_notifications" ON in_app_notifications;

-- Policies for students
CREATE POLICY "Allow auth users to SELECT students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE students" ON students FOR UPDATE TO authenticated USING (true);

-- Policies for semester_subjects
CREATE POLICY "Allow auth users to SELECT semester_subjects" ON semester_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT semester_subjects" ON semester_subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE semester_subjects" ON semester_subjects FOR UPDATE TO authenticated USING (true);

-- Policies for marks_sessions
CREATE POLICY "Allow auth users to SELECT marks_sessions" ON marks_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT marks_sessions" ON marks_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE marks_sessions" ON marks_sessions FOR UPDATE TO authenticated USING (true);

-- Policies for marks
CREATE POLICY "Allow auth users to SELECT marks" ON marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT marks" ON marks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE marks" ON marks FOR UPDATE TO authenticated USING (true);

-- Policies for notification_logs
CREATE POLICY "Allow auth users to SELECT notification_logs" ON notification_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT notification_logs" ON notification_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE notification_logs" ON notification_logs FOR UPDATE TO authenticated USING (true);

-- Policies for in_app_notifications
CREATE POLICY "Allow auth users to SELECT in_app_notifications" ON in_app_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth users to INSERT in_app_notifications" ON in_app_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth users to UPDATE in_app_notifications" ON in_app_notifications FOR UPDATE TO authenticated USING (true);
