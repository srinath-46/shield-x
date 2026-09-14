import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AuthProvider } from '@/state/AuthContext'
import { LiveDataProvider } from '@/state/LiveDataContext'
import { SUPERVISOR } from '@/services/mockData'

interface Options {
  /** Initial route, for screens that read search params (the camera zone link). */
  route?: string
  /** Route pattern to mount the subject at, when it reads route params. */
  path?: string
  /** Screens behind the auth guard need a session; pass null to test signed-out. */
  authenticated?: boolean
}

/**
 * Screens read the router, the session, and the live sensor data. This mounts
 * all three the way `App.tsx` does, pre-authenticated by default so a test of
 * the Attendance table isn't really a test of the login flow.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path, authenticated = true }: Options = {}
): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider initialSupervisor={authenticated ? SUPERVISOR : null}>
        <LiveDataProvider>
          {path ? (
            <Routes>
              <Route path={path} element={ui} />
            </Routes>
          ) : (
            ui
          )}
        </LiveDataProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}
