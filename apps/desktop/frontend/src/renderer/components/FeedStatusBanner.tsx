import { useLiveData } from '@/state/LiveDataContext'
import { AlertCircleIcon } from './Icons'

/**
 * UI-1.5 / UI-1.10 — when the sensor stream goes quiet the figures on screen
 * are no longer live, and the supervisor is told so in plain language rather
 * than left reading stale numbers. Grey, the palette's "unavailable" role.
 */
export function FeedStatusBanner(): JSX.Element | null {
  const { isFeedConnected, isLoading } = useLiveData()
  if (isLoading || isFeedConnected) return null

  return (
    <div
      role="status"
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 28px',
        background: 'var(--color-neutral-200)',
        borderBottom: '1px solid var(--color-divider)',
        color: 'var(--color-neutral-800)',
        fontSize: 12,
        flex: 'none'
      }}
    >
      <AlertCircleIcon size={15} strokeWidth={2} />
      <span>
        <b>Sensor feed unavailable</b> — no readings have arrived recently, so these figures may be
        out of date.
      </span>
    </div>
  )
}
