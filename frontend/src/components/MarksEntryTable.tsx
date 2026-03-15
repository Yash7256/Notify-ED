import { Download, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TableBody } from '@/components/ui/table'
import { useDashboardStore } from '@/store/useDashboardStore'
import { MarksEntryRow } from './MarksEntryRow'
import * as XLSX from 'xlsx'

export function MarksEntryTable() {
    const { sessionData, studentsWithMarks, submittedRowIds, resetDashboard } = useDashboardStore()
    const navigate = useNavigate()

    if (!sessionData) return null

    const sortedStudents = [...studentsWithMarks].sort((a, b) =>
        a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' })
    )

    const handleDownloadSheet = () => {
        const data = studentsWithMarks.map(student => {
            const row: Record<string, string | number> = {
                'Enrollment No': student.enrollmentNo,
                'Student Name': student.name,
            }
            sessionData.subjects.forEach(subj => {
                const marks = student.marks[subj.id]
                row[`${subj.subject_code} - Mid Term`] = marks?.midTerm ?? ''
                row[`${subj.subject_code} - End Term`] = marks?.endTerm ?? ''
                row[`${subj.subject_code} - Assignment`] = marks?.assignment ?? ''
                row[`${subj.subject_code} - Attendance %`] = marks?.attendance ?? ''
            })
            return row
        })

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Marks')
        
        const colWidths = [
            { wch: 15 },
            { wch: 25 },
            ...sessionData.subjects.flatMap(() => [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }])
        ]
        ws['!cols'] = colWidths

        XLSX.writeFile(wb, `marks_${sessionData.semester}_${sessionData.department}_${sessionData.academicYear}.xlsx`)
    }

    const handleNewSession = () => {
        const confirmed = window.confirm('Are you sure? This will clear the current session from this view. Submitted marks are already saved.')
        if (!confirmed) return
        resetDashboard()
        navigate('/dashboard')
    }

    const progressPct = studentsWithMarks.length > 0
        ? (submittedRowIds.length / studentsWithMarks.length) * 100
        : 0

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

                :root {
                    --ink:    #0a0a08;
                    --paper:  #f5f0e8;
                    --accent: #d4440c;
                    --accent2:#1a472a;
                    --muted:  #7a7568;
                    --rule:   #d8d2c4;
                    --card:   #eee9df;
                    --white:  #fafaf7;
                    --green:  #16a34a;
                    --red:    #dc2626;
                }

                .met-wrap {
                    display: flex;
                    flex-direction: column;
                    min-height: calc(100vh - 56px);
                    background: var(--paper);
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 300;
                }

                /* ── TOP BAR ── */
                .met-topbar {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding: 2rem 3rem 1.5rem;
                    border-bottom: 1px solid var(--rule);
                    gap: 2rem;
                    flex-wrap: wrap;
                }

                .met-topbar-left {}

                .met-eyebrow {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: var(--accent);
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .met-eyebrow-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: var(--green);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                .met-title {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(1.6rem, 3vw, 2.4rem);
                    font-weight: 900;
                    line-height: 1;
                    letter-spacing: -0.02em;
                    color: var(--ink);
                }

                .met-title em {
                    font-style: italic;
                    color: var(--accent);
                }

                .met-session-meta {
                    display: flex;
                    gap: 1px;
                    background: var(--rule);
                    border: 1px solid var(--rule);
                    margin-top: 1rem;
                }

                .met-meta-cell {
                    background: var(--paper);
                    padding: 0.5rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                }

                .met-meta-key {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.58rem;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--muted);
                }

                .met-meta-val {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--ink);
                }

                .met-topbar-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 1rem;
                }

                .met-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .met-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                    padding: 0.6rem 1.25rem;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.7rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                    white-space: nowrap;
                }

                .met-btn-secondary {
                    background: var(--card);
                    color: var(--ink);
                    border: 1px solid var(--rule);
                }
                .met-btn-secondary:hover {
                    background: var(--ink);
                    color: var(--paper);
                    border-color: var(--ink);
                }

                .met-btn-primary {
                    background: var(--ink);
                    color: var(--paper);
                }
                .met-btn-primary:hover { background: var(--accent); }

                /* progress */
                .met-progress-row {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .met-progress-block {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    min-width: 160px;
                }

                .met-progress-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .met-progress-text {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--muted);
                }

                .met-progress-count {
                    font-family: 'Playfair Display', serif;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--ink);
                }

                .met-progress-bar {
                    height: 2px;
                    background: var(--rule);
                }

                .met-progress-fill {
                    height: 100%;
                    background: var(--accent);
                    transition: width 0.6s ease;
                }

                .met-legend {
                    display: flex;
                    gap: 1rem;
                }

                .met-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.62rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--muted);
                }

                .met-legend-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                /* ── TABLE ── */
                .met-table-wrap {
                    flex: 1;
                    overflow-x: auto;
                    border-top: 1px solid var(--rule);
                }

                .met-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: max-content;
                }

                .met-table thead tr.met-th-subjects th {
                    background: var(--ink);
                    color: var(--paper);
                    font-family: 'DM Mono', monospace;
                    font-size: 0.68rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 0.75rem 1rem;
                    text-align: center;
                    border-right: 1px solid #2a2a24;
                    white-space: nowrap;
                }

                .met-table thead tr.met-th-subjects th.th-meta {
                    background: var(--card);
                    color: var(--muted);
                    text-align: left;
                    border-right: 1px solid var(--rule);
                }

                .met-table thead tr.met-th-subjects th.th-action {
                    background: var(--card);
                    color: var(--muted);
                    border-right: none;
                }

                .th-subj-code {
                    font-family: 'Playfair Display', serif;
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0;
                    text-transform: none;
                    display: block;
                    color: var(--paper);
                }

                .th-subj-name {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.58rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #9e9b92;
                    display: block;
                    margin-top: 2px;
                }

                .met-table thead tr.met-th-fields th {
                    background: var(--card);
                    color: var(--muted);
                    font-family: 'DM Mono', monospace;
                    font-size: 0.58rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 0.4rem 1rem;
                    border-right: 1px solid var(--rule);
                    border-bottom: 1px solid var(--rule);
                    text-align: center;
                }

                .met-table thead tr.met-th-fields th:last-child {
                    border-right: none;
                }

                /* tbody rows come from MarksEntryRow — apply base styles */
                .met-table tbody tr {
                    border-bottom: 1px solid var(--rule);
                    transition: background 0.15s;
                }

                .met-table tbody tr:hover {
                    background: var(--card);
                }
            `}</style>

            <div className="met-wrap">

                {/* TOP BAR */}
                <div className="met-topbar">
                    <div className="met-topbar-left">
                        <div className="met-eyebrow">
                            <div className="met-eyebrow-dot" />
                           
                        </div>
                        <h1 className="met-title">
                            Marks <em>Entry</em>
                        </h1>
                        <div className="met-session-meta">
                            <div className="met-meta-cell">
                                <span className="met-meta-key">Semester</span>
                                <span className="met-meta-val">{sessionData.semester}</span>
                            </div>
                            <div className="met-meta-cell">
                                <span className="met-meta-key">Department</span>
                                <span className="met-meta-val">{sessionData.department}</span>
                            </div>
                            <div className="met-meta-cell">
                                <span className="met-meta-key">Year</span>
                                <span className="met-meta-val">{sessionData.academicYear}</span>
                            </div>
                            <div className="met-meta-cell">
                                <span className="met-meta-key">Students</span>
                                <span className="met-meta-val">{studentsWithMarks.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="met-topbar-right">
                        <div className="met-actions">
                            <button className="met-btn met-btn-secondary" onClick={handleNewSession}>
                                <RotateCcw size={13} /> New Session
                            </button>
                            <button className="met-btn met-btn-primary" onClick={handleDownloadSheet}>
                                <Download size={13} /> Download Sheet
                            </button>
                        </div>

                        <div className="met-progress-row">
                            <div className="met-progress-block">
                                <div className="met-progress-label">
                                    <span className="met-progress-text">Submitted</span>
                                    <span className="met-progress-count">
                                        {submittedRowIds.length} / {studentsWithMarks.length}
                                    </span>
                                </div>
                                <div className="met-progress-bar">
                                    <div className="met-progress-fill" style={{ width: `${progressPct}%` }} />
                                </div>
                            </div>

                            <div className="met-legend">
                                <div className="met-legend-item">
                                    <div className="met-legend-dot" style={{ background: 'var(--green)' }} />
                                    ≥ 75%
                                </div>
                                <div className="met-legend-item">
                                    <div className="met-legend-dot" style={{ background: 'var(--red)' }} />
                                    &lt; 75%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="met-table-wrap">
                    <table className="met-table">
                        <thead>
                            <tr className="met-th-subjects">
                                <th className="th-meta" style={{ width: '52px', textAlign: 'center' }}>Roll</th>
                                <th className="th-meta" style={{ minWidth: '180px' }}>Student Info</th>
                                {sessionData.subjects.map(subj => (
                                    <th key={subj.id}>
                                        <span className="th-subj-code">{subj.subject_code}</span>
                                        <span className="th-subj-name">{subj.subject_name}</span>
                                    </th>
                                ))}
                                <th className="th-meta" style={{ width: '80px', textAlign: 'center' }}>Total</th>
                                <th className="th-action" style={{ width: '110px', textAlign: 'center' }}>Action</th>
                            </tr>
                            <tr className="met-th-fields">
                                <th></th>
                                <th style={{ textAlign: 'left' }}></th>
                                {sessionData.subjects.map(subj => (
                                    <th key={subj.id}>Mid · End · Asgn · Att%</th>
                                ))}
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <TableBody>
                            {sortedStudents.map((student, idx) => (
                                <MarksEntryRow
                                    key={student.studentId}
                                    student={student}
                                    index={idx}
                                    subjects={sessionData.subjects}
                                    isSubmitted={submittedRowIds.includes(student.studentId)}
                                />
                            ))}
                        </TableBody>
                    </table>
                </div>

            </div>
        </>
    )
}
