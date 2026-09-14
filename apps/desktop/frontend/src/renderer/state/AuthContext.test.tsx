import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { SESSION_KEY, IDLE_TIMEOUT_MS, startSession } from '@/services/sessionService'
import { SUPERVISOR, VALID_CREDENTIALS } from '@/services/mockData'
import { LoginScreen } from '@/screens/LoginScreen'

/** Reports what the provider decided, so the tests read the contract not the DOM. */
function SessionProbe(): JSX.Element {
  const { supervisor, isAuthenticated, sessionExpired, logout } = useAuth()
  return (
    <div>
      <span data-testid="who">{supervisor?.name ?? 'signed out'}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="expired">{String(sessionExpired)}</span>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  )
}

function mount(): void {
  render(
    <MemoryRouter>
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('session restore (FR-1.9)', () => {
  it('signs the supervisor back in from a stored session', () => {
    // Stands in for a reload or an app restart: storage survives, memory does not.
    startSession(VALID_CREDENTIALS.email)
    mount()
    expect(screen.getByTestId('auth')).toHaveTextContent('true')
    expect(screen.getByTestId('who')).toHaveTextContent(SUPERVISOR.name)
  })

  it('starts signed out when nothing was stored', () => {
    mount()
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
    expect(screen.getByTestId('expired')).toHaveTextContent('false')
  })

  it('does not restore a session that timed out', () => {
    startSession(VALID_CREDENTIALS.email, Date.now() - IDLE_TIMEOUT_MS - 1000)
    mount()
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
    expect(screen.getByTestId('expired')).toHaveTextContent('true')
  })

  it('refuses a stored session whose account no longer resolves', () => {
    startSession('someone.else@elsewhere.com')
    mount()
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
    // The unusable record is discarded rather than left to fail on every load.
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('ignores a stored session when one is seeded explicitly', () => {
    startSession('someone.else@elsewhere.com')
    render(
      <MemoryRouter>
        <AuthProvider initialSupervisor={SUPERVISOR}>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('who')).toHaveTextContent(SUPERVISOR.name)
  })
})

describe('session lifecycle', () => {
  it('persists the session on a successful sign-in', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), VALID_CREDENTIALS.email)
    await user.type(screen.getByLabelText(/password/i), VALID_CREDENTIALS.password)
    await user.click(screen.getByRole('button', { name: /^log in$/i }))

    // The sign-in is asynchronous; wait on the session itself, not on the card,
    // whose heading is present the whole time.
    await waitFor(() => expect(localStorage.getItem(SESSION_KEY)).not.toBeNull())
    expect(localStorage.getItem(SESSION_KEY)).toContain(VALID_CREDENTIALS.email)
  })

  it('clears the stored session on logout (FR-7.8)', async () => {
    const user = userEvent.setup()
    startSession(VALID_CREDENTIALS.email)
    mount()

    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(screen.getByTestId('auth')).toHaveTextContent('false')
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    // A deliberate logout is not a timeout, so Login must not blame inactivity.
    expect(screen.getByTestId('expired')).toHaveTextContent('false')
  })
})

describe('the Login screen explains a timeout (FR-1.9)', () => {
  it('names inactivity as the reason after a session expires', () => {
    startSession(VALID_CREDENTIALS.email, Date.now() - IDLE_TIMEOUT_MS - 1000)
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/session timed out/i)).toBeInTheDocument()
  })

  it('says nothing about timeouts on an ordinary first visit', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/session timed out/i)).not.toBeInTheDocument()
  })
})
