// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { filterAlerts, formatAlertTime, sortNewestFirst } from './alertService'
import type { Alert, AlertFilters, ZoneId } from '@/types'

function alert(patch: Partial<Alert> = {}): Alert {
  return {
    id: 'AL-1',
    workerId: 'W-1042',
    workerName: 'J. Alvarez',
    zoneId: 'C',
    item: 'helmet',
    helmet: 'not-worn',
    vest: 'worn',
    raisedAt: new Date().toISOString(),
    status: 'active',
    ...patch
  }
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const all: AlertFilters = { status: 'all', zoneId: 'all', date: 'all' }

describe('filterAlerts (UI-6.8)', () => {
  const alerts = [
    alert({ id: 'AL-1', status: 'active', zoneId: 'C', raisedAt: hoursAgo(1) }),
    alert({ id: 'AL-2', status: 'resolved', zoneId: 'A', raisedAt: hoursAgo(2) }),
    alert({ id: 'AL-3', status: 'active', zoneId: 'A', raisedAt: daysAgo(3) }),
    alert({ id: 'AL-4', status: 'active', zoneId: 'B', raisedAt: daysAgo(30) })
  ]

  it('filters by status', () => {
    expect(
      filterAlerts(alerts, { ...all, status: 'active' }).every((a) => a.status === 'active')
    ).toBe(true)
    expect(filterAlerts(alerts, { ...all, status: 'resolved' }).map((a) => a.id)).toEqual(['AL-2'])
  })

  it('filters by zone', () => {
    const zoneA = filterAlerts(alerts, { ...all, zoneId: 'A' as ZoneId })
    expect(zoneA.map((a) => a.id).sort()).toEqual(['AL-2', 'AL-3'])
  })

  it('limits "today" to alerts raised today', () => {
    const today = filterAlerts(alerts, { ...all, date: 'today' })
    expect(today.map((a) => a.id).sort()).toEqual(['AL-1', 'AL-2'])
  })

  it('limits "week" to the last seven days', () => {
    const week = filterAlerts(alerts, { ...all, date: 'week' })
    expect(week.map((a) => a.id)).toContain('AL-3')
    expect(week.map((a) => a.id)).not.toContain('AL-4')
  })

  it('combines status, zone and date', () => {
    const result = filterAlerts(alerts, { status: 'active', zoneId: 'A', date: 'week' })
    expect(result.map((a) => a.id)).toEqual(['AL-3'])
  })
})

describe('sortNewestFirst (UI-6.3)', () => {
  it('puts the most recent alert first without mutating the input', () => {
    const input = [
      alert({ id: 'old', raisedAt: hoursAgo(5) }),
      alert({ id: 'new', raisedAt: hoursAgo(1) }),
      alert({ id: 'middle', raisedAt: hoursAgo(3) })
    ]
    const original = input.map((a) => a.id)

    expect(sortNewestFirst(input).map((a) => a.id)).toEqual(['new', 'middle', 'old'])
    expect(input.map((a) => a.id)).toEqual(original)
  })
})

describe('formatAlertTime (FR-5.7)', () => {
  it('renders a day, month and 24-hour time', () => {
    const at = new Date()
    at.setHours(14, 32, 0, 0)
    expect(formatAlertTime(at.toISOString())).toMatch(/^\d{2} \w{3} \d{2}:\d{2}$/)
  })
})
