import { useEffect, useState } from 'react'
import { Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { DashboardApi } from '@/lib/api'
import { Department, Subject } from '@/types/dashboard'

const semesters = [1, 2, 3, 4, 5, 6, 7, 8]

export function CatalogManager() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedDept, setSelectedDept] = useState<string>('')
    const [selectedSemester, setSelectedSemester] = useState<number>(6)

    const [newDeptName, setNewDeptName] = useState('')
    const [subjectForm, setSubjectForm] = useState({ subject_code: '', subject_name: '', credit: 3 })

    const [loadingDeps, setLoadingDeps] = useState(false)
    const [loadingSubs, setLoadingSubs] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const showMessage = (msg: string) => {
        setMessage(msg)
        setTimeout(() => setMessage(null), 2500)
    }

    const loadDepartments = async () => {
        setLoadingDeps(true)
        try {
            const list = await DashboardApi.listDepartments()
            setDepartments(list)
            if (!selectedDept && list.length > 0) setSelectedDept(list[0].name)
        } catch (err: any) {
            showMessage(err.message || 'Failed to load departments')
        } finally {
            setLoadingDeps(false)
        }
    }

    const loadSubjects = async (dept = selectedDept, sem = selectedSemester) => {
        if (!dept) {
            setSubjects([])
            return
        }
        setLoadingSubs(true)
        try {
            const list = await DashboardApi.listSubjects({ department: dept, semester: sem })
            setSubjects(list)
        } catch (err: any) {
            showMessage(err.message || 'Failed to load subjects')
        } finally {
            setLoadingSubs(false)
        }
    }

    useEffect(() => {
        loadDepartments()
    }, [])

    useEffect(() => {
        loadSubjects()
    }, [selectedDept, selectedSemester])

    const addDepartment = async () => {
        if (!newDeptName.trim()) return
        try {
            const dep = await DashboardApi.addDepartment(newDeptName.trim())
            setDepartments((prev) => [...prev, dep].sort((a, b) => a.name.localeCompare(b.name)))
            setSelectedDept(dep.name)
            setNewDeptName('')
            showMessage('Department added')
        } catch (err: any) {
            showMessage(err.message || 'Could not add department')
        }
    }

    const deleteDepartment = async (id: string) => {
        const dep = departments.find((d) => d.id === id)
        if (!dep) return
        if (!window.confirm(`Delete department "${dep.name}"? (Remove its subjects first if any.)`)) return
        try {
            await DashboardApi.deleteDepartment(id)
            const remaining = departments.filter((d) => d.id !== id)
            setDepartments(remaining)
            if (selectedDept === dep.name) {
                setSelectedDept(remaining[0]?.name || '')
                setSubjects([])
            }
            showMessage('Department removed')
        } catch (err: any) {
            showMessage(err.message || 'Could not delete department')
        }
    }

    const addSubject = async () => {
        if (!selectedDept) {
            showMessage('Pick a department first')
            return
        }
        if (!subjectForm.subject_code.trim() || !subjectForm.subject_name.trim()) {
            showMessage('Code and name are required')
            return
        }
        try {
            await DashboardApi.addSubject({
                ...subjectForm,
                department: selectedDept,
                semester: selectedSemester,
                credit: Number(subjectForm.credit) || 0
            })
            setSubjectForm({ subject_code: '', subject_name: '', credit: subjectForm.credit || 3 })
            showMessage('Subject added')
            loadSubjects()
        } catch (err: any) {
            showMessage(err.message || 'Could not add subject')
        }
    }

    const deleteSubject = async (id: string) => {
        if (!window.confirm('Delete this subject? This will remove it from future sessions.')) return
        try {
            await DashboardApi.deleteSubject(id)
            setSubjects((prev) => prev.filter((s) => s.id !== id))
            showMessage('Subject removed')
        } catch (err: any) {
            showMessage(err.message || 'Could not delete subject')
        }
    }

    return (
        <div className="catalog-card">
            <style>{`
                .catalog-card {
                    background: var(--paper);
                    border: 1px solid var(--rule);
                    padding: 1.5rem;
                    border-radius: 16px;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.03);
                    color: var(--ink);
                }
                .catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 1rem;
                }
                .cat-section h4 {
                    margin: 0 0 0.35rem;
                    font-family: 'DM Mono', monospace;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    font-size: 0.68rem;
                    color: var(--ink);
                }
                .pill-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--accent);
                    color: var(--paper);
                    border: 1px solid var(--accent);
                    padding: 0.42rem 0.9rem;
                    border-radius: 999px;
                    cursor: pointer;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.7rem;
                    letter-spacing: 0.06em;
                    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
                }
                .pill-btn.secondary {
                    background: transparent;
                    color: var(--ink);
                    border: 1px solid var(--rule);
                }
                .pill-btn:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
                .pill-btn.secondary:hover { background: var(--card); }
                .cat-list {
                    border: 1px solid var(--rule);
                    border-radius: 10px;
                    background: var(--white);
                    max-height: 240px;
                    overflow: auto;
                }
                .cat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0.75rem;
                    border-bottom: 1px solid var(--rule);
                    background: var(--white);
                    transition: background 0.12s ease;
                }
                .cat-row:hover { background: #f8f3eb; }
                .cat-row:last-child { border-bottom: none; }
                .cat-row button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--red);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                }
                .cat-row strong { font-family: 'DM Mono', monospace; }
                .subject-form {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .cat-input {
                    width: 100%;
                    padding: 0.55rem 0.65rem;
                    border: 1px solid var(--rule);
                    background: var(--paper);
                    color: var(--ink);
                    font-family: 'DM Sans', sans-serif;
                    border-radius: 8px;
                }
                .cat-input::placeholder {
                    color: var(--ink);
                    opacity: 0.65;
                }
                .subjects-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 0.5rem;
                    background: var(--white);
                    border: 1px solid var(--rule);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .subjects-table th, .subjects-table td {
                    border-bottom: 1px solid var(--rule);
                    padding: 0.45rem 0.6rem;
                    text-align: left;
                    font-size: 0.9rem;
                    color: var(--ink);
                }
                .subjects-table th {
                    background: #f8f3eb;
                    font-family: 'DM Mono', monospace;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    font-size: 0.68rem;
                    color: var(--ink);
                }
                .chip {
                    background: #f8f3eb;
                    border: 1px dashed var(--rule);
                    padding: 0.25rem 0.5rem;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-family: 'DM Mono', monospace;
                }
                .status {
                    margin-left: 0.75rem;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.7rem;
                    color: var(--muted);
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontFamily: 'Playfair Display', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Catalog Manager</h3>
                    <span className="status">
                        {loadingDeps || loadingSubs ? 'Loading…' : message || ''}
                    </span>
                </div>
                <button className="pill-btn secondary" onClick={() => { loadDepartments(); loadSubjects(); }}>
                    <RefreshCcw size={14} /> Refresh
                </button>
            </div>

            <div className="catalog-grid">
                {/* Departments */}
                <div className="cat-section">
                    <h4>Departments</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            className="cat-input"
                            placeholder="Add new department"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                        />
                        <button className="pill-btn" onClick={addDepartment}><Plus size={14} /> Add</button>
                    </div>
                    <div className="cat-list">
                        {departments.map((dep) => (
                            <div key={dep.id} className="cat-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="radio"
                                        checked={selectedDept === dep.name}
                                        onChange={() => setSelectedDept(dep.name)}
                                    />
                                    <strong>{dep.name}</strong>
                                </div>
                                <button onClick={() => deleteDepartment(dep.id)}>
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        ))}
                        {departments.length === 0 && (
                            <div className="cat-row" style={{ justifyContent: 'center', color: 'var(--muted)' }}>
                                No departments yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Subjects */}
                <div className="cat-section">
                    <h4>Subjects</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <select className="cat-input" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                            <option value="">Select department</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                        <select className="cat-input" value={selectedSemester} onChange={(e) => setSelectedSemester(Number(e.target.value))}>
                            {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                    </div>

                    <div className="subject-form">
                        <input
                            className="cat-input"
                            placeholder="Subject Code"
                            value={subjectForm.subject_code}
                            onChange={(e) => setSubjectForm((f) => ({ ...f, subject_code: e.target.value }))}
                        />
                        <input
                            className="cat-input"
                            placeholder="Subject Name"
                            value={subjectForm.subject_name}
                            onChange={(e) => setSubjectForm((f) => ({ ...f, subject_name: e.target.value }))}
                        />
                        <input
                            className="cat-input"
                            type="number"
                            placeholder="Credit"
                            value={subjectForm.credit}
                            onChange={(e) => setSubjectForm((f) => ({ ...f, credit: Number(e.target.value) }))}
                        />
                        <button className="pill-btn" onClick={addSubject} style={{ justifyContent: 'center' }}>
                            <Plus size={14} /> Add Subject
                        </button>
                    </div>

                    <table className="subjects-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Code</th>
                                <th>Name</th>
                                <th style={{ width: '80px' }}>Credit</th>
                                <th style={{ width: '90px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subj) => (
                                <tr key={subj.id}>
                                    <td>{subj.subject_code}</td>
                                    <td>{subj.subject_name}</td>
                                    <td>{subj.credit}</td>
                                    <td>
                                        <button onClick={() => deleteSubject(subj.id)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                        {selectedDept ? 'No subjects for this semester yet.' : 'Select a department to view subjects.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
