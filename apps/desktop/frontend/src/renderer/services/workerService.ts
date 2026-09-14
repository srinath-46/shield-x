import type { AttendanceRecord, Worker } from '@/types'
import { delay } from './store'

/** Compliance at or above this reads as safe; below it is flagged as a violation. */
export const COMPLIANCE_THRESHOLD = 85

/** FR-4.1 / FR-6.1 — match on Worker ID or name, case-insensitively. */
export function matchesQuery(worker: Worker, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return worker.id.toLowerCase().includes(q) || worker.name.toLowerCase().includes(q)
}

/**
 * FR-6.3 — 10 days of history, derived from the worker's rolling rates so the
 * report reads consistently with the compliance cards above it.
 */
export async function getAttendanceHistory(worker: Worker): Promise<AttendanceRecord[]> {
  const records: AttendanceRecord[] = []
  const today = new Date()
  for (let i = 0; i < 10; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    if (isRestDay(day)) continue
    records.push(attendanceOn(worker, day))
  }
  return delay(records)
}

/** Sunday is not worked on this site, so no attendance is recorded. */
export function isRestDay(day: Date): boolean {
  return day.getDay() === 0
}

/**
 * One worker's record for one day. Deterministic in the day offset, so the same
 * date always yields the same figures — the Attendance module and the Worker
 * Report read the same history rather than two invented ones.
 */
export function attendanceOn(worker: Worker, day: Date): AttendanceRecord {
  const i = daysAgo(day)
  const drift = ((i * 13) % 21) - 6
  const helmet = clamp(worker.helmetCompliance + drift)
  const vest = clamp(worker.vestCompliance - drift)
  return {
    date: day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    checkIn: i === 0 ? worker.checkIn : offsetTime('07:00', ((i * 7) % 17) - 8),
    checkOut: i === 0 ? worker.checkOut : offsetTime('16:00', ((i * 5) % 19) - 6),
    helmetCompliance: helmet,
    vestCompliance: vest,
    violations: (helmet < COMPLIANCE_THRESHOLD ? 1 : 0) + (vest < COMPLIANCE_THRESHOLD ? 1 : 0)
  }
}

/** Whole days between `day` and today; 0 for today. */
export function daysAgo(day: Date): number {
  const a = new Date(day)
  const b = new Date()
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function clamp(value: number): number {
  return Math.max(40, Math.min(100, Math.round(value)))
}

function offsetTime(base: string, minutes: number): string {
  const [h, m] = base.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
