interface SpinnerProps {
  size?: number
  /** Track / head colours, so the same spinner works on light and dark panels. */
  track?: string
  head?: string
}

/** UI-1.9 — the one loading indicator used everywhere. */
export function Spinner({
  size = 16,
  track = 'var(--color-neutral-300)',
  head = 'var(--color-accent)'
}: SpinnerProps): JSX.Element {
  return (
    <span
      className="sx-spin"
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `${Math.max(2, Math.round(size / 8))}px solid ${track}`,
        borderTopColor: head,
        borderRadius: '50%',
        flex: 'none'
      }}
    />
  )
}

/** Centred loader for a whole content region while its first fetch runs. */
export function LoadingRegion({ label = 'Loading…' }: { label?: string }): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 48,
        color: 'var(--color-neutral-600)',
        fontSize: 13
      }}
    >
      <Spinner size={26} />
      {label}
    </div>
  )
}
