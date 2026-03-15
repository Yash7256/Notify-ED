import { CreateSessionPayload, CreateSessionResponse, SubmitRowPayload, Department, Subject, CreateSubjectPayload } from '../types/dashboard'
import { supabase } from './supabase'

// Prefer explicit env; otherwise fall back to current origin in browser, then localhost for dev.
const API_BASE =
    import.meta.env.VITE_API_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')

export const DashboardApi = {
    createSession: async (payload: CreateSessionPayload): Promise<CreateSessionResponse> => {
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 20000)

            const resp = await fetch(`${API_BASE}/api/session/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })
            clearTimeout(timeout)

            if (!resp.ok) {
                const text = await resp.text().catch(() => '')
                throw new Error(`Failed to create session (${resp.status} ${resp.statusText}) ${text}`)
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
            console.error('[session:create] request failed', err)
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
    },

    listDepartments: async (): Promise<Department[]> => {
        const resp = await fetch(`${API_BASE}/api/catalog/departments`);
        if (!resp.ok) throw new Error('Failed to fetch departments');
        const data = await resp.json();
        return data.departments || [];
    },

    addDepartment: async (name: string): Promise<Department> => {
        const resp = await fetch(`${API_BASE}/api/catalog/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to add department');
        return data.department;
    },

    deleteDepartment: async (id: string): Promise<void> => {
        const resp = await fetch(`${API_BASE}/api/catalog/departments/${id}`, { method: 'DELETE' });
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete department');
        }
    },

    listSubjects: async (filters: { department?: string; semester?: number }): Promise<Subject[]> => {
        const params = new URLSearchParams();
        if (filters.department) params.append('department', filters.department);
        if (filters.semester) params.append('semester', String(filters.semester));

        const resp = await fetch(`${API_BASE}/api/catalog/subjects?${params.toString()}`);
        if (!resp.ok) throw new Error('Failed to fetch subjects');
        const data = await resp.json();
        return data.subjects || [];
    },

    addSubject: async (payload: CreateSubjectPayload): Promise<Subject> => {
        const resp = await fetch(`${API_BASE}/api/catalog/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to add subject');
        return data.subject;
    },

    deleteSubject: async (id: string): Promise<void> => {
        const resp = await fetch(`${API_BASE}/api/catalog/subjects/${id}`, { method: 'DELETE' });
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete subject');
        }
    }
}
