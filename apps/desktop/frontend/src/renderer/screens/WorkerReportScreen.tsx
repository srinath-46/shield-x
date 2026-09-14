import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { DownloadIcon, FileIcon, PrinterIcon } from '@/components/Icons'
import { WorkerSearch } from '@/components/WorkerSearch'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'
import { Avatar } from '@/components/Sidebar'
import { SectionLabel } from '@/components/Controls'
import { useLiveData } from '@/state/LiveDataContext'
import { useSupervisor } from '@/state/AuthContext'
import { COMPLIANCE_THRESHOLD, getAttendanceHistory, matchesQuery } from '@/services/workerService'
import { zoneById } from '@/services/mockData'
import type { AttendanceRecord, Worker } from '@/types'

/** Module 3.6 — per-worker compliance report with export and print. */
export function WorkerReportScreen(): JSX.Element {
  const { workers, alerts } = useLiveData()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // History is stored with the worker it belongs to, so a stale result from a
  // previous selection can never be rendered under a new one.
  const [loaded, setLoaded] = useState<{ workerId: string; records: AttendanceRecord[] } | null>(
    null
  )

  const selected = workers.find((w) => w.id === selectedId) ?? null
  const history = loaded && loaded.workerId === selectedId ? loaded.records : null

  const suggestions = useMemo(() => {
    if (!query.trim() || selectedId) return []
    return workers.filter((w) => matchesQuery(w, query)).slice(0, 6)
  }, [workers, query, selectedId])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    getAttendanceHistory(selected).then((records) => {
      if (!cancelled) setLoaded({ workerId: selected.id, records })
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  // FR-6.6 — recorded violations plus anything still open for this worker.
  const violations = selected
    ? selected.violations +
      alerts.filter((a) => a.workerId === selected.id && a.status === 'active').length
    : 0

  function choose(worker: Worker): void {
    setSelectedId(worker.id)
    setQuery(`${worker.id} · ${worker.name}`)
  }

  function reset(): void {
    setSelectedId(null)
    setQuery('')
  }

  return (
    <>
      <PageHeader title="Worker Report Query" />

      {/* UI-7.1 */}
      <div
        className="no-print"
        style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--color-divider)',
          flex: 'none'
        }}
      >
        <WorkerSearch
          inputId="report-search"
          label="Search for a worker"
          placeholder="Search by Worker ID or name"
          value={query}
          suggestions={suggestions}
          onChange={(next) => {
            setQuery(next)
            setSelectedId(null)
          }}
          onSelect={choose}
          onClear={reset}
        />
      </div>

      {!selected ? (
        // UI-7.7
        <EmptyState
          icon={<FileIcon size={38} />}
          title="No worker selected"
          message="Search for a worker above to view their profile, attendance history, PPE compliance rates, and violation count."
        />
      ) : (
        <ReportBody worker={selected} violations={violations} history={history} />
      )}
    </>
  )
}

