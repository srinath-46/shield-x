// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as store from './store'

/**
 * The store is the application's source of truth for the alert lifecycle and
 * the dashboard figures, so each test starts from a freshly seeded copy.
 */
describe('store', () => {
  beforeEach(() => {
    store.resetStore()
  })

  /**
   * A worker on site wearing both items with nothing open against them — the
   * seeded roster includes workers who already have an active alert, and using
   * one of those would be testing the duplicate guard by accident.
   */
  function cleanWorker() {
    const open = new Set(
      store
        .getAlerts()
        .filter((a) => a.status === 'active')
        .map((a) => a.workerId)
    )
    return store
      .getWorkers()
      .find(
        (w) =>
          w.presence === 'present' && w.helmet === 'worn' && w.vest === 'worn' && !open.has(w.id)
      )!
  }

  describe('raiseAlert (FR-5.1, FR-5.2)', () => {
    it('records the removal, flips only that item, and counts a violation', () => {
      const worker = cleanWorker()
      const before = worker.violations

      const alert = store.raiseAlert(worker.id, 'helmet')

      expect(alert).not.toBeNull()
      expect(alert!.item).toBe('helmet')
      expect(alert!.status).toBe('active')
      expect(alert!.workerId).toBe(worker.id)

      const after = store.getWorkers().find((w) => w.id === worker.id)!
      expect(after.helmet).toBe('not-worn')
      expect(after.vest).toBe(worker.vest)
      expect(after.violations).toBe(before + 1)
    })

    it('does not raise a second alert while one is still open for that item', () => {
      const worker = cleanWorker()
      expect(store.raiseAlert(worker.id, 'helmet')).not.toBeNull()
      expect(store.raiseAlert(worker.id, 'helmet')).toBeNull()
      // Only open alerts are deduplicated; a resolved one stays in history and
      // does not stop the same violation being raised again later.
      const open = store
        .getAlerts()
        .filter((a) => a.workerId === worker.id && a.item === 'helmet' && a.status === 'active')
      expect(open).toHaveLength(1)
    })

    it('allows a repeat violation once the earlier alert has been resolved', () => {
      const worker = cleanWorker()
      const first = store.raiseAlert(worker.id, 'helmet')!
      store.resolveAlert(first.id)
      const second = store.raiseAlert(worker.id, 'helmet')
      expect(second).not.toBeNull()
      expect(second!.id).not.toBe(first.id)
    })

    it('raises the vest alert independently of an open helmet alert', () => {
      const worker = cleanWorker()
      store.raiseAlert(worker.id, 'helmet')
      expect(store.raiseAlert(worker.id, 'vest')).not.toBeNull()
    })

    it('ignores a worker who has left the site', () => {
      const offsite = store.getWorkers().find((w) => w.presence !== 'present')!
      expect(store.raiseAlert(offsite.id, 'helmet')).toBeNull()
    })

    it('ignores an unknown worker', () => {
      expect(store.raiseAlert('W-0000', 'helmet')).toBeNull()
    })

    it('puts the newest alert at the head of the list', () => {
      const worker = cleanWorker()
      const alert = store.raiseAlert(worker.id, 'helmet')
      expect(store.getAlerts()[0].id).toBe(alert!.id)
    })
  })

  describe('resolveAlert (FR-5.10, FR-5.12)', () => {
    it('marks the alert resolved, keeps it as history, and restores the PPE status', () => {
      const worker = cleanWorker()
      const alert = store.raiseAlert(worker.id, 'helmet')!
      const total = store.getAlerts().length

      store.resolveAlert(alert.id)

      const resolved = store.getAlerts().find((a) => a.id === alert.id)!
      expect(resolved.status).toBe('resolved')
      expect(resolved.resolvedBy).toBeTruthy()
      expect(resolved.resolvedAt).toBeTruthy()
      // Retained rather than deleted.
      expect(store.getAlerts()).toHaveLength(total)
      expect(store.getWorkers().find((w) => w.id === worker.id)!.helmet).toBe('worn')
    })

    it('is idempotent and ignores an unknown id', () => {
      const alert = store.getAlerts().find((a) => a.status === 'active')!
      store.resolveAlert(alert.id)
      const snapshot = JSON.stringify(store.getAlerts())
      store.resolveAlert(alert.id)
      store.resolveAlert('AL-0000')
      expect(JSON.stringify(store.getAlerts())).toBe(snapshot)
    })
  })

  describe('computeMetrics (FR-2.2 – FR-2.4, FR-5.11)', () => {
    it('derives every figure from the roster, so the cards cannot disagree', () => {
      const metrics = store.computeMetrics()
      const onsite = store.getWorkers().filter((w) => w.presence === 'present').length
      const active = store.getAlerts().filter((a) => a.status === 'active').length

      expect(metrics.totalOnsite).toBe(onsite)
      expect(metrics.activeViolations).toBe(active)
      expect(metrics.safeWorkers).toBeLessThanOrEqual(metrics.totalOnsite)
      expect(metrics.camerasOnline).toBeLessThanOrEqual(metrics.camerasTotal)
    })

    it('moves the violation count up on a new alert and back down when it is resolved', () => {
      const before = store.computeMetrics().activeViolations
      const worker = cleanWorker()
      const alert = store.raiseAlert(worker.id, 'helmet')!

      expect(store.computeMetrics().activeViolations).toBe(before + 1)

      store.resolveAlert(alert.id)
      expect(store.computeMetrics().activeViolations).toBe(before)
    })

    it('counts a worker with two open alerts once against safe workers', () => {
      const worker = cleanWorker()
      const safeBefore = store.computeMetrics().safeWorkers
      store.raiseAlert(worker.id, 'helmet')
      store.raiseAlert(worker.id, 'vest')
      expect(store.computeMetrics().safeWorkers).toBe(safeBefore - 1)
    })
  })

  describe('subscribe', () => {
    it('notifies on every mutation and stops after unsubscribing', () => {
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      const worker = cleanWorker()

      const alert = store.raiseAlert(worker.id, 'helmet')!
      store.resolveAlert(alert.id)
      store.setCameraStatus('CAM 01', 'offline')
      expect(listener).toHaveBeenCalledTimes(3)

      unsubscribe()
      store.setCameraStatus('CAM 01', 'online')
      expect(listener).toHaveBeenCalledTimes(3)
    })
  })

  describe('resetStore', () => {
    it('undoes mutations, so no test inherits the previous one', () => {
      const active = store.getAlerts().find((a) => a.status === 'active')!
      store.resolveAlert(active.id)
      expect(store.getAlerts().find((a) => a.id === active.id)!.status).toBe('resolved')

      store.resetStore()
      expect(store.getAlerts().find((a) => a.id === active.id)!.status).toBe('active')
    })
  })

  describe('delay', () => {
    it('resolves with its value after the simulated latency', async () => {
      vi.useFakeTimers()
      try {
        const pending = store.delay('ready', 300)
        await vi.advanceTimersByTimeAsync(300)
        await expect(pending).resolves.toBe('ready')
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
