import { useState, KeyboardEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

import { StudentRow, Subject } from '@/types/dashboard'
import { useDashboardStore } from '@/store/useDashboardStore'
import { DashboardApi } from '@/lib/api'

const subjectMarksSchema = z.object({
    midTerm: z.coerce.number().min(0).max(30).optional(),
    endTerm: z.coerce.number().min(0).max(50).optional(),
    assignment: z.coerce.number().min(0).max(20).optional(),
    attendance: z.coerce.number().min(0).max(100).optional(),
})

const rowSchema = z.record(z.string(), subjectMarksSchema)
type RowFormValues = Record<string, { midTerm?: number; endTerm?: number; assignment?: number; attendance?: number }>

interface MarksEntryRowProps {
    student: StudentRow
    index: number
    subjects: Subject[]
    isSubmitted: boolean
}

export function MarksEntryRow({ student, index, subjects, isSubmitted }: MarksEntryRowProps) {
    const { sessionData, markRowSubmitted, unsubmitRow } = useDashboardStore()
    const [isSaving, setIsSaving] = useState(false)
    const [errorStatus, setErrorStatus] = useState<string | null>(null)

    const { register, handleSubmit, control, formState: { errors } } = useForm<RowFormValues>({
        resolver: zodResolver(rowSchema) as any,
        defaultValues: subjects.reduce((acc, subj) => ({
            ...acc,
            [subj.id]: { midTerm: undefined, endTerm: undefined, assignment: undefined, attendance: undefined }
        }), {} as RowFormValues)
    })

    const formValues = useWatch({ control })

    const onSubmit = async (data: RowFormValues) => {
        if (!sessionData) return
        setIsSaving(true)
        setErrorStatus(null)

        const subjectMarksArray = subjects.map(subj => {
            const marks = data[subj.id]
            return {
                subjectId: subj.id,
                midTerm: marks?.midTerm,
                endTerm: marks?.endTerm,
                assignment: marks?.assignment,
                attendance: marks?.attendance
            }
        })

        try {
            const res = await DashboardApi.submitRow({
                sessionId: sessionData.sessionId,
                studentId: student.studentId,
                subjectMarks: subjectMarksArray
            })

            if (res.success) {
                markRowSubmitted(student.studentId)
                setTimeout(() => {
                    const nextRowInputId = `input-row-${index + 1}-subj-0-mid`
                    const el = document.getElementById(nextRowInputId)
                    if (el) el.focus()
                }, 100)
            } else {
                setErrorStatus(res.message || 'Failed')
            }
        } catch (err) {
            setErrorStatus('Network Error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, isLastInput: boolean) => {
        if (e.key === 'Enter' && isLastInput) {
            e.preventDefault()
            handleSubmit(onSubmit)()
        }
    }

    let grandTotal = 0
    if (formValues) {
        subjects.forEach(subj => {
            const sVals = formValues[subj.id]
            if (sVals) {
                grandTotal += (Number(sVals.midTerm) || 0) + (Number(sVals.endTerm) || 0) + (Number(sVals.assignment) || 0)
            }
        })
    }

    return (
        <>
            <style>{`
                .mer-row {
                    border-bottom: 1px solid var(--rule);
                    transition: background 0.15s;
                }
                .mer-row:hover { background: var(--card); }
                .mer-row.submitted { background: #f0f7f2; opacity: 0.85; }

                .mer-td {
                    padding: 0;
                    vertical-align: middle;
                    border-right: 1px solid var(--rule);
                }
                .mer-td:last-child { border-right: none; }

                .mer-roll {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #0a0a08 !important;
                    text-align: center;
                    padding: 0 1rem;
                    width: 52px;
                }

                .mer-student {
                    padding: 0.85rem 1rem;
                    min-width: 180px;
                }

                .mer-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #0a0a08 !important;
                    -webkit-text-fill-color: #0a0a08 !important;
                    line-height: 1.2;
                }

                .mer-enroll {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.62rem;
                    color: var(--muted);
                    margin-top: 2px;
                    letter-spacing: 0.06em;
                }

                .mer-marks-cell {
                    padding: 0.6rem 0.75rem;
                    vertical-align: middle;
                    border-right: 1px solid var(--rule);
                    min-width: 200px;
                }

                .mer-fields {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .mer-field {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .mer-field-label {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--muted);
                    width: 2.5rem;
                    text-align: right;
                    flex-shrink: 0;
                }

                .mer-input-wrap {
                    display: flex;
                    align-items: center;
                    background: var(--paper);
                    border: 1px solid var(--rule);
                    transition: border-color 0.2s;
                    flex: 1;
                }
                .mer-input-wrap:focus-within { border-color: var(--accent); }
                .mer-input-wrap.att-ok { border-color: var(--green); background: #f0f7f2; }
                .mer-input-wrap.att-bad { border-color: var(--red); background: #fef2f2; }

                .mer-input {
                    width: 100%;
                    padding: 0.3rem 0.4rem;
                    border: none;
                    background: transparent;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #0a0a08 !important;
                    -webkit-text-fill-color: #0a0a08 !important;
                    outline: none;
                    text-align: center;
                    -moz-appearance: textfield;
                }
                .mer-input::-webkit-outer-spin-button,
                .mer-input::-webkit-inner-spin-button { -webkit-appearance: none; }
                .mer-input::placeholder { color: var(--muted); font-weight: 400; -webkit-text-fill-color: var(--muted); }
                .mer-input:disabled { opacity: 0.5; cursor: not-allowed; }

                .mer-input-max {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.62rem;
                    color: var(--muted);
                    padding: 0 0.35rem;
                    border-left: 1px solid var(--rule);
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .mer-total {
                    text-align: center;
                    padding: 0 1rem;
                    vertical-align: middle;
                    width: 80px;
                    border-right: 1px solid var(--rule);
                }

                .mer-total-num {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0a0a08 !important;
                    -webkit-text-fill-color: #0a0a08 !important;
                    line-height: 1;
                }

                .mer-total-denom {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.55rem;
                    color: var(--muted);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-top: 2px;
                }

                .mer-action {
                    text-align: center;
                    padding: 0 0.75rem;
                    vertical-align: middle;
                    width: 110px;
                }

                .mer-btn-submit {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    background: var(--accent);
                    color: var(--white);
                    border: none;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .mer-btn-submit:hover { background: #b83800; }

                .mer-btn-resubmit {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 0.35rem 0.5rem;
                    background: transparent;
                    color: var(--muted);
                    border: 1px solid var(--rule);
                    font-family: 'DM Mono', monospace;
                    font-size: 0.6rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    cursor: pointer;
                    margin-top: 0.35rem;
                    transition: background 0.2s, color 0.2s;
                }
                .mer-btn-resubmit:hover { background: var(--card); color: var(--ink); }

                .mer-saved {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .mer-saved-label {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.6rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--accent2);
                    text-align: center;
                    line-height: 1.4;
                }

                .mer-saving {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .mer-saving-label {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.6rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--muted);
                }

                .mer-error {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.6rem;
                    color: var(--red);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-top: 0.25rem;
                    text-align: center;
                }
            `}</style>

            <tr className={`mer-row ${isSubmitted ? 'submitted' : ''}`}>
                {/* Roll */}
                <td className="mer-td mer-roll">{index + 1}</td>

                {/* Student */}
                <td className="mer-td mer-student">
                    <div className="mer-name">{student.name}</div>
                    <div className="mer-enroll">{student.enrollmentNo}</div>
                </td>

                {/* Marks per subject */}
                {subjects.map((subj, sIdx) => {
                    const sVals = formValues?.[subj.id] || {}
                    const attend = Number(sVals.attendance) || 0
                    const hasAttend = sVals.attendance !== undefined && String(sVals.attendance) !== '' && sVals.attendance !== null
                    const attClass = !hasAttend ? '' : attend < 75 ? 'att-bad' : 'att-ok'
                    const isVeryLastInput = sIdx === subjects.length - 1

                    return (
                        <td key={subj.id} className="mer-td mer-marks-cell">
                            <div className="mer-fields">
                                <div className="mer-field">
                                    <label className="mer-field-label">Mid</label>
                                    <div className="mer-input-wrap">
                                        <input
                                            id={`input-row-${index}-subj-${sIdx}-mid`}
                                            type="number"
                                            disabled={isSubmitted || isSaving}
                                            {...(register as any)(`${subj.id}.midTerm`)}
                                            className="mer-input"
                                            placeholder="—"
                                        />
                                        <span className="mer-input-max">/30</span>
                                    </div>
                                </div>
                                <div className="mer-field">
                                    <label className="mer-field-label">End</label>
                                    <div className="mer-input-wrap">
                                        <input
                                            type="number"
                                            disabled={isSubmitted || isSaving}
                                            {...(register as any)(`${subj.id}.endTerm`)}
                                            className="mer-input"
                                            placeholder="—"
                                        />
                                        <span className="mer-input-max">/50</span>
                                    </div>
                                </div>
                                <div className="mer-field">
                                    <label className="mer-field-label">Asgn</label>
                                    <div className="mer-input-wrap">
                                        <input
                                            type="number"
                                            disabled={isSubmitted || isSaving}
                                            {...(register as any)(`${subj.id}.assignment`)}
                                            className="mer-input"
                                            placeholder="—"
                                        />
                                        <span className="mer-input-max">/20</span>
                                    </div>
                                </div>
                                <div className="mer-field">
                                    <label className="mer-field-label">Att%</label>
                                    <div className={`mer-input-wrap ${attClass}`}>
                                        <input
                                            type="number"
                                            disabled={isSubmitted || isSaving}
                                            {...(register as any)(`${subj.id}.attendance`)}
                                            onKeyDown={(e) => handleKeyDown(e, isVeryLastInput)}
                                            className="mer-input"
                                            placeholder="—"
                                        />
                                        <span className="mer-input-max">%</span>
                                    </div>
                                </div>
                            </div>
                            {errors[subj.id] && (
                                <div className="mer-error">Invalid values</div>
                            )}
                        </td>
                    )
                })}

                {/* Grand Total */}
                <td className="mer-td mer-total">
                    <div className="mer-total-num">{grandTotal}</div>
                    <div className="mer-total-denom">/{subjects.length * 100}</div>
                </td>

                {/* Action */}
                <td className="mer-td mer-action">
                    {isSubmitted ? (
                        <div className="mer-saved">
                            <CheckCircle2 size={16} color="var(--accent2)" />
                            <span className="mer-saved-label">Saved &<br />Notified ✓</span>
                            <button className="mer-btn-resubmit" onClick={() => unsubmitRow(student.studentId)}>
                                Re-submit
                            </button>
                        </div>
                    ) : isSaving ? (
                        <div className="mer-saving">
                            <Loader2 size={16} color="var(--muted)" className="animate-spin" />
                            <span className="mer-saving-label">Saving…</span>
                        </div>
                    ) : (
                        <div>
                            <button className="mer-btn-submit" onClick={handleSubmit(onSubmit)}>
                                <Send size={11} /> Submit
                            </button>
                            {errorStatus && <div className="mer-error">{errorStatus}</div>}
                        </div>
                    )}
                </td>
            </tr>
        </>
    )
}
