import { useState, useEffect } from 'react'
import * as xlsx from 'xlsx'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { DashboardApi } from '@/lib/api'
import { useDashboardStore } from '@/store/useDashboardStore'
import { StudentPreview } from '@/types/dashboard'
import { CatalogManager } from './CatalogManager'

const normalizeCell = (value: any): string => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString()
  return String(value).trim()
}

const setupSchema = z.object({
  semester: z.number().min(1).max(8),
  department: z.string().min(1),
  academicYear: z.string().min(4, "Invalid Academic Year"),
  collegeName: z.string().optional(),
})

type SetupFormValues = z.infer<typeof setupSchema>

export function SessionSetup() {
  const navigate = useNavigate()
  const { setSessionData, setStudentsWithMarks } = useDashboardStore()

  const [file, setFile] = useState<File | null>(null)
  const [parsedStudents, setParsedStudents] = useState<StudentPreview[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })
  const [dragOver, setDragOver] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [loadingDeps, setLoadingDeps] = useState(false)

  const [formData, setFormData] = useState({
    semester: false,
    deptYear: false,
    file: false
  })

  const { register, handleSubmit, setValue, watch } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      semester: 6,
      department: "AI & Robotics",
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(2),
      collegeName: ''
    }
  })

  const watchedFields = watch()

  useEffect(() => {
    setFormData({
      semester: !!watchedFields.semester,
      deptYear: !!(watchedFields.department && watchedFields.academicYear),
      file: parsedStudents.length > 0
    })
  }, [watchedFields.semester, watchedFields.department, watchedFields.academicYear, parsedStudents.length])

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDeps(true)
      try {
        const list = await DashboardApi.listDepartments()
        const names = list.map((d) => d.name)
        setDepartments(names)
        if (!watchedFields.department && names.length > 0) {
          setValue('department', names[0])
        }
      } catch (err) {
        console.warn('Failed to load departments', err)
      } finally {
        setLoadingDeps(false)
      }
    }
    loadDepartments()
  }, [])

  const onSemesterChange = (val: string) => setValue('semester', parseInt(val))

  const processFile = async (uploadedFile: File) => {
    const fileName = uploadedFile.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      showToast("Please upload a valid .xlsx or .xls file")
      return
    }

    setFile(uploadedFile)
    setIsParsing(true)
    setError(null)
    setParsedStudents([])

    try {
      const data = await uploadedFile.arrayBuffer()
      const workbook = xlsx.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false })

      const students: StudentPreview[] = []

      jsonData.forEach((row: any) => {
        const keys = Object.keys(row)
        const lowerKey = (k: string) => k.toLowerCase()
        const nameKey = keys.find(k => lowerKey(k).includes('name'))
        const enrKey = keys.find(k => lowerKey(k).includes('enrollment') || lowerKey(k).includes('roll'))
        const emailKey = keys.find(k => lowerKey(k).includes('mail'))
        const phoneKey = keys.find(k => {
          const lower = lowerKey(k)
          return lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('whatsapp')
        })

        if (nameKey && enrKey) {
          const student: StudentPreview = {
            name: normalizeCell(row[nameKey]),
            enrollmentNo: normalizeCell(row[enrKey])
          }
          const emailValue = emailKey ? normalizeCell(row[emailKey]) : ''
          if (emailValue) student.email = emailValue
          const phoneValue = phoneKey ? normalizeCell(row[phoneKey]) : ''
          if (phoneValue) student.phone = phoneValue.replace(/[^0-9+]/g, '')
          students.push(student)
        }
      })

      if (students.length === 0) {
        throw new Error('Could not find Name and Enrollment No columns in spreadsheet.')
      }

      setParsedStudents(students)
      showToast(`✓ Parsed ${students.length} students successfully`)
    } catch (err: any) {
      setError(err.message || "Failed to parse excel file.")
      showToast(err.message || "Failed to parse file")
    } finally {
      setIsParsing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) processFile(uploadedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) processFile(dropped)
  }

  const showToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 3500)
  }

  const onSubmit = async (data: SetupFormValues) => {
    if (parsedStudents.length === 0) {
      setError("Please upload a valid Excel file with students list first.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await DashboardApi.createSession({
        ...data,
        students: parsedStudents
      })

      if (!res.subjects || res.subjects.length === 0) {
        throw new Error('No subjects returned for this semester/department')
      }

      setSessionData({
        sessionId: res.sessionId,
        semester: data.semester,
        department: data.department,
        academicYear: data.academicYear,
        excelUrl: res.excelUrl,
        subjects: res.subjects
      })

      setStudentsWithMarks(res.studentsWithMarks)
      setSuccess(true)
      showToast("✓ Session created successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to generate session.")
      showToast(err.message || "Failed to create session")
      setIsSubmitting(false)
    }
  }

  const allValid = formData.semester && formData.deptYear && formData.file

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

        .session-page-wrap {
          min-height: calc(100vh - 56px);
          background: var(--paper);
          display: flex;
        }

        .session-form-card {
          background: var(--paper);
          display: flex;
          flex-direction: column;
          width: 100%;
          flex: 1;
        }

        .srp-header {
          padding: 3rem 5rem 2.5rem;
          border-bottom: 1px solid var(--rule);
        }

        .srp-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }

        .srp-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--ink);
        }

        .srp-title em {
          font-style: italic;
          color: var(--accent);
        }

        .srp-manage {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          background: var(--ink);
          color: var(--paper);
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
        }

        .srp-sub {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          font-size: 0.82rem;
          color: var(--muted);
          margin-top: 0.4rem;
          line-height: 1.6;
        }

        .srp-body {
          padding: 2.5rem 5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .field-row-grid {
          display: grid;
          gap: 1px;
          background: var(--rule);
          border: 1px solid var(--rule);
          margin-bottom: 1px;
        }
        .field-row-grid.two-col { grid-template-columns: 1fr 1fr 1fr 1fr; }

        .field-cell {
          background: var(--paper);
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          transition: background 0.15s;
        }
        .field-cell:focus-within { background: var(--white); }

        .field-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .field-lbl .req { color: var(--accent); }

        .field-inp, .field-sel {
          border: none;
          background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--ink);
          outline: none;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
        }
        .field-inp::placeholder { color: var(--muted); font-weight: 400; }

        .sel-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .sel-wrap::after {
          content: '▾';
          position: absolute;
          right: 0;
          font-size: 0.65rem;
          color: var(--muted);
          pointer-events: none;
        }
        .sel-wrap .field-sel { padding-right: 1rem; }

        .upload-zone-ed {
          background: var(--paper);
          border: 2px dashed var(--rule);
          padding: 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
          margin-bottom: 1px;
        }
        .upload-zone-ed:hover,
        .upload-zone-ed.drag-over {
          border-color: var(--accent);
          background: var(--card);
        }
        .upload-zone-ed input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .upload-icon-box {
          width: 44px;
          height: 44px;
          border: 1px solid var(--rule);
          background: var(--card);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: border-color 0.2s;
        }
        .upload-zone-ed:hover .upload-icon-box { border-color: var(--accent); background: var(--paper); }

        .upload-txt {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--ink);
          text-align: center;
        }
        .upload-txt .hl { color: var(--accent); }

        .upload-hint-txt {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .upload-filename {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--accent2);
          letter-spacing: 0.06em;
        }

        .val-strip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1rem;
          background: var(--card);
          border: 1px solid var(--rule);
        }

        .val-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--rule);
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .val-dot.ok { background: var(--green); }

        .val-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .val-spacer { margin-left: 1rem; }

        .srp-footer {
          padding: 1.5rem 5rem 2.5rem;
          border-top: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .srp-footer-hint {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          max-width: 24ch;
          line-height: 1.5;
        }

        .confirm-btn-ed {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 0.85rem 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .confirm-btn-ed:hover { background: var(--accent); }
        .confirm-btn-ed:disabled {
          background: var(--rule);
          color: var(--muted);
          cursor: not-allowed;
        }
        .confirm-btn-ed .arr {
          display: inline-block;
          transition: transform 0.2s;
        }
        .confirm-btn-ed:not(:disabled):hover .arr {
          transform: translateX(4px);
        }

        .success-panel-ed {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 2.5rem;
          flex: 1;
          gap: 1.25rem;
          animation: edFadeIn 0.5s ease both;
        }

        @keyframes edFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .success-check-box {
          width: 56px;
          height: 56px;
          border: 2px solid var(--accent2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: var(--accent2);
        }

        .success-title-ed {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--ink);
        }

        .success-sub-ed {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.6;
          max-width: 30ch;
        }

        .meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--rule);
          border: 1px solid var(--rule);
          width: 100%;
          margin-top: 0.5rem;
        }

        .meta-cell-ed {
          background: var(--paper);
          padding: 1rem;
          text-align: center;
        }

        .meta-val-ed {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1;
          color: var(--ink);
        }

        .meta-lbl-ed {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 0.25rem;
        }

        .proceed-btn-ed {
          background: var(--accent);
          color: var(--paper);
          border: none;
          padding: 0.85rem 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }
        .proceed-btn-ed:hover { background: #b83800; }

        .toast-ed {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--ink);
          color: var(--paper);
          padding: 1rem 1.5rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          border-left: 3px solid var(--accent);
          transform: translateY(120%);
          opacity: 0;
          transition: transform 0.4s ease, opacity 0.4s ease;
          z-index: 200;
          max-width: 300px;
        }
        .toast-ed.show {
          transform: translateY(0);
          opacity: 1;
        }
      `}</style>

      <div className="session-page-wrap">
        <div className="session-form-card">

          {success ? (
            <div className="success-panel-ed">
              <div className="success-check-box">✓</div>
              <h2 className="success-title-ed">Session Created</h2>
              <p className="success-sub-ed">
                Roster parsed and students upserted. Your marks entry grid is ready.
              </p>
              <div className="meta-strip">
                <div className="meta-cell-ed">
                  <div className="meta-val-ed">{watchedFields.semester}</div>
                  <div className="meta-lbl-ed">Semester</div>
                </div>
                <div className="meta-cell-ed">
                  <div className="meta-val-ed" style={{ fontSize: '1rem' }}>
                    {watchedFields.department?.slice(0, 8)}{(watchedFields.department?.length ?? 0) > 8 ? '…' : ''}
                  </div>
                  <div className="meta-lbl-ed">Dept</div>
                </div>
                <div className="meta-cell-ed">
                  <div className="meta-val-ed">{watchedFields.academicYear?.slice(0, 7)}</div>
                  <div className="meta-lbl-ed">Year</div>
                </div>
                <div className="meta-cell-ed">
                  <div className="meta-val-ed">{parsedStudents.length}</div>
                  <div className="meta-lbl-ed">Students</div>
                </div>
              </div>
              <button className="proceed-btn-ed" onClick={() => navigate('/dashboard')}>
                Proceed to Marks Entry →
              </button>
            </div>
          ) : (
            <>
              <div className="srp-header">
                <h2 className="srp-title">New <em>Assessment</em> Session</h2>
                <p className="srp-sub">Configure semester details and upload the student roster Excel sheet.</p>
                <button type="button" className="srp-manage" onClick={() => setShowCatalog(v => !v)}>
                  {showCatalog ? 'Hide catalog manager' : 'Manage departments & subjects'}
                </button>
              </div>

              {showCatalog && (
                <div style={{ padding: '0 5rem 0' }}>
                  <CatalogManager />
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="srp-body">

                  <div className="field-row-grid two-col">
                    <div className="field-cell">
                      <label className="field-lbl">Semester <span className="req">*</span></label>
                      <div className="sel-wrap">
                        <select className="field-sel" defaultValue="6" onChange={(e) => onSemesterChange(e.target.value)}>
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field-cell">
                      <label className="field-lbl">Department <span className="req">*</span></label>
                      <div className="sel-wrap">
                        <select
                          className="field-sel"
                          value={watchedFields.department || ''}
                          onChange={(e) => setValue('department', e.target.value)}
                          disabled={loadingDeps}
                        >
                          <option value="" disabled>{loadingDeps ? 'Loading departments…' : 'Select department'}</option>
                          {departments.map((dep) => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field-cell">
                      <label className="field-lbl">Academic Year <span className="req">*</span></label>
                      <input {...register('academicYear')} className="field-inp" placeholder="e.g. 2026-27" />
                    </div>
                    <div className="field-cell">
                      <label className="field-lbl">College Name <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
                      <input {...register('collegeName')} className="field-inp" placeholder="Optional — for branding" />
                    </div>
                  </div>

                  <div className="field-row-grid" style={{ marginTop: '1rem' }}>
                    <div className="field-cell" style={{ paddingBottom: '0.5rem' }}>
                      <label className="field-lbl">Student List (Excel Upload) <span className="req">*</span></label>
                    </div>
                  </div>

                  <div
                    className={`upload-zone-ed ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isParsing || isSubmitting} />
                    <div className="upload-icon-box">
                      {isParsing ? '⏳' : file ? '📊' : '📄'}
                    </div>
                    <div className="upload-txt">
                      {isParsing ? 'Parsing file…' : <><span className="hl">Click to upload</span> or drag and drop</>}
                    </div>
                    <div className="upload-hint-txt">XLSX or XLS only — max 10 MB</div>
                    {file && !isParsing && (
                      <div className="upload-filename">
                        ✓ {file.name}{parsedStudents.length > 0 && ` — ${parsedStudents.length} students found`}
                      </div>
                    )}
                  </div>

                  <div className="val-strip">
                    <div className={`val-dot ${formData.semester ? 'ok' : ''}`} />
                    <span className="val-lbl">Semester</span>
                    <div className={`val-dot val-spacer ${formData.deptYear ? 'ok' : ''}`} />
                    <span className="val-lbl">Dept + Year</span>
                    <div className={`val-dot val-spacer ${formData.file ? 'ok' : ''}`} />
                    <span className="val-lbl">{formData.file ? `${parsedStudents.length} students` : 'No file'}</span>
                  </div>

                </div>

                <div className="srp-footer">
                  <p className="srp-footer-hint">Students will be upserted — re-uploads are safe.</p>
                  <button type="submit" disabled={!allValid || isSubmitting} className="confirm-btn-ed">
                    {isSubmitting ? 'Creating…' : <>Confirm & Generate Sheet <span className="arr">→</span></>}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>

      <div className={`toast-ed ${toast.show ? 'show' : ''}`}>
        {toast.message}
      </div>
    </>
  )
}
