export interface StudentPreview {
    name: string
    enrollmentNo: string
}

export interface Subject {
    id: string
    subject_code: string
    subject_name: string
    semester: number
    credit: number
}

export interface SubjectMarks {
    subjectId: string
    midTerm?: number
    endTerm?: number
    assignment?: number
    attendance?: number
}

export interface StudentRow {
    studentId: string
    name: string
    enrollmentNo: string
    marks: Record<string, SubjectMarks> // Keyed by subjectId
}

export interface SessionData {
    sessionId: string
    semester: number
    department: string
    academicYear: string
    excelUrl: string
    subjects: Subject[]
}

export interface CreateSessionPayload {
    semester: number
    department: string
    academicYear: string
    students: StudentPreview[]
}

export interface CreateSessionResponse {
    sessionId: string
    excelUrl: string
    subjects: Subject[]
    studentsWithMarks: StudentRow[]
}

export interface SubmitRowPayload {
    sessionId: string
    studentId: string
    subjectMarks: SubjectMarks[]
}
