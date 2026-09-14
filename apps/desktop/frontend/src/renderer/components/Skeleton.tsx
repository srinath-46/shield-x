/**
 * Placeholder blocks for the window between mount and the first data arriving
 * (UI-1.9). They hold the shape of the real content so the screen doesn't jump
 * when the figures land.
 */
export function Skeleton({
  height,
  width = '100%',
  radius = 0
}: {
  height: number
  width?: number | string
  radius?: number
}): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="sx-skeleton"
      style={{ display: 'block', height, width, borderRadius: radius }}
    />
  )
}

/** Three metric cards and the panels beneath them — the Dashboard's shape. */
export function DashboardSkeleton(): JSX.Element {
  return (
    <div style={{ padding: '26px 28px' }} role="status" aria-label="Loading dashboard">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 18,
          marginBottom: 22
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel" style={{ padding: 20 }}>
            <Skeleton height={12} width="55%" />
            <div style={{ height: 14 }} />
            <Skeleton height={44} width="40%" />
            <div style={{ height: 10 }} />
            <Skeleton height={10} width="65%" />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <Skeleton height={300} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={14} width="40%" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={70} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** A stack of rows, for the alert list and other list screens. */
export function ListSkeleton({
  rows = 4,
  height = 62
}: {
  rows?: number
  height?: number
}): JSX.Element {
  return (
    <div
      style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  )
}

/** The camera wall's tile grid. */
export function CameraSkeleton(): JSX.Element {
  return (
    <div
      style={{
        padding: '22px 28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
        gap: 18
      }}
      role="status"
      aria-label="Loading camera feeds"
    >
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={240} />
      ))}
    </div>
  )
}
