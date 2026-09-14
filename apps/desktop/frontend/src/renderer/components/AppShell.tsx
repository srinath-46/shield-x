import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/** Sidebar + scrollable content column — the frame every module renders into. */
export function AppShell(): JSX.Element {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--color-bg)' }}>
      {/* First stop for keyboard users, so the six nav links aren't in the way
          of the screen's own controls on every route (UI-1.12). */}
      <a href="#main" className="skip-link no-print">
        Skip to content
      </a>
      <Sidebar />
      <main
        id="main"
        tabIndex={-1}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
      >
        <Outlet />
      </main>
    </div>
  )
}
