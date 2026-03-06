-- seed.sql
-- Seed script for testing PushMarks application

-- 1. Seed 10 Students (batch 2023-2027, department "AI & Robotics")
INSERT INTO students (id, enrollment_no, name, email, phone, department, batch) VALUES
(gen_random_uuid(), 'EN2023001', 'Aman Raj', 'aman.raj.ra23@ggits.net', '9155019845', 'AI & Robotics', '2023-2027'),
(gen_random_uuid(), 'EN2023002', 'Harshita Upadhyay', 'harshita.upadhyay.ra23@ggits.net', '9993620036', 'AI & Robotics', '2023-2027');
-- 2. Seed 6 Semester Subjects (Semester 6)
INSERT INTO semester_subjects (id, subject_code, subject_name, semester, department, credit) VALUES
(gen_random_uuid(), 'ML601', 'Machine Learning', 6, 'AI & Robotics', 4),
(gen_random_uuid(), 'CV602', 'Computer Vision', 6, 'AI & Robotics', 3),
(gen_random_uuid(), 'RO603', 'Robotics', 6, 'AI & Robotics', 3),
(gen_random_uuid(), 'NL604', 'NLP', 6, 'AI & Robotics', 3),
(gen_random_uuid(), 'CC605', 'Cloud Computing', 6, 'AI & Robotics', 3),
(gen_random_uuid(), 'PW606', 'Project Work', 6, 'AI & Robotics', 6);
