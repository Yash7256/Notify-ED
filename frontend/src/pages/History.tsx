import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RotateCcw, Send, ShieldAlert } from 'lucide-react'
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
  emailLogId?: string | null
  submittedAt?: string | null
}

type SubjectOption = {
  id: string
  subject_name: string
  subject_code?: string | null
}

const badgeStyle = (status: ChannelStatus) => ({
  fontFamily: "'DM Mono', monospace",
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  padding: '0.2rem 0.5rem',
  background: status === 'sent' ? '#dcfce7' : status === 'failed' ? '#fee2e2' : '#eee9df',
  color: status === 'sent' ? '#16a34a' : status === 'failed' ? '#dc2626' : '#7a7568',
  border: `1px solid ${status === 'sent' ? '#86efac' : status === 'failed' ? '#fca5a5' : '#d8d2c4'}`,
})

const StatusBadge = ({ status, label }: { status: ChannelStatus; label?: string }) => (
  <span style={badgeStyle(status)}>
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

  const fetchHistory = useCallback(
    async (withSpinner = true) => {
      if (withSpinner) setLoading(true)
      setError(null)

      try {
        const { data, error: supabaseError } = await supabase
          .from('notification_logs')
          .select(`
            id,
            channel,
            status,
            sent_at,
            student_id,
            marks_id,
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
          .order('sent_at', { ascending: false, nullsFirst: true })
          .limit(500)

        if (supabaseError) {
          console.error('Supabase error:', supabaseError.message, supabaseError.details, supabaseError.hint)
          setError('Unable to load history. Please try again.')
          setLoading(false)
          return
        }

        console.log('notification_logs data:', data)

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
            emailLogId: null,
            submittedAt: log.sent_at,
          })
        }

        const entry = map.get(key)!
        const status: ChannelStatus = log.status || 'pending'
        const time = log.sent_at || entry.submittedAt
        if (time && (!entry.submittedAt || new Date(time) < new Date(entry.submittedAt))) {
          entry.submittedAt = time
        }

        if (log.channel === 'email') {
          entry.emailStatus = status
          entry.emailLogId = log.id
        }
      })

      const aggregated = Array.from(map.values()).sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return bTime - aTime
      })

      setRows(aggregated)
      setLoading(false)

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
      } catch (err: any) {
        console.error('Fetch history error:', err)
        setError(err?.message || 'Unable to load history. Please try again.')
      } finally {
        setLoading(false)
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
      if (filters.status !== 'all' && row.emailStatus !== filters.status) return false
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
    const failed = filteredRows.filter((r) => r.emailStatus === 'failed').length
    const success = filteredRows.filter((r) => r.emailStatus === 'sent').length
    const today = filteredRows.filter((r) => isSameDay(r.submittedAt)).length
    const successRate = total === 0 ? 0 : Math.round((success / total) * 1000) / 10
    return { total, failed, success, today, successRate }
  }, [filteredRows])

  const handleResend = async (row: HistoryRow) => {
    const failedLogIds = row.emailStatus === 'failed' && row.emailLogId ? [row.emailLogId] : []

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
    const header = ['Student Name', 'Subject', 'Email Status', 'Submitted At']
    const lines = filteredRows.map((row) => [
      row.studentName,
      `${row.subjectCode ? `${row.subjectCode} - ` : ''}${row.subjectName}`,
      row.emailStatus,
      formatDateTime(row.submittedAt),
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

  const inputStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.75rem',
    color: '#0a0a08',
    background: '#f5f0e8',
    border: '1px solid #d8d2c4',
    padding: '0.4rem 0.75rem',
    outline: 'none',
    width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.6rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#7a7568',
    marginBottom: '0.4rem',
    display: 'block',
  }

  const statsData = [
    { label: 'Total Notified Today', value: stats.today, color: '#0a0a08' },
    { label: 'Failed', value: stats.failed, color: '#dc2626' },
    { label: 'Success Rate', value: `${stats.successRate}%`, color: '#16a34a' },
    { label: 'Total Records', value: stats.total, color: '#0a0a08' },
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --ink: #0a0a08;
          --paper: #f5f0e8;
          --accent: #d4440c;
          --accent2: #1a472a;
          --muted: #7a7568;
          --rule: #d8d2c4;
          --card: #eee9df;
          --white: #fafaf7;
          --green: #16a34a;
          --red: #dc2626;
        }
      `}</style>

      {/* PAGE HEADER */}
      <div style={{ padding: '3rem 3rem 2rem', borderBottom: '1px solid #d8d2c4', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#d4440c', marginBottom: '0.5rem' }}>Notification History</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', color: '#0a0a08', lineHeight: 1.1 }}>Notification History</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: '#7a7568', marginTop: '0.75rem', fontSize: '1rem', maxWidth: '500px' }}>Monitor every email and WhatsApp attempt, retry failures, and export filtered views.</p>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: '#0a0a08', color: '#f5f0e8', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          onClick={handleExportCsv}
          onMouseEnter={e => e.currentTarget.style.background = '#d4440c'}
          onMouseLeave={e => e.currentTarget.style.background = '#0a0a08'}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#d8d2c4', borderBottom: '1px solid #d8d2c4' }}>
        {statsData.map((s, i) => (
          <div key={i} style={{ background: '#f5f0e8', padding: '1.75rem 2.5rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a7568', marginBottom: '0.5rem' }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FILTERS ROW */}
      <div style={{ padding: '1.25rem 3rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', borderBottom: '1px solid #d8d2c4' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Subject</label>
          <select
            value={filters.subjectId}
            onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = '#d4440c'}
            onBlur={e => e.target.style.borderColor = '#d8d2c4'}
          >
            <option value="all">All subjects</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.subject_code ? `${subj.subject_code} — ${subj.subject_name}` : subj.subject_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = '#d4440c'}
            onBlur={e => e.target.style.borderColor = '#d8d2c4'}
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#d4440c'}
            onBlur={e => e.target.style.borderColor = '#d8d2c4'}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#d4440c'}
            onBlur={e => e.target.style.borderColor = '#d8d2c4'}
          />
        </div>

        <button
          onClick={resetFilters}
          title="Reset filters"
          style={{ padding: '0.4rem 0.6rem', background: 'transparent', border: '1px solid #d8d2c4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eee9df'; e.currentTarget.style.borderColor = '#d4440c' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d8d2c4' }}
        >
          <RotateCcw size={14} color="#7a7568" />
        </button>
      </div>

      {/* TABLE SECTION */}
      <div style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#0a0a08' }}>Notification Logs</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: '#7a7568', fontSize: '0.85rem', marginTop: '0.25rem' }}>Realtime updates from Supabase.</p>
        </div>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#0a0a08' }}>
              <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f0e8', padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid #2a2a24', whiteSpace: 'nowrap' }}>Student</th>
              <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f0e8', padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid #2a2a24', whiteSpace: 'nowrap' }}>Subject</th>
              <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f0e8', padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid #2a2a24', whiteSpace: 'nowrap' }}>Email Status</th>
              <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f0e8', padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid #2a2a24', whiteSpace: 'nowrap' }}>Submitted At</th>
              <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f0e8', padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 400, whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} style={{ borderBottom: '1px solid #d8d2c4' }}>
                <td style={{ padding: '0.85rem 1.25rem' }}><div style={{ height: '16px', background: '#e5e0d6', width: '160px' }} /></td>
                <td style={{ padding: '0.85rem 1.25rem' }}><div style={{ height: '16px', background: '#e5e0d6', width: '180px' }} /></td>
                <td style={{ padding: '0.85rem 1.25rem' }}><div style={{ height: '20px', background: '#e5e0d6', width: '80px' }} /></td>
                <td style={{ padding: '0.85rem 1.25rem' }}><div style={{ height: '16px', background: '#e5e0d6', width: '120px' }} /></td>
                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}><div style={{ height: '24px', background: '#e5e0d6', width: '60px', marginLeft: 'auto' }} /></td>
              </tr>
            ))}

            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#7a7568', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '1.1rem' }}>
                  No notifications yet.
                </td>
              </tr>
            )}

            {!loading && filteredRows.map((row) => {
              const canResend = row.emailStatus === 'failed'
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #d8d2c4', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eee9df'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#0a0a08' }}>
                    {row.studentName || 'Unknown Student'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#0a0a08' }}>{row.subjectName}</span>
                      {row.subjectCode && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#7a7568' }}>{row.subjectCode}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <StatusBadge status={row.emailStatus} />
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#7a7568' }}>
                    {formatDateTime(row.submittedAt)}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleResend(row)}
                      disabled={!canResend || resendingId === row.id}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '0.3rem 0.6rem',
                        background: canResend ? '#0a0a08' : 'transparent',
                        color: canResend ? '#f5f0e8' : '#7a7568',
                        border: canResend ? 'none' : '1px solid #d8d2c4',
                        cursor: canResend ? 'pointer' : 'default',
                        opacity: resendingId === row.id ? 0.5 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      onMouseEnter={e => { if (canResend) e.currentTarget.style.background = '#d4440c' }}
                      onMouseLeave={e => { if (canResend) e.currentTarget.style.background = '#0a0a08' }}
                    >
                      <Send size={12} />
                      {resendingId === row.id ? 'Sending...' : canResend ? 'Resend' : 'OK'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
