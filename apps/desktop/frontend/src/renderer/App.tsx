import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider, useAuth } from '@/state/AuthContext'
import { LiveDataProvider } from '@/state/LiveDataContext'
import { LoginScreen } from '@/screens/LoginScreen'
import { DashboardScreen } from '@/screens/DashboardScreen'
import { CameraScreen } from '@/screens/CameraScreen'
import { AttendanceScreen } from '@/screens/AttendanceScreen'
import { AlertsScreen } from '@/screens/AlertsScreen'
import { WorkerReportScreen } from '@/screens/WorkerReportScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'

/** FR-1.8 — no module but Login is reachable until authentication succeeds. */
function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  // The live sensor subscription only exists inside an authenticated session.
  return <LiveDataProvider>{children}</LiveDataProvider>
}

export function App(): JSX.Element {
  return (
    // HashRouter: the packaged app is served from file://, where path routing
    // cannot resolve on reload.
    <HashRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/camera" element={<CameraScreen />} />
              <Route path="/attendance" element={<AttendanceScreen />} />
              <Route path="/alerts" element={<AlertsScreen />} />
              <Route path="/report" element={<WorkerReportScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  )
}
