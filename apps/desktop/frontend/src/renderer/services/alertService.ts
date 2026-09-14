import type { Alert, AlertFilters } from '@/types'
import { resolveAlert as resolveInStore } from './store'

/** FR-5.10 — called only after the supervisor confirms (UI-6.6). */
export async function resolveAlert(alertId: string): Promise<void> {
  resolveInStore(alertId)
}

/** UI-6.8 — status, zone, and date filters, applied to the live alert list. */
export function filterAlerts(alerts: Alert[], filters: AlertFilters): Alert[] {
  const now = Date.now()
  return alerts.filter((a) => {
    if (filters.status !== 'all' && a.status !== filters.status) return false
    if (filters.zoneId !== 'all' && a.zoneId !== filters.zoneId) return false
    if (filters.date === 'today' && !isSameDay(new Date(a.raisedAt), new Date())) return false
    if (filters.date === 'week' && now - new Date(a.raisedAt).getTime() > 7 * 24 * 3600 * 1000) {
      return false
    }
    return true
  })
}

/** UI-6.3 — most recent alert first. */
export function sortNewestFirst(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime())
}

export function formatAlertTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString(
    'en-GB',
    { hour: '2-digit', minute: '2-digit' }
  )}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
