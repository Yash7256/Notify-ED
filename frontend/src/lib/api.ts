import { CreateSessionPayload, CreateSessionResponse, SubmitRowPayload } from '../types/dashboard'
import { supabase } from './supabase'

// Prefer explicit env; otherwise fall back to current origin in browser, then localhost for dev.
const API_BASE =
    import.meta.env.VITE_API_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')

export const DashboardApi = {
    createSession: async (payload: CreateSessionPayload): Promise<CreateSessionResponse> => {
        try {
            const resp = await fetch(`${API_BASE}/api/session/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!resp.ok) {
                throw new Error('Failed to create session')
            }

            const data = await resp.json()
            console.log('[session] subjects returned', data.subjects)

            if (!data?.subjects || data.subjects.length === 0) {
                throw new Error('No subjects found for this semester/department')
            }

            return {
                sessionId: data.sessionId,
                excelUrl: data.excelUrl || '',
                subjects: data.subjects,
                studentsWithMarks: data.studentsWithMarks
            }
        } catch (err) {
            // Fallback to direct Supabase query so UI still works in dev
            const { data: subjects } = await supabase
                .from('semester_subjects')
                .select('*')
                .eq('semester', payload.semester)
                .eq('department', payload.department)

            if (!subjects || subjects.length === 0) {
                throw err
            }

            const studentsWithMarks = payload.students
                .map((s, i) => ({
                    studentId: `mock-uuid-${i}`,
                    name: s.name,
                    enrollmentNo: s.enrollmentNo,
                    marks: {} as Record<string, any>
                }))
                .sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo))

            console.log('[session:fallback] subjects returned', subjects)

            return {
                sessionId: `session-${Date.now()}`,
                excelUrl: '',
                subjects,
                studentsWithMarks
            }
        }
    },

    submitRow: async (payload: SubmitRowPayload): Promise<{ success: boolean; message?: string }> => {
        const marks = payload.subjectMarks.map((m) => ({
            studentId: payload.studentId,
            subjectId: m.subjectId,
            midTerm: m.midTerm,
            endTerm: m.endTerm,
            assignment: m.assignment,
            attendance: m.attendance
        }));

        const resp = await fetch(`${API_BASE}/api/marks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: payload.sessionId,
                submittedBy: null, // replace with professor ID when available
                marks
            })
        });

        const data = await resp.json().catch(() => ({}));
        return { success: resp.ok, message: data.error };
    }
}
