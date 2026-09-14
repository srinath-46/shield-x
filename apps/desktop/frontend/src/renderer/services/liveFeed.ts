import type { Alert, PpeItem } from '@/types'
import { getWorkers, raiseAlert } from './store'

/**
 * Stands in for the BLE sensor stream. Every few seconds a worker on site
 * removes a helmet or vest, which raises an alert and moves the dashboard
 * figures — exercising the "updates without a manual reload" requirements
 * (FR-2.6, FR-5.1, FR-5.2, UI-6.9) end to end.
 */

const INTERVAL_MS = 9000

type AlertListener = (alert: Alert) => void

let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<AlertListener>()

export function onSensorAlert(listener: AlertListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function tick(): void {
  const candidates = getWorkers().filter(
    (w) => w.presence === 'present' && (w.helmet === 'worn' || w.vest === 'worn')
  )
  if (candidates.length === 0) return

  const worker = candidates[Math.floor(Math.random() * candidates.length)]
  const removable: PpeItem[] = []
  if (worker.helmet === 'worn') removable.push('helmet')
  if (worker.vest === 'worn') removable.push('vest')

  const item = removable[Math.floor(Math.random() * removable.length)]
  const alert = raiseAlert(worker.id, item)
  if (alert) listeners.forEach((l) => l(alert))
}

export function startLiveFeed(): () => void {
  if (!timer) timer = setInterval(tick, INTERVAL_MS)
  return stopLiveFeed
}

export function stopLiveFeed(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
