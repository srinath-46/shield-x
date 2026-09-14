import type { AttendanceFilters, PpeStatus, PresenceStatus, Worker } from '@/types'
import { COMPLIANCE_THRESHOLD, attendanceOn, isRestDay, matchesQuery } from './workerService'

/** One row of the attendance table: a worker on a particular day. */
export interface AttendanceRow {
  key: string
  worker: Worker
  /** ISO date the row belongs to. */
  date: string
  /** "12 Aug" — the label shown in the Date column. */
  dateLabel: string
  isToday: boolean
  checkIn: string | null
  checkOut: string | null
  presence: PresenceStatus
  helmet: PpeStatus
  vest: PpeStatus
}

export const PAGE_SIZE = 8

export function toIsoDate(d: Date): string {
  const local = new Date(d)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

/**
 * The screen opens on today, so the table shows live helmet and vest status
 * (FR-4.5, FR-4.6). Widening the range brings in recorded history instead.
 */
export function defaultRange(): { from: string; to: string } {
  const today = toIsoDate(new Date())
  return { from: today, to: today }
}

/** FR-4.1 – FR-4.3: search by ID or name, filtered by zone and shift. */
export function filterWorkers(workers: Worker[], filters: AttendanceFilters): Worker[] {
  return workers.filter((w) => {
    if (!matchesQuery(w, filters.query)) return false
    if (filters.zoneId !== 'all' && w.zoneId !== filters.zoneId) return false
    if (filters.shift !== 'all' && w.shift !== filters.shift) return false
    return true
  })
}

/** Working days inside the range, newest first, capped so a wide range stays usable. */
function daysInRange(filters: AttendanceFilters, limit = 14): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const from = filters.from ? startOfDay(filters.from) : today
  const to = filters.to ? startOfDay(filters.to) : today
  if (from > to) return []

  const days: Date[] = []
  const cursor = new Date(Math.min(to.getTime(), today.getTime()))
  while (cursor >= from && days.length < limit) {
    if (!isRestDay(cursor)) days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return days
}

/** True when the selected range is a single day and that day is today. */
export function isTodayOnly(filters: AttendanceFilters): boolean {
  const days = daysInRange(filters)
  return days.length === 1 && daysAreEqual(days[0], new Date())
}

/**
 * FR-4.4 – FR-4.7. Today's rows carry the worker's live PPE status; earlier days
 * come from the recorded history, which has no live reading to show.
 */
export function attendanceRows(workers: Worker[], filters: AttendanceFilters): AttendanceRow[] {
  const matched = filterWorkers(workers, filters)
  const days = daysInRange(filters)

  const rows: AttendanceRow[] = []
  for (const day of days) {
    const today = daysAreEqual(day, new Date())
    for (const worker of matched) {
      if (today) {
        rows.push({
          key: `${worker.id}:today`,
          worker,
          date: toIsoDate(day),
          dateLabel: day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          isToday: true,
          checkIn: worker.checkIn,
          checkOut: worker.checkOut,
          presence: worker.presence,
          helmet: worker.helmet,
          vest: worker.vest
        })
        continue
      }

      const record = attendanceOn(worker, day)
      rows.push({
        key: `${worker.id}:${toIsoDate(day)}`,
        worker,
        date: toIsoDate(day),
        dateLabel: record.date,
        isToday: false,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        presence: 'checked-out',
        // A past day is summarised by whether that day's compliance held up.
        helmet: record.helmetCompliance >= COMPLIANCE_THRESHOLD ? 'worn' : 'not-worn',
        vest: record.vestCompliance >= COMPLIANCE_THRESHOLD ? 'worn' : 'not-worn'
      })
    }
  }
  return rows
}

/** Human-readable summary of the active filters, used by the empty state. */
export function describeFilters(filters: AttendanceFilters): string {
  const parts: string[] = []
  if (filters.query.trim()) parts.push(`"${filters.query.trim()}"`)
  if (filters.zoneId !== 'all') parts.push(`Zone ${filters.zoneId}`)
  if (filters.shift !== 'all') parts.push(`the ${filters.shift} shift`)

  const range = describeRange(filters)
  if (parts.length === 0) return range
  if (parts.length === 1) return `${parts[0]} ${range}`
  return `${parts.slice(0, -1).join(', ')} in ${parts[parts.length - 1]} ${range}`
}

export function describeRange(filters: AttendanceFilters): string {
  if (isTodayOnly(filters)) return 'today'
  const from = filters.from ? formatDay(startOfDay(filters.from)) : null
  const to = filters.to ? formatDay(startOfDay(filters.to)) : null
  if (from && to) return `between ${from} and ${to}`
  if (from) return `since ${from}`
  if (to) return `up to ${to}`
  return 'for the selected dates'
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function startOfDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function daysAreEqual(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
