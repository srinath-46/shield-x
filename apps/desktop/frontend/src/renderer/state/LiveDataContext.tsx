import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { Alert, Camera, DashboardMetrics, Worker } from '@/types'
import { computeMetrics, getAlerts, getCameras, getWorkers, subscribe } from '@/services/store'
import { resolveAlert as resolveAlertService } from '@/services/alertService'
import { onSensorAlert, startLiveFeed } from '@/services/liveFeed'

interface LiveDataValue {
  workers: Worker[]
  alerts: Alert[]
  cameras: Camera[]
  metrics: DashboardMetrics
  activeAlertCount: number
  /** Alerts pushed by the sensor feed since the supervisor last dismissed the banner. */
  incoming: Alert[]
  /** True until the first read of the site's state resolves. */
  isLoading: boolean
  /** False when the sensor stream has gone quiet for longer than expected. */
  isFeedConnected: boolean
  dismissIncoming: () => void
  resolveAlert: (alertId: string) => Promise<void>
}

/** Roughly three missed sensor intervals. */
const FEED_TIMEOUT_MS = 30_000

const LiveDataContext = createContext<LiveDataValue | null>(null)

/**
 * One subscription to the sensor stream for the whole application, mounted at
 * the shell so the Dashboard and Alert modules always agree on the counts
 * (FR-5.11) and both update without a reload (FR-2.6).
 */
export function LiveDataProvider({ children }: { children: ReactNode }): JSX.Element {
  const [version, setVersion] = useState(0)
  const [incoming, setIncoming] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeedConnected, setIsFeedConnected] = useState(true)

  // Any store mutation is proof the feed is alive, so recovery rides on the
  // subscription itself rather than on a separate effect.
  useEffect(
    () =>
      subscribe(() => {
        setVersion((v) => v + 1)
        setIsFeedConnected(true)
      }),
    []
  )
  useEffect(() => startLiveFeed(), [])
  useEffect(() => onSensorAlert((alert) => setIncoming((prev) => [alert, ...prev].slice(0, 5))), [])

  // The opening read of the site's state, before which the screens show their
  // loading treatment (UI-1.9).
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 550)
    return () => clearTimeout(t)
  }, [])

  // The sensor stream is considered down when nothing has arrived for a while;
  // the UI says so rather than showing stale figures as if they were live. The
  // timer is re-armed by each mutation, through `version`.
  useEffect(() => {
    if (isLoading) return
    const t = setTimeout(() => setIsFeedConnected(false), FEED_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isLoading, version])

  const dismissIncoming = useCallback(() => setIncoming([]), [])

  const resolveAlert = useCallback(async (alertId: string) => {
    await resolveAlertService(alertId)
    setIncoming((prev) => prev.filter((a) => a.id !== alertId))
  }, [])

  const value = useMemo<LiveDataValue>(() => {
    const alerts = getAlerts()
    return {
      workers: getWorkers(),
      alerts,
      cameras: getCameras(),
      metrics: computeMetrics(),
      activeAlertCount: alerts.filter((a) => a.status === 'active').length,
      incoming,
      isLoading,
      isFeedConnected,
      dismissIncoming,
      resolveAlert
    }
    // `version` is the store's change signal — the getters above read module
    // state that React cannot see, so this dependency is what makes the context
    // recompute when the store mutates. Not unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, incoming, isLoading, isFeedConnected, dismissIncoming, resolveAlert])

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export function useLiveData(): LiveDataValue {
  const ctx = useContext(LiveDataContext)
  if (!ctx) throw new Error('useLiveData must be used inside <LiveDataProvider>')
  return ctx
}
