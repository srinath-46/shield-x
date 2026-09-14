// @vitest-environment node
// Pure logic — no DOM needed, and skipping jsdom keeps the service suites fast.
import { describe, expect, it } from 'vitest'
import {
  attendanceRows,
  defaultRange,
  describeFilters,
  describeRange,
  filterWorkers,
  isTodayOnly,
  toIsoDate
} from './attendanceService'
import { WORKERS } from './mockData'
import type { AttendanceFilters, Worker } from '@/types'

function filters(patch: Partial<AttendanceFilters> = {}): AttendanceFilters {
  return { query: '', zoneId: 'all', shift: 'all', ...defaultRange(), ...patch }
}

function daysBack(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toIsoDate(d)
}

describe('toIsoDate', () => {
  it('reports the local calendar date, not the UTC one', () => {
    // 23:30 local: toISOString() would roll this into tomorrow west of UTC and
    // yesterday east of it. The date the supervisor picked is the local one.
    const lateEvening = new Date()
    lateEvening.setHours(23, 30, 0, 0)
    const expected = `${lateEvening.getFullYear()}-${String(lateEvening.getMonth() + 1).padStart(2, '0')}-${String(
      lateEvening.getDate()
    ).padStart(2, '0')}`
    expect(toIsoDate(lateEvening)).toBe(expected)
  })
})

describe('filterWorkers', () => {
  it('matches a worker by ID and by name, ignoring case', () => {
    expect(filterWorkers(WORKERS, filters({ query: 'w-1042' }))[0].id).toBe('W-1042')
    expect(filterWorkers(WORKERS, filters({ query: 'alvarez' }))[0].id).toBe('W-1042')
  })

  it('narrows by zone and by shift', () => {
    const zoneA = filterWorkers(WORKERS, filters({ zoneId: 'A' }))
    expect(zoneA.length).toBeGreaterThan(0)
    expect(zoneA.every((w) => w.zoneId === 'A')).toBe(true)

    const nights = filterWorkers(WORKERS, filters({ shift: 'Night' }))
    expect(nights.length).toBeGreaterThan(0)
    expect(nights.every((w) => w.shift === 'Night')).toBe(true)
  })

  it('combines filters rather than widening them', () => {
    const combined = filterWorkers(WORKERS, filters({ zoneId: 'A', shift: 'Night' }))
    expect(combined.every((w) => w.zoneId === 'A' && w.shift === 'Night')).toBe(true)
    expect(combined.length).toBeLessThan(filterWorkers(WORKERS, filters({ zoneId: 'A' })).length)
  })

  it('returns nothing for an unknown worker', () => {
    expect(filterWorkers(WORKERS, filters({ query: 'W-9999' }))).toHaveLength(0)
  })
})

describe('isTodayOnly', () => {
  it('is true only when the range is today alone', () => {
    expect(isTodayOnly(filters())).toBe(true)
    expect(isTodayOnly(filters({ from: daysBack(6) }))).toBe(false)
  })
})

describe('attendanceRows', () => {
  const oneWorker: Worker[] = [WORKERS[0]]

  it("carries the worker's live PPE status for today (FR-4.5, FR-4.6)", () => {
    const [row] = attendanceRows(oneWorker, filters())
    expect(row.isToday).toBe(true)
    expect(row.helmet).toBe(WORKERS[0].helmet)
    expect(row.vest).toBe(WORKERS[0].vest)
    expect(row.presence).toBe(WORKERS[0].presence)
    expect(row.checkIn).toBe(WORKERS[0].checkIn)
  })

  it('returns one row per worker per working day over a range (FR-4.7)', () => {
    const rows = attendanceRows(oneWorker, filters({ from: daysBack(6) }))
    expect(rows.length).toBeGreaterThan(1)
    expect(new Set(rows.map((r) => r.date)).size).toBe(rows.length)
    expect(rows.filter((r) => r.isToday)).toHaveLength(1)
  })

  it('reports past days as recorded history, not as a live reading', () => {
    const rows = attendanceRows(oneWorker, filters({ from: daysBack(6) }))
    const past = rows.filter((r) => !r.isToday)
    expect(past.length).toBeGreaterThan(0)
    for (const row of past) {
      expect(row.presence).toBe('checked-out')
      expect(['worn', 'not-worn']).toContain(row.helmet)
      expect(row.checkOut).not.toBeNull()
    }
  })

  it('excludes Sundays, which are not worked', () => {
    const rows = attendanceRows(oneWorker, filters({ from: daysBack(13) }))
    for (const row of rows) {
      const [y, m, d] = row.date.split('-').map(Number)
      expect(new Date(y, m - 1, d).getDay()).not.toBe(0)
    }
  })

  it('caps a wide range at 14 working days so the query stays usable', () => {
    const rows = attendanceRows(oneWorker, filters({ from: daysBack(120) }))
    expect(rows).toHaveLength(14)
  })

  it('orders days newest first', () => {
    const rows = attendanceRows(oneWorker, filters({ from: daysBack(6) }))
    const dates = rows.map((r) => r.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('returns nothing when the range is inverted', () => {
    expect(
      attendanceRows(oneWorker, filters({ from: toIsoDate(new Date()), to: daysBack(5) }))
    ).toHaveLength(0)
  })

  it('gives every row a unique key for React', () => {
    const rows = attendanceRows(WORKERS.slice(0, 5), filters({ from: daysBack(6) }))
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
  })
})

describe('describeFilters', () => {
  it('names the query, zone, shift and dates so the empty state is specific (UI-5.7)', () => {
    const text = describeFilters(filters({ query: 'W-9999', zoneId: 'A', shift: 'Night' }))
    expect(text).toContain('W-9999')
    expect(text).toContain('Zone A')
    expect(text).toContain('Night')
    expect(text).toContain('today')
  })

  it('describes a widened range by its dates', () => {
    const text = describeRange(filters({ from: daysBack(6) }))
    expect(text).toMatch(/^between .+ and .+$/)
  })
})
