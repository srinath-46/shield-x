import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { SearchInput, Select } from '@/components/Controls'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'
import { InboxIcon } from '@/components/Icons'
import { PpeBadge, PresenceBadge } from '@/components/StatusBadge'
import { useLiveData } from '@/state/LiveDataContext'
import {
  PAGE_SIZE,
  attendanceRows,
  defaultRange,
  describeFilters,
  isTodayOnly
} from '@/services/attendanceService'
import { ZONES, zoneById } from '@/services/mockData'
import type { AttendanceFilters, ZoneId } from '@/types'

function initialFilters(): AttendanceFilters {
  return { query: '', zoneId: 'all', shift: 'all', ...defaultRange() }
}

/** Module 3.4 — attendance alongside live PPE status. */
export function AttendanceScreen(): JSX.Element {
  const { workers } = useLiveData()
  const [filters, setFilters] = useState<AttendanceFilters>(initialFilters)
  const [page, setPage] = useState(0)
  // Filtering is local, but the first read still shows a loading state (UI-1.9),
  // and each filter change re-runs it the way a server query would. Loading is
  // derived from which filters have been served, so nothing has to be reset.
  const [servedFilters, setServedFilters] = useState<AttendanceFilters | null>(null)
  const loading = servedFilters !== filters

  useEffect(() => {
    const t = setTimeout(() => setServedFilters(filters), 260)
    return () => clearTimeout(t)
  }, [filters])

  const rowsForFilters = useMemo(() => attendanceRows(workers, filters), [workers, filters])
  const todayOnly = useMemo(() => isTodayOnly(filters), [filters])

  const pageCount = Math.max(1, Math.ceil(rowsForFilters.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const rows = rowsForFilters.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  function update(patch: Partial<AttendanceFilters>): void {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(0)
  }

  return (
    <>
      <PageHeader title="Attendance Management" />

      {/* UI-5.2 – UI-5.4 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 12,
          padding: '18px 28px 16px',
          borderBottom: '1px solid var(--color-divider)',
          flex: 'none'
        }}
      >
        <SearchInput
          id="attendance-search"
          label="Search worker"
          placeholder="Worker ID or name"
          value={filters.query}
          onChange={(query) => update({ query })}
        />
        <Select
          id="attendance-zone"
          label="Zone"
          width={140}
          value={filters.zoneId}
          onChange={(zoneId) => update({ zoneId: zoneId as ZoneId | 'all' })}
          options={[
            { value: 'all', label: 'All zones' },
            ...ZONES.map((z) => ({ value: z.id, label: z.name }))
          ]}
        />
        <Select
          id="attendance-shift"
          label="Shift"
          width={125}
          value={filters.shift}
          onChange={(shift) => update({ shift: shift as AttendanceFilters['shift'] })}
          options={[
            { value: 'all', label: 'All shifts' },
            { value: 'Day', label: 'Day' },
            { value: 'Night', label: 'Night' }
          ]}
        />
        {/* FR-4.7 — historical records over a chosen range. */}
        <div className="field" style={{ width: 145 }}>
          <label htmlFor="attendance-from">From</label>
          <input
            id="attendance-from"
            type="date"
            className="input"
            value={filters.from}
            max={filters.to}
            onChange={(e) => update({ from: e.target.value })}
          />
        </div>
        <div className="field" style={{ width: 145 }}>
          <label htmlFor="attendance-to">To</label>
          <input
            id="attendance-to"
            type="date"
            className="input"
            value={filters.to}
            min={filters.from}
            onChange={(e) => update({ to: e.target.value })}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Spinner size={26} />
          </div>
        ) : rows.length === 0 ? (
          // UI-5.7
          <EmptyState
            compact
            icon={<InboxIcon size={36} />}
            title="No matching records"
            message={`No attendance matches ${describeFilters(filters)}. Try a different ID, zone, shift, or date range.`}
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFilters(initialFilters())
                  setPage(0)
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          // UI-5.1 / UI-5.6 — labelled columns, header stays put while scrolling,
          // and the row scrolls sideways rather than crushing at narrow widths.
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-sticky" style={{ minWidth: todayOnly ? 900 : 960 }}>
              <thead>
                <tr>
                  {!todayOnly && <th scope="col">Date</th>}
                  <th scope="col">Worker ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Zone</th>
                  <th scope="col">Shift</th>
                  <th scope="col">Check-in</th>
                  <th scope="col">Check-out</th>
                  <th scope="col">Presence</th>
                  <th scope="col">Helmet</th>
                  <th scope="col">Vest</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    {!todayOnly && <td style={{ whiteSpace: 'nowrap' }}>{row.dateLabel}</td>}
                    <td style={{ fontWeight: 700 }}>{row.worker.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.worker.name}</td>
                    <td>{zoneById(row.worker.zoneId).name}</td>
                    <td>{row.worker.shift}</td>
                    <td>{row.checkIn ?? '—'}</td>
                    <td>{row.checkOut ?? '—'}</td>
                    <td>
                      <PresenceBadge status={row.presence} />
                    </td>
                    <td>
                      <PpeBadge status={row.helmet} />
                    </td>
                    <td>
                      <PpeBadge status={row.vest} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 28px',
          borderTop: '1px solid var(--color-divider)',
          fontSize: 12,
          color: 'var(--color-neutral-600)',
          flex: 'none'
        }}
      >
        <span>
          Showing {rows.length} of {rowsForFilters.length}{' '}
          {todayOnly ? 'workers' : 'attendance records'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            ‹ Prev
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    </>
  )
}