function ReportBody({
  worker,
  violations,
  history
}: {
  worker: Worker
  violations: number
  history: AttendanceRecord[] | null
}): JSX.Element {
  const zone = zoneById(worker.zoneId)

  /** FR-6.9 — the report leaves the app as a CSV file. */
  function download(): void {
    const lines = [
      `Shield X — Worker Report`,
      `Worker ID,${worker.id}`,
      `Name,${worker.name}`,
      `Zone,${zone.name} - ${zone.label}`,
      `Shift,${worker.shift}`,
      `Helmet compliance,${worker.helmetCompliance}%`,
      `Vest compliance,${worker.vestCompliance}%`,
      `Total PPE violations,${violations}`,
      '',
      'Date,Check-in,Check-out,Helmet %,Vest %,Violations',
      ...(history ?? []).map((r) =>
        [
          r.date,
          r.checkIn ?? '-',
          r.checkOut ?? '-',
          r.helmetCompliance,
          r.vestCompliance,
          r.violations
        ].join(',')
      )
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shieldx-report-${worker.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** FR-6.10 */
  function print(): void {
    window.print()
  }

  return (
    <div className="print-region" style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <PrintHeader worker={worker} />

      {/* UI-7.2 / UI-7.6 */}
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18,
          padding: 20,
          marginBottom: 18
        }}
      >
        <Avatar initials={initials(worker.name)} size={64} fontSize={18} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22 }}>
            {worker.name}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: 13,
              color: 'var(--color-neutral-700)',
              marginTop: 3
            }}
          >
            <span>
              <b>ID</b> {worker.id}
            </span>
            <span>
              <b>Zone</b> {zone.id} · {zone.label}
            </span>
            <span>
              <b>Shift</b> {worker.shift}
            </span>
          </div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={download}>
            <DownloadIcon size={15} />
            Download
          </button>
          <button type="button" className="btn btn-primary" onClick={print}>
            <PrinterIcon size={15} />
            Print
          </button>
        </div>
      </div>

      {/* UI-7.3 / UI-7.4 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: 16,
          marginBottom: 18
        }}
      >
        <ComplianceCard label="Helmet compliance" value={worker.helmetCompliance} />
        <ComplianceCard label="Vest compliance" value={worker.vestCompliance} />
        <div className="panel-alert" style={{ padding: 18 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--color-accent-800)',
              fontWeight: 700,
              marginBottom: 10
            }}
          >
            PPE violations
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 34,
              lineHeight: 1,
              color: 'var(--color-accent)'
            }}
          >
            {violations}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-accent-800)', marginTop: 12 }}>
            total recorded
          </div>
        </div>
      </div>

      {/* UI-7.5 */}
      <SectionLabel>Attendance history</SectionLabel>
      {history === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={24} />
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Check-in</th>
              <th scope="col">Check-out</th>
              <th scope="col">Helmet</th>
              <th scope="col">Vest</th>
              <th scope="col">Violations</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td>{r.checkIn ?? '—'}</td>
                <td>{r.checkOut ?? '—'}</td>
                <td>
                  <RateChip value={r.helmetCompliance} />
                </td>
                <td>
                  <RateChip value={r.vestCompliance} />
                </td>
                <td>{r.violations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/**
 * Only reaches paper. A printed report leaves the application, so it has to
 * identify itself: system, site, worker, and when it was produced.
 */
function PrintHeader({ worker }: { worker: Worker }): JSX.Element {
  const supervisor = useSupervisor()
  const zone = zoneById(worker.zoneId)
  const generated = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div
      className="print-only"
      style={{ borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 18 }}
    >
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20 }}>
        Shield X — Worker Compliance Report
      </div>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        {supervisor.site} · {zone.name} · {zone.label} · {worker.shift} shift
      </div>
      <div style={{ fontSize: 12 }}>
        {worker.name} ({worker.id}) · generated {generated} by {supervisor.name}
      </div>
    </div>
  )
}

function ComplianceCard({ label, value }: { label: string; value: number }): JSX.Element {
  const good = value >= COMPLIANCE_THRESHOLD
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div
        style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: 'var(--color-neutral-600)',
          marginBottom: 10
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 1,
          color: good ? 'var(--color-safe-text)' : 'var(--color-accent)'
        }}
      >
        {value}%
      </div>
      <div
        role="img"
        aria-label={`${label} ${value} percent`}
        className="print-keep-color"
        style={{ height: 8, background: 'var(--color-neutral-200)', marginTop: 12 }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: good ? 'var(--color-safe)' : 'var(--color-accent)'
          }}
        />
      </div>
    </div>
  )
}

function RateChip({ value }: { value: number }): JSX.Element {
  const good = value >= COMPLIANCE_THRESHOLD
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
        background: good ? 'var(--color-safe-bg)' : 'var(--color-accent-100)',
        color: good ? 'var(--color-safe-text)' : 'var(--color-accent-800)'
      }}
    >
      {value}%
    </span>
  )
}

function initials(name: string): string {
  return name
    .replace(/\./g, '')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
