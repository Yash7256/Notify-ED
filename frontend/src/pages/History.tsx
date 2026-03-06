import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw, RotateCcw, Send, ShieldAlert } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

type ChannelStatus = 'sent' | 'failed' | 'pending'

type HistoryRow = {
  id: string
  studentId: string | null
  studentName: string
  subjectId: string | null
  subjectName: string
  subjectCode?: string | null
  emailStatus: ChannelStatus
  whatsappStatus: ChannelStatus
  emailLogId?: string | null
  whatsappLogId?: string | null
  submittedAt?: string | null
  overallStatus: ChannelStatus
}

type SubjectOption = {
  id: string
  subject_name: string
  subject_code?: string | null
}

const statusStyles: Record<ChannelStatus, string> = {
  sent: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40',
  failed: 'bg-rose-500/15 text-rose-200 border border-rose-500/40',
  pending: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
}

const StatusBadge = ({ status, label }: { status: ChannelStatus; label?: string }) => (
  <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusStyles[status]}`}>
    <span className="h-2 w-2 rounded-full bg-current opacity-70" />
    {label || status}
  </span>
)

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const isSameDay = (iso?: string | null) => {
  if (!iso) return false
  const date = new Date(iso)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export function History() {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    subjectId: 'all',
    status: 'all',
    from: '',
    to: '',
  })

  const fetchSubjects = useCallback(async () => {
    const { data } = await supabase.from('subjects').select('id, subject_name, subject_code').order('subject_name')
    if (data) {
      setSubjects(data)
    }
  }, [])

  const deriveOverall = (email: ChannelStatus, whatsapp: ChannelStatus): ChannelStatus => {
    if (email === 'failed' || whatsapp === 'failed') return 'failed'
    if (email === 'sent' && whatsapp === 'sent') return 'sent'
    return 'pending'
  }

  const fetchHistory = useCallback(
    async (withSpinner = true) => {
      if (withSpinner) setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('notification_logs')
        .select(`
          id,
          channel,
          status,
          sent_at,
          created_at,
          student_id,
          marks:marks_id (
            subject_id,
            subjects:subject_id (
              id,
              subject_name,
              subject_code
            )
          ),
          students:student_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (supabaseError) {
        setError('Unable to load history. Please try again.')
        setLoading(false)
        return
      }

      const map = new Map<string, HistoryRow>()

      ;(data || []).forEach((log: any) => {
        const studentId = log.student_id || log.students?.id || null
        const studentName = log.students?.name || 'Unknown'
        const subjectId = log.marks?.subject_id || null
        const subjectInfo = log.marks?.subjects
        const subjectName = subjectInfo?.subject_name || 'Unknown Subject'
        const subjectCode = subjectInfo?.subject_code

        const key = `${studentId || 'unknown'}-${subjectId || 'unknown'}`
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            studentId,
            studentName,
            subjectId,
            subjectName,
            subjectCode,
            emailStatus: 'pending',
            whatsappStatus: 'pending',
            emailLogId: null,
            whatsappLogId: null,
            submittedAt: log.sent_at || log.created_at,
            overallStatus: 'pending',
          })
        }

        const entry = map.get(key)!
        const status: ChannelStatus = log.status || 'pending'
        const time = log.sent_at || log.created_at || entry.submittedAt
        if (time && (!entry.submittedAt || new Date(time) < new Date(entry.submittedAt))) {
          entry.submittedAt = time
        }

        if (log.channel === 'email') {
          entry.emailStatus = status
          entry.emailLogId = log.id
        } else if (log.channel === 'whatsapp') {
          entry.whatsappStatus = status
          entry.whatsappLogId = log.id
        }

        entry.overallStatus = deriveOverall(entry.emailStatus, entry.whatsappStatus)
      })

      const aggregated = Array.from(map.values()).sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return bTime - aTime
      })

      setRows(aggregated)
      setLoading(false)

      // Fallback subject options from data if subjects list is empty
      if (subjects.length === 0) {
        const unique = new Map<string, SubjectOption>()
        aggregated.forEach((row) => {
          if (row.subjectId) {
            unique.set(row.subjectId, {
              id: row.subjectId,
              subject_name: row.subjectName,
              subject_code: row.subjectCode,
            })
          }
        })
        setSubjects(Array.from(unique.values()))
      }
    },
    [subjects.length],
  )

  useEffect(() => {
    fetchSubjects()
    fetchHistory()

    const channel = supabase
      .channel('realtime:notification_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_logs' },
        () => fetchHistory(false),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchHistory, fetchSubjects])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.subjectId !== 'all' && row.subjectId !== filters.subjectId) return false
      if (filters.status !== 'all' && row.overallStatus !== filters.status) return false
      if (filters.from) {
        const fromDate = new Date(filters.from)
        const rowDate = row.submittedAt ? new Date(row.submittedAt) : null
        if (!rowDate || rowDate < fromDate) return false
      }
      if (filters.to) {
        const toDate = new Date(filters.to)
        const rowDate = row.submittedAt ? new Date(row.submittedAt) : null
        if (!rowDate || rowDate > new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1)) return false
      }
      return true
    })
  }, [rows, filters])

  const stats = useMemo(() => {
    const total = filteredRows.length
    const failed = filteredRows.filter((r) => r.overallStatus === 'failed').length
    const success = filteredRows.filter((r) => r.overallStatus === 'sent').length
    const today = filteredRows.filter((r) => isSameDay(r.submittedAt)).length
    const successRate = total === 0 ? 0 : Math.round((success / total) * 1000) / 10
    return { total, failed, success, today, successRate }
  }, [filteredRows])

  const handleResend = async (row: HistoryRow) => {
    const failedLogIds = [
      row.emailStatus === 'failed' ? row.emailLogId : null,
      row.whatsappStatus === 'failed' ? row.whatsappLogId : null,
    ].filter(Boolean) as string[]

    if (failedLogIds.length === 0) return

    setResendingId(row.id)
    setError(null)

    try {
      const res = await fetch('/api/marks/resend-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: failedLogIds }),
      })

      if (!res.ok) {
        throw new Error('Resend request failed')
      }

      await fetchHistory(false)
    } catch (err: any) {
      setError(err.message || 'Resend failed')
    } finally {
      setResendingId(null)
    }
  }

  const handleExportCsv = () => {
    const header = ['Student Name', 'Subject', 'Email Status', 'WhatsApp Status', 'Submitted At', 'Overall Status']
    const lines = filteredRows.map((row) => [
      row.studentName,
      `${row.subjectCode ? `${row.subjectCode} - ` : ''}${row.subjectName}`,
      row.emailStatus,
      row.whatsappStatus,
      formatDateTime(row.submittedAt),
      row.overallStatus,
    ])

    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notification-history-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => setFilters({ subjectId: 'all', status: 'all', from: '', to: '' })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Notification History</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor every email and WhatsApp attempt, retry failures, and export filtered views.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-primary/30 hover:bg-primary/10" onClick={handleExportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="ghost" onClick={() => fetchHistory()} title="Refresh now">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-card/80 border-border/60 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Stats</CardTitle>
          <CardDescription>Live view based on your current filters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Total Notified Today" value={stats.today} accent="text-primary" />
          <StatTile label="Failed" value={stats.failed} accent="text-rose-300" />
          <StatTile label="Success Rate" value={`${stats.successRate}%`} accent="text-emerald-300" />
          <StatTile label="Total Records" value={stats.total} accent="text-muted-foreground" />
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/60 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Slice history by subject, date window, and delivery status.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p>
            <Select
              value={filters.subjectId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, subjectId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.id}>
                    {subj.subject_code ? `${subj.subject_code} — ${subj.subject_name}` : subj.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">To</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
              <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset filters">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/60 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Notification Logs</CardTitle>
              <CardDescription>Realtime updates from Supabase.</CardDescription>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-300 text-sm">
                <ShieldAlert className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>WhatsApp Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}

              {!loading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No notifications match your filters.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filteredRows.map((row) => {
                  const canResend = row.overallStatus === 'failed'
                  return (
                    <TableRow key={row.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium">
                        {row.studentName || 'Unknown Student'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.subjectName}</span>
                          {row.subjectCode && (
                            <span className="text-xs text-muted-foreground">{row.subjectCode}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.emailStatus} label={`Email ${row.emailStatus}`} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.whatsappStatus} label={`WhatsApp ${row.whatsappStatus}`} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(row.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={canResend ? 'secondary' : 'ghost'}
                          size="sm"
                          disabled={!canResend || resendingId === row.id}
                          onClick={() => handleResend(row)}
                          className={canResend ? 'border border-rose-400/40 text-rose-100 hover:bg-rose-500/10' : ''}
                        >
                          <Send className="h-4 w-4" />
                          {resendingId === row.id ? 'Resending...' : canResend ? 'Resend' : 'OK'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent || ''}`}>{value}</p>
    </div>
  )
}
