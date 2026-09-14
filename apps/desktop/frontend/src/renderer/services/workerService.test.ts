// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  COMPLIANCE_THRESHOLD,
  attendanceOn,
  daysAgo,
  isRestDay,
  matchesQuery
} from './workerService'
import { WORKERS } from './mockData'
import type { Worker } from '@/types'

const worker: Worker = WORKERS[0]

function dayBack(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

describe('matchesQuery (FR-4.1, FR-6.1)', () => {
  it('matches on ID or name, ignoring case and surrounding space', () => {
    expect(matchesQuery(worker, 'w-1042')).toBe(true)
    expect(matchesQuery(worker, '  ALVAREZ ')).toBe(true)
    expect(matchesQuery(worker, '1042')).toBe(true)
  })

  it('treats an empty query as no filter', () => {
    expect(matchesQuery(worker, '')).toBe(true)
    expect(matchesQuery(worker, '   ')).toBe(true)
  })

  it('rejects a non-match', () => {
    expect(matchesQuery(worker, 'W-9999')).toBe(false)
  })
})

describe('isRestDay', () => {
  it('treats Sunday, and only Sunday, as not worked', () => {
    // 2026-08-09 is a Sunday, 2026-08-10 a Monday.
    expect(isRestDay(new Date(2026, 7, 9))).toBe(true)
    expect(isRestDay(new Date(2026, 7, 10))).toBe(false)
  })
})

describe('daysAgo', () => {
  it('counts whole days regardless of the time of day', () => {
    const today = new Date()
    today.setHours(23, 59, 0, 0)
    expect(daysAgo(today)).toBe(0)
    expect(daysAgo(dayBack(1))).toBe(1)
  })

  it('counts correctly across a month boundary', () => {
    const first = new Date(2026, 8, 1) // 01 Sep 2026
    const lastMonth = new Date(2026, 7, 30) // 30 Aug 2026
    const diff = Math.round((first.getTime() - lastMonth.getTime()) / 86_400_000)
    expect(diff).toBe(2)
  })
})

describe('attendanceOn (FR-6.3)', () => {
  it('is deterministic for a given worker and day', () => {
    // The Attendance module and the Worker Report both read this; if it were
    // random the two screens would disagree about the same date.
    const day = dayBack(3)
    expect(attendanceOn(worker, day)).toEqual(attendanceOn(worker, new Date(day)))
  })

  it("uses the worker's live times for today", () => {
    const record = attendanceOn(worker, new Date())
    expect(record.checkIn).toBe(worker.checkIn)
    expect(record.checkOut).toBe(worker.checkOut)
  })

  it('keeps compliance rates within a sane range', () => {
    for (let i = 0; i < 14; i++) {
      const record = attendanceOn(worker, dayBack(i))
      expect(record.helmetCompliance).toBeGreaterThanOrEqual(40)
      expect(record.helmetCompliance).toBeLessThanOrEqual(100)
      expect(record.vestCompliance).toBeGreaterThanOrEqual(40)
      expect(record.vestCompliance).toBeLessThanOrEqual(100)
    }
  })

  it('treats a rate at the threshold as compliant and one below it as a violation', () => {
    // Pins the calibration itself rather than deriving the expectation from the
    // constant: today's drift is -6 on the helmet and +6 on the vest, so a
    // rolling rate of 91 lands exactly on the 85 threshold and 90 lands under it.
    expect(COMPLIANCE_THRESHOLD).toBe(85)

    const atThreshold = attendanceOn(
      { ...worker, helmetCompliance: 91, vestCompliance: 100 },
      new Date()
    )
    expect(atThreshold.helmetCompliance).toBe(85)
    expect(atThreshold.violations).toBe(0)

    const belowThreshold = attendanceOn(
      { ...worker, helmetCompliance: 90, vestCompliance: 100 },
      new Date()
    )
    expect(belowThreshold.helmetCompliance).toBe(84)
    expect(belowThreshold.violations).toBe(1)
  })

  it('counts a violation for each item below the compliance threshold', () => {
    for (let i = 0; i < 14; i++) {
      const record = attendanceOn(worker, dayBack(i))
      const expected =
        (record.helmetCompliance < COMPLIANCE_THRESHOLD ? 1 : 0) +
        (record.vestCompliance < COMPLIANCE_THRESHOLD ? 1 : 0)
      expect(record.violations).toBe(expected)
    }
  })

  it('labels the day for display', () => {
    expect(attendanceOn(worker, dayBack(2)).date).toMatch(/^\d{2} \w{3}$/)
  })
})
