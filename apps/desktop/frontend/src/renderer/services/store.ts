import type {
  Alert,
  Camera,
  CameraStatus,
  DashboardMetrics,
  PpeItem,
  Worker,
  ZoneId
} from '@/types'
import { ALERTS, CAMERAS, SUPERVISOR, WORKERS, ZONES } from './mockData'

/**
 * Mutable in-memory state plus a subscription channel. Stands in for the
 * backend's push connection: the live feed writes here, screens read from here
 * through `LiveDataContext`, and every mutation notifies subscribers so the UI
 * refreshes in place without a manual reload (FR-2.6, FR-5.11, UI-6.9).
 */

let workers: Worker[] = WORKERS.map((w) => ({ ...w }))
let alerts: Alert[] = ALERTS.map((a) => ({ ...a }))
let cameras: Camera[] = CAMERAS.map((c) => ({ ...c }))

type Listener = () => void
const listeners = new Set<Listener>()

/**
 * Re-seeds the store from the mock data. Tests call this between cases so one
 * resolved alert doesn't leak into the next; the real backend swap drops it
 * along with the rest of this file.
 */
export function resetStore(): void {
  workers = WORKERS.map((w) => ({ ...w }))
  alerts = ALERTS.map((a) => ({ ...a }))
  cameras = CAMERAS.map((c) => ({ ...c }))
  alertSequence = 5002
  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(): void {
  listeners.forEach((l) => l())
}

/** Simulated network latency, so loading states are real (UI-1.9). */
export function delay<T>(value: T, ms = 260 + Math.random() * 240): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function getWorkers(): Worker[] {
  return workers
}

export function getAlerts(): Alert[] {
  return alerts
}

export function getCameras(): Camera[] {
  return cameras
}

/**
 * Dashboard figures are derived, never stored, so a resolved alert or a sensor
 * event moves every card at once and the counts can never disagree.
 */
export function computeMetrics(): DashboardMetrics {
  const onsite = workers.filter((w) => w.presence === 'present')
  const activeViolations = alerts.filter((a) => a.status === 'active').length
  const violatingWorkers = new Set(
    alerts.filter((a) => a.status === 'active').map((a) => a.workerId)
  )
  const totalOnsite = onsite.length
  return {
    totalOnsite,
    activeViolations,
    safeWorkers: Math.max(0, totalOnsite - violatingWorkers.size),
    zoneCount: ZONES.length,
    camerasOnline: cameras.filter((c) => c.status === 'online').length,
    camerasTotal: cameras.length,
    updatedAt: Date.now()
  }
}

let alertSequence = 5002

/** A sensor reports that a worker removed a helmet or vest (FR-5.1, FR-5.2). */
export function raiseAlert(workerId: string, item: PpeItem): Alert | null {
  const worker = workers.find((w) => w.id === workerId)
  if (!worker || worker.presence !== 'present') return null
  if (alerts.some((a) => a.status === 'active' && a.workerId === workerId && a.item === item)) {
    return null
  }

  workers = workers.map((w) =>
    w.id === workerId
      ? {
          ...w,
          helmet: item === 'helmet' ? 'not-worn' : w.helmet,
          vest: item === 'vest' ? 'not-worn' : w.vest,
          violations: w.violations + 1
        }
      : w
  )
  const updated = workers.find((w) => w.id === workerId)!
  const alert: Alert = {
    id: `AL-${alertSequence++}`,
    workerId: updated.id,
    workerName: updated.name,
    zoneId: updated.zoneId,
    item,
    helmet: updated.helmet,
    vest: updated.vest,
    raisedAt: new Date().toISOString(),
    status: 'active'
  }
  alerts = [alert, ...alerts]
  emit()
  return alert
}

/** The supervisor confirms the violation has been addressed (FR-5.10). */
export function resolveAlert(alertId: string): void {
  const alert = alerts.find((a) => a.id === alertId)
  if (!alert || alert.status === 'resolved') return

  // Resolved alerts are retained as history, never deleted (FR-5.12).
  alerts = alerts.map((a) =>
    a.id === alertId
      ? {
          ...a,
          status: 'resolved',
          resolvedBy: SUPERVISOR.shortName,
          resolvedAt: new Date().toISOString(),
          helmet: 'worn',
          vest: 'worn'
        }
      : a
  )
  workers = workers.map((w) =>
    w.id === alert.workerId && w.presence === 'present'
      ? {
          ...w,
          helmet: alert.item === 'helmet' ? 'worn' : w.helmet,
          vest: alert.item === 'vest' ? 'worn' : w.vest
        }
      : w
  )
  emit()
}

export function setCameraStatus(cameraId: string, status: CameraStatus): void {
  cameras = cameras.map((c) => (c.id === cameraId ? { ...c, status } : c))
  emit()
}

export function activeAlertsForZone(zoneId: ZoneId): Alert[] {
  return alerts.filter((a) => a.status === 'active' && a.zoneId === zoneId)
}
