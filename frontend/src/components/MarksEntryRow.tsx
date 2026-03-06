import { useState, KeyboardEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

import { TableCell, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
            [subj.id]: {
                midTerm: undefined,
                endTerm: undefined,
                assignment: undefined,
                attendance: undefined
            }
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
                const mid = Number(sVals.midTerm) || 0
                const end = Number(sVals.endTerm) || 0
                const assgn = Number(sVals.assignment) || 0
                grandTotal += mid + end + assgn
            }
        })
    }

    return (
        <TableRow className={`group ${isSubmitted ? 'bg-muted/30 opacity-75 grayscale-[0.5]' : ''}`}>
            <TableCell className="font-medium text-center">{index + 1}</TableCell>
            <TableCell className="whitespace-nowrap">
                <div className="font-semibold">{student.name}</div>
                <div className="text-xs text-muted-foreground">{student.enrollmentNo}</div>
            </TableCell>

            {subjects.map((subj, sIdx) => {
                const sVals = formValues?.[subj.id] || {}
                const attend = Number(sVals.attendance) || 0
                const hasAttend = sVals.attendance !== undefined && String(sVals.attendance) !== "" && sVals.attendance !== null
                const attendColor = !hasAttend ? "" : attend < 75 ? "bg-destructive/20 text-destructive border-destructive" : "bg-green-500/20 text-green-600 border-green-500/50"

                const isVeryLastInput = sIdx === subjects.length - 1

                return (
                    <TableCell key={subj.id} className="min-w-[140px] border-l border-r border-border/50 bg-card/50">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase text-muted-foreground w-8 text-right">Mid</span>
                                <Input
                                    id={`input-row-${index}-subj-${sIdx}-mid`}
                                    type="number"
                                    disabled={isSubmitted || isSaving}
                                    {...(register as any)(`${subj.id}.midTerm`)}
                                    className="h-7 text-xs flex-1 text-center"
                                    placeholder="/30"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase text-muted-foreground w-8 text-right">End</span>
                                <Input
                                    type="number"
                                    disabled={isSubmitted || isSaving}
                                    {...(register as any)(`${subj.id}.endTerm`)}
                                    className="h-7 text-xs flex-1 text-center"
                                    placeholder="/50"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase text-muted-foreground w-8 text-right">Asg</span>
                                <Input
                                    type="number"
                                    disabled={isSubmitted || isSaving}
                                    {...(register as any)(`${subj.id}.assignment`)}
                                    className="h-7 text-xs flex-1 text-center"
                                    placeholder="/20"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase text-muted-foreground w-8 text-right">Att%</span>
                                <Input
                                    type="number"
                                    disabled={isSubmitted || isSaving}
                                    {...(register as any)(`${subj.id}.attendance`)}
                                    onKeyDown={(e) => handleKeyDown(e, isVeryLastInput)}
                                    className={`h-7 text-xs flex-1 text-center transition-colors ${attendColor}`}
                                    placeholder="%"
                                />
                            </div>

                            {errors[subj.id] && (
                                <div className="text-[9px] text-destructive leading-tight">
                                    Invalid values
                                </div>
                            )}
                        </div>
                    </TableCell>
                )
            })}

            <TableCell className="font-mono text-center text-lg font-bold border-l">
                {grandTotal}
            </TableCell>

            <TableCell className="text-center p-2">
                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-green-600 space-y-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-[10px] font-medium leading-tight">Saved &<br />Notified ✓</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => unsubmitRow(student.studentId)}
                        >
                            Re-submit
                        </Button>
                    </div>
                ) : isSaving ? (
                    <div className="flex flex-col items-center justify-center text-primary space-y-1">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-[10px] font-medium">Saving...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-2">
                        <Button
                            size="sm"
                            onClick={handleSubmit(onSubmit)}
                            className="h-8 w-full shadow-md bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="h-3 w-3 mr-1" />
                            Submit
                        </Button>
                        {errorStatus && <span className="text-[10px] text-destructive font-medium">{errorStatus}</span>}
                    </div>
                )}
            </TableCell>
        </TableRow>
    )
}
