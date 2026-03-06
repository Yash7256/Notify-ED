import { Download, FileSpreadsheet, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import { useDashboardStore } from '@/store/useDashboardStore'
import { MarksEntryRow } from './MarksEntryRow'

export function MarksEntryTable() {
    const { sessionData, studentsWithMarks, submittedRowIds, resetDashboard } = useDashboardStore()
    const navigate = useNavigate()

    if (!sessionData) return null

    // Sort students by enrollment number ascending
    const sortedStudents = [...studentsWithMarks].sort((a, b) =>
        a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' })
    )

    const handleDownloadSheet = () => {
        window.open(sessionData.excelUrl, '_blank')
    }

    const handleNewSession = () => {
        const confirmed = window.confirm('Are you sure? This will clear the current session from this view. Submitted marks are already saved.')
        if (!confirmed) return
        resetDashboard()
        navigate('/dashboard')
    }

    return (
        <Card className="w-full border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Marks Entry Grid Active
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Semester {sessionData.semester} • {sessionData.department} • {sessionData.academicYear}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            className="flex items-center gap-2 border border-muted-foreground/30"
                            onClick={handleNewSession}
                        >
                            <RotateCcw className="h-4 w-4" />
                            New Session
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={handleDownloadSheet}
                        >
                            <Download className="h-4 w-4" />
                            Download Generated Sheet
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-foreground/80">
                    <div className="px-3 py-1 bg-secondary rounded-full font-medium">
                        {submittedRowIds.length} / {studentsWithMarks.length} Students Submitted
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Attendance &gt;= 75%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                        Attendance &lt; 75%
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                            <TableHead className="w-16 text-center">Roll No</TableHead>
                            <TableHead className="w-48">Student Info</TableHead>
                            {sessionData.subjects.map(subj => (
                                <TableHead key={subj.id} className="text-center min-w-[140px] border-l border-r border-border/50">
                                    <div className="font-bold text-foreground">{subj.subject_code}</div>
                                    <div className="text-xs text-muted-foreground truncate" title={subj.subject_name}>
                                        {subj.subject_name}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead className="w-24 text-center border-l bg-muted/10">Grand<br />Total</TableHead>
                            <TableHead className="w-32 text-center border-l">Action</TableHead>
                        </TableRow>
                    </TableHeader>
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
                </Table>
            </CardContent>
        </Card>
    )
}
