import type { ReactNode } from 'react'

/** The 64px title row shared by every module screen. */
export function PageHeader({
  title,
  children
}: {
  title: string
  children?: ReactNode
}): JSX.Element {
  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 28px',
        height: 64,
        flex: 'none',
        borderBottom: '2px solid var(--color-divider)'
      }}
    >
      <h2 style={{ fontSize: 22, margin: 0 }}>{title}</h2>
      {children && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}
