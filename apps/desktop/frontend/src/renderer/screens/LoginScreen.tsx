import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { isValidEmail, requestPasswordReset } from '@/services/authService'
import { AlertCircleIcon, CheckCircleIcon, GoogleIcon, ShieldCheckIcon } from '@/components/Icons'
import { Spinner } from '@/components/Spinner'

type Mode = 'sign-in' | 'recover'

/** Module 3.1 — the entry point; nothing else is reachable until it succeeds. */
export function LoginScreen(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, sessionExpired } = useAuth()

  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<'password' | 'google' | 'reset' | null>(null)

  // FR-1.6 — land on the Dashboard, or on whatever screen was being requested.
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setFormError(null)
    setNotice(null)

    // FR-1.3 — the email is validated before any credential leaves the screen.
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError(null)

    setPending('password')
    try {
      await login(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setPending(null)
    }
  }

  async function onGoogle(): Promise<void> {
    setFormError(null)
    setPending('google')
    try {
      await loginWithGoogle()
      navigate(destination, { replace: true })
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setPending(null)
    }
  }

  async function onRecover(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError(null)
    setPending('reset')
    try {
      setNotice(await requestPasswordReset(email))
      setMode('sign-in')
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null

  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 360 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 26
          }}
        >
          <span style={{ color: 'var(--color-accent)', display: 'flex' }}>
            <ShieldCheckIcon size={52} strokeWidth={1.8} />
          </span>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 26,
              marginTop: 12,
              letterSpacing: '-0.01em'
            }}
          >
            Shield X
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
            Site Supervisor sign-in
          </div>
        </div>

        <form
          onSubmit={mode === 'sign-in' ? onSubmit : onRecover}
          noValidate
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 22,
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* FR-1.9 — a session that timed out says so, rather than silently
              returning the supervisor to a blank sign-in screen. */}
          {sessionExpired && !formError && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-400)',
                padding: '9px 11px'
              }}
            >
              <span style={{ color: 'var(--color-neutral-700)', display: 'flex', marginTop: 1 }}>
                <AlertCircleIcon size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-neutral-800)' }}>
                Your session timed out after a period of inactivity. Please sign in again.
              </span>
            </div>
          )}

          {/* FR-1.5 / UI-2.7 — failures are reported inline, never on a new page. */}
          {formError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'var(--color-accent-100)',
                border: '1px solid var(--color-accent-300)',
                padding: '9px 11px'
              }}
            >
              <span style={{ color: 'var(--color-accent-700)', display: 'flex', marginTop: 1 }}>
                <AlertCircleIcon size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-accent-800)' }}>{formError}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'var(--color-safe-bg)',
                border: '1px solid var(--color-safe)',
                padding: '9px 11px'
              }}
            >
              <span style={{ color: 'var(--color-safe-text)', display: 'flex', marginTop: 1 }}>
                <CheckCircleIcon size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-safe-text)' }}>{notice}</span>
            </div>
          )}

          {mode === 'recover' && (
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
              Enter your registered email address and we'll send reset instructions to it.
            </div>
          )}

          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className={`input${emailError ? ' input-error' : ''}`}
              placeholder="supervisor@site.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'login-email-error' : undefined}
              // The sign-in card is the entire content of this window and the
              // email field is its first control, so taking focus on arrival
              // moves nobody past anything.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            {/* UI-1.10 — the message sits directly under the field that caused it. */}
            {emailError && (
              <div className="field-error" id="login-email-error">
                {emailError}
              </div>
            )}
          </div>

          {mode === 'sign-in' && (
            <>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                {/* FR-1.4 — characters are masked. */}
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 400 }}
                  onClick={() => {
                    setMode('recover')
                    setFormError(null)
                    setNotice(null)
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* UI-2.8 — disabled with a loading state while authentication runs. */}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {pending === 'password' || pending === 'reset' ? (
              <>
                <Spinner size={15} track="rgba(255,255,255,.4)" head="#fff" />
                {pending === 'reset' ? 'Sending…' : 'Signing in…'}
              </>
            ) : mode === 'sign-in' ? (
              'Log in'
            ) : (
              'Send reset instructions'
            )}
          </button>

          {mode === 'recover' ? (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => {
                setMode('sign-in')
                setEmailError(null)
              }}
              disabled={busy}
            >
              Back to sign-in
            </button>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--color-neutral-500)',
                  fontSize: 11
                }}
              >
                <span style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
                OR
                <span style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
              </div>

              {/* FR-1.2 / UI-2.4 */}
              <button
                type="button"
                className="btn btn-secondary btn-block"
                style={{ gap: 9 }}
                onClick={onGoogle}
                disabled={busy}
              >
                {pending === 'google' ? <Spinner size={15} /> : <GoogleIcon />}
                Sign in with Google
              </button>
            </>
          )}
        </form>

        <p
          style={{
            fontSize: 11,
            color: 'var(--color-neutral-500)',
            textAlign: 'center',
            marginTop: 14
          }}
        >
          Demo credentials — r.mendez@site.com / shieldx
        </p>
      </div>
    </div>
  )
}
