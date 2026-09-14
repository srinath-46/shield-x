import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
  /** Vertical padding — tighter inside a table, roomier in a full region. */
  compact?: boolean
}

/** UI-5.7 / UI-7.7 — plain-language empty states, never a blank panel. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  compact = false
}: EmptyStateProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: compact ? '64px 20px' : '20px',
        flex: compact ? undefined : 1,
        textAlign: 'center'
      }}
    >
      <span style={{ color: 'var(--color-neutral-400)' }}>{icon}</span>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-neutral-600)', maxWidth: 360 }}>
        {message}
      </div>
      {action}
    </div>
  )
}
