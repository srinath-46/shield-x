import { useEffect, useRef, useState, type ReactNode } from 'react'
import { visuallyHidden } from './visuallyHidden'

interface MetricCardProps {
  label: string
  value: number
  caption: ReactNode
  icon: ReactNode
  /** UI-3.4 — the violations card is emphasised whenever its value is > 0. */
  emphasised?: boolean
}

/**
 * UI-3.2 / UI-3.3 — label, prominent figure, icon, caption. When the figure
 * changes the card flashes briefly, the cue that a value refreshed in place
 * rather than the whole view reloading (UI-3.8).
 */
export function MetricCard({
  label,
  value,
  caption,
  icon,
  emphasised = false
}: MetricCardProps): JSX.Element {
  const changed = useValueChanged(value)

  return (
    <div
      className={emphasised ? 'panel-alert' : 'panel'}
      style={{ padding: 20, position: 'relative', overflow: 'hidden' }}
    >
      {changed && (
        <span
          className="sx-flash"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            fontWeight: emphasised ? 700 : 400,
            color: emphasised ? 'var(--color-accent-800)' : 'var(--color-neutral-600)'
          }}
        >
          {label}
        </div>
        <span style={{ display: 'flex' }}>{icon}</span>
      </div>
      {/* Announced on change, since the figure updates in place (UI-3.8). */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1,
          marginTop: 10,
          color: emphasised ? 'var(--color-accent)' : undefined
        }}
      >
        {value}
        <span style={visuallyHidden}> {label}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          marginTop: 6,
          color: emphasised ? 'var(--color-accent-800)' : 'var(--color-neutral-600)'
        }}
      >
        {caption}
      </div>
    </div>
  )
}

/** True for ~1.1s after `value` changes, driving the flash cue. */
export function useValueChanged(value: number): boolean {
  const previous = useRef(value)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (previous.current === value) return
    previous.current = value
    setChanged(true)
    const t = setTimeout(() => setChanged(false), 1100)
    return () => clearTimeout(t)
  }, [value])

  return changed
}
