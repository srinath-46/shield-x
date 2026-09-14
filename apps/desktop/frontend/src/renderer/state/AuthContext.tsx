import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { Supervisor } from '@/types'
import * as auth from '@/services/authService'
import { endSession, readSession, startSession, touchSession } from '@/services/sessionService'

interface AuthValue {
  supervisor: Supervisor | null
  isAuthenticated: boolean
  /** True when the last session ended by timing out rather than by logout. */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

/** How often the idle/absolute deadlines are re-checked while signed in. */
const EXPIRY_POLL_MS = 30_000

/** Activity that counts as "still at the terminal" and defers the idle timeout. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'focus'] as const

interface State {
  supervisor: Supervisor | null
  expired: boolean
}

/**
 * FR-1.9 — restores a stored session before the first paint, so a reload or an
 * app restart lands back on the last screen instead of on Login.
 */
function initialState(seed: Supervisor | null): State {
  if (seed) {
    // A seeded session (a test, or a caller that already authenticated) still
    // gets a real session record, so the idle clock applies to it as well.
    startSession(seed.email)
    return { supervisor: seed, expired: false }
  }

  const state = readSession()
  if (state.status === 'active') {
    const supervisor = auth.supervisorForEmail(state.session.email)
    if (supervisor) return { supervisor, expired: false }
    // The account no longer resolves — drop the record rather than trusting it.
    endSession()
    return { supervisor: null, expired: false }
  }
  return { supervisor: null, expired: state.status === 'expired' }
}

export function AuthProvider({
  children,
  initialSupervisor = null
}: {
  children: ReactNode
  /** Seeds an already-authenticated session — a restored session, or a test. */
  initialSupervisor?: Supervisor | null
}): JSX.Element {
  const [state, setState] = useState<State>(() => initialState(initialSupervisor))
  const { supervisor } = state

  const login = useCallback(async (email: string, password: string) => {
    const account = await auth.login(email, password)
    startSession(account.email)
    setState({ supervisor: account, expired: false })
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const account = await auth.loginWithGoogle()
    startSession(account.email)
    setState({ supervisor: account, expired: false })
  }, [])

  // FR-7.8 — ends the session; RequireAuth then blocks every module but Login.
  const logout = useCallback(() => {
    endSession()
    setState({ supervisor: null, expired: false })
  }, [])

  // FR-1.9 — while signed in, activity defers the idle deadline and a poll ends
  // the session once either deadline passes. Both callbacks fire asynchronously,
  // never during the effect itself.
  useEffect(() => {
    if (!supervisor) return

    const onActivity = (): void => touchSession()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }

    const poll = window.setInterval(() => {
      if (readSession().status !== 'active') {
        setState({ supervisor: null, expired: true })
      }
    }, EXPIRY_POLL_MS)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
      window.clearInterval(poll)
    }
  }, [supervisor])

  const value = useMemo<AuthValue>(
    () => ({
      supervisor,
      isAuthenticated: supervisor !== null,
      sessionExpired: state.expired,
      login,
      loginWithGoogle,
      logout
    }),
    [supervisor, state.expired, login, loginWithGoogle, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** The authenticated supervisor, for screens that only render behind the guard. */
export function useSupervisor(): Supervisor {
  const { supervisor } = useAuth()
  if (!supervisor) throw new Error('No authenticated supervisor')
  return supervisor
}
