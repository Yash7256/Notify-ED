import { useState } from 'react'
import * as xlsx from 'xlsx'
import { z } from 'zod'
import { FileUp, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { DashboardApi } from '@/lib/api'
import { useDashboardStore } from '@/store/useDashboardStore'
import { StudentPreview } from '@/types/dashboard'

const setupSchema = z.object({
  semester: z.number().min(1).max(8),
  department: z.string().min(1),
  academicYear: z.string().min(4, "Invalid Academic Year"),
})

type SetupFormValues = z.infer<typeof setupSchema>

export function SessionSetup() {
  const { setSessionData, setStudentsWithMarks } = useDashboardStore()

  const [, setFile] = useState<File | null>(null)
  const [parsedStudents, setParsedStudents] = useState<StudentPreview[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      semester: 6,
      department: "AI & Robotics",
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(2)
    }
  })

  const onSemesterChange = (val: string) => setValue('semester', parseInt(val))

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    // Strict file type checking before parsing
    const fileName = uploadedFile.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError("Please upload a valid .xlsx file")
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

      const jsonData = xlsx.utils.sheet_to_json(worksheet)

      const students: StudentPreview[] = []

      jsonData.forEach((row: any) => {
        const keys = Object.keys(row)
        const nameKey = keys.find(k => k.toLowerCase().includes('name'))
        const enrKey = keys.find(k => k.toLowerCase().includes('enrollment') || k.toLowerCase().includes('roll'))

        if (nameKey && enrKey) {
          students.push({
            name: String(row[nameKey]),
            enrollmentNo: String(row[enrKey])
          })
        }
      })

      if (students.length === 0) {
        throw new Error('Could not find Name and Enrollment No structural columns in spreadsheet.')
      }

      setParsedStudents(students)
    } catch (err: any) {
      setError(err.message || "Failed to parse excel file.")
    } finally {
      setIsParsing(false)
    }
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

      console.log('[session:create] subjects array', res.subjects)

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
    } catch (err: any) {
      setError(err.message || "Failed to generate session.")
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-border bg-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">New Assessment Session</CardTitle>
        <CardDescription>Configure semester details and upload the student roster Excel sheet.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm font-medium bg-destructive/15 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select defaultValue="6" onValueChange={onSemesterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && <p className="text-xs text-destructive">{errors.semester.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                {...register('department')}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                {...register('academicYear')}
                placeholder="2025-26"
              />
              {errors.academicYear && <p className="text-xs text-destructive">{errors.academicYear.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Student List (Excel Upload)</Label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/25 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">XLSX or XLS only</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={isParsing || isSubmitting}
                />
              </label>
            </div>
          </div>

          {isParsing && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Parsing document...</span>
            </div>
          )}

          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Parsed Preview ({parsedStudents.length} Students)</Label>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Valid Format ✓</span>
              </div>
              <div className="border rounded-md overflow-hidden bg-background max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur z-10">
                    <TableRow>
                      <TableHead>Enrollment No</TableHead>
                      <TableHead>Student Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedStudents.slice(0, 10).map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{s.enrollmentNo}</TableCell>
                        <TableCell>{s.name}</TableCell>
                      </TableRow>
                    ))}
                    {parsedStudents.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground text-xs bg-muted/20">
                          ... and {parsedStudents.length - 10} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6">
          <Button
            type="submit"
            disabled={isParsing || isSubmitting || parsedStudents.length === 0}
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Sheet...
              </>
            ) : (
              'Confirm & Generate Sheet'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
