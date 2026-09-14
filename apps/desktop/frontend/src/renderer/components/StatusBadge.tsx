import type { CameraStatus, PpeStatus, PresenceStatus } from '@/types'

type Variant = 'safe' | 'violation' | 'violation-solid' | 'neutral'

interface StatusBadgeProps {
  variant: Variant
  label: string
  /** Some badges (ACTIVE / RESOLVED) read as plain chips without a dot. */
  dot?: boolean
}

/**
 * The single source of every status chip in the app. Colour always travels with
 * a text label, so status never depends on colour alone (UI-1.6).
 */
export function StatusBadge({ variant, label, dot = true }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="badge-dot" />}
      {label}
    </span>
  )
}

/** FR-4.5 / FR-4.6 / FR-5.5 / FR-5.6 — helmet and vest state. */
export function PpeBadge({
  status,
  item,
  solid = false
}: {
  status: PpeStatus
  /** Prefixes the label on screens that show both items in one row. */
  item?: 'Helmet' | 'Vest'
  solid?: boolean
}): JSX.Element {
  const prefix = item ? `${item} ` : ''
  if (status === 'worn') return <StatusBadge variant="safe" label={`${prefix}Worn`} dot={!item} />
  if (status === 'not-worn') {
    return (
      <StatusBadge
        variant={solid ? 'violation-solid' : 'violation'}
        label={`${prefix}Not Worn`}
        dot
      />
    )
  }
  return <span style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>—</span>
}

/** FR-4.4 */
export function PresenceBadge({ status }: { status: PresenceStatus }): JSX.Element {
  if (status === 'present') return <StatusBadge variant="safe" label="Present" />
  if (status === 'checked-out') return <StatusBadge variant="neutral" label="Checked out" />
  return <StatusBadge variant="neutral" label="Absent" />
}

/** FR-3.5 / UI-4.3 — camera reachability, shown on the tile itself. */
export function CameraStatusChip({ status }: { status: CameraStatus }): JSX.Element {
  const styles: Record<CameraStatus, { bg: string; dot: string; label: string; live?: boolean }> = {
    online: { bg: 'rgba(20,120,60,.85)', dot: '#7be39a', label: 'ONLINE' },
    offline: { bg: 'var(--color-neutral-600)', dot: 'var(--color-neutral-300)', label: 'OFFLINE' },
    reconnecting: {
      bg: 'rgba(0,0,0,.5)',
      dot: 'var(--color-warn)',
      label: 'RECONNECTING',
      live: true
    }
  }
  const s = styles[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        background: s.bg,
        padding: '3px 8px'
      }}
    >
      <span
        className={s.live ? 'sx-live' : undefined}
        style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }}
      />
      {s.label}
    </span>
  )
}

/** FR-5.8 / UI-6.7 */
export function AlertStatusBadge({ status }: { status: 'active' | 'resolved' }): JSX.Element {
  const active = status === 'active'
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 9px',
        whiteSpace: 'nowrap',
        background: active ? 'var(--color-accent)' : 'var(--color-neutral-200)',
        color: active ? '#fff' : 'var(--color-neutral-700)'
      }}
    >
      {active ? 'ACTIVE' : 'RESOLVED'}
    </span>
  )
}
