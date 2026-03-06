import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SessionData, StudentRow } from '../types/dashboard'

interface DashboardState {
    sessionData: SessionData | null
    studentsWithMarks: StudentRow[]
    submittedRowIds: string[]

    // Actions
    setSessionData: (data: SessionData) => void
    setStudentsWithMarks: (students: StudentRow[]) => void
    markRowSubmitted: (studentId: string) => void
    unsubmitRow: (studentId: string) => void
    resetDashboard: () => void
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            sessionData: null,
            studentsWithMarks: [],
            submittedRowIds: [],

            setSessionData: (data) => set({ sessionData: data }),
            setStudentsWithMarks: (students) => set({ studentsWithMarks: students }),
            markRowSubmitted: (studentId) => set((state) => ({
                submittedRowIds: Array.from(new Set([...state.submittedRowIds, studentId]))
            })),
            unsubmitRow: (studentId) => set((state) => ({
                submittedRowIds: state.submittedRowIds.filter(id => id !== studentId)
            })),
            resetDashboard: () => set({ sessionData: null, studentsWithMarks: [], submittedRowIds: [] })
        }),
        {
            name: 'pushmarks-dashboard-session', // unique name for localStorage key
            version: 1,
        }
    )
)
