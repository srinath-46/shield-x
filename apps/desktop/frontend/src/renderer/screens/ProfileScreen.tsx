import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useFocusTrap } from '@/components/useFocusTrap'
import { Avatar } from '@/components/Sidebar'
import { Spinner } from '@/components/Spinner'
import { LockIcon, LogoutIcon } from '@/components/Icons'
import { useAuth, useSupervisor } from '@/state/AuthContext'
import { STRENGTH_LABELS, changePassword, passwordStrength } from '@/services/authService'

/** Module 3.7 — the supervisor's own account details. */
export function ProfileScreen(): JSX.Element {
  const navigate = useNavigate()
  const supervisor = useSupervisor()
  const { logout } = useAuth()
  const [changing, setChanging] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <>
      <PageHeader title="Supervisor Profile" />

      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ maxWidth: 560 }}>
          {/* UI-8.1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            <Avatar initials={supervisor.initials} size={76} fontSize={22} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24 }}>
                {supervisor.name}
              </div>
              <span className="tag tag-accent" style={{ fontWeight: 700, marginTop: 5 }}>
                {supervisor.role}
              </span>
            </div>
          </div>

          {/* UI-8.2 — labelled read-only fields, single column. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ReadOnlyField id="profile-email" label="Email" value={supervisor.email} />
            <ReadOnlyField id="profile-id" label="Employee ID" value={supervisor.employeeId} />
            <ReadOnlyField
              id="profile-site"
              label="Assigned construction site"
              value={supervisor.site}
            />
            <ReadOnlyField id="profile-role" label="Role / designation" value={supervisor.role} />
          </div>

          <hr className="hr" />

          {saved && (
            <div
              role="status"
              style={{
                background: 'var(--color-safe-bg)',
                color: 'var(--color-safe-text)',
                fontSize: 12,
                padding: '9px 11px',
                marginBottom: 16
              }}
            >
              Your password has been updated.
            </div>
          )}

          {/* UI-8.5 — logout is separated and styled as session-ending. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSaved(false)
                setChanging(true)
              }}
            >
              <LockIcon size={15} />
              Change password
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmLogout(true)}>
              <LogoutIcon size={15} />
              Log out
            </button>
          </div>
        </div>
      </div>

      {changing && (
        <ChangePasswordDialog
          onClose={() => setChanging(false)}
          onSaved={() => {
            setChanging(false)
            setSaved(true)
          }}
        />
      )}

      {/* UI-8.6 */}
      <ConfirmDialog
        open={confirmLogout}
        title="Log out of Shield X?"
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          logout()
          navigate('/login', { replace: true })
        }}
      >
        Your session will end and you'll return to the login page. Any unsaved filters will be
        cleared.
      </ConfirmDialog>
    </>
  )
}

function ReadOnlyField({
  id,
  label,
  value
}: {
  id: string
  label: string
  value: string
}): JSX.Element {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" value={value} readOnly />
    </div>
  )
}

/** FR-7.7 with inline strength and mismatch feedback (UI-8.3, UI-8.4). */
function ChangePasswordDialog({
  onClose,
  onSaved
}: {
  onClose: () => void
  onSaved: () => void
}): JSX.Element {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const panelRef = useFocusTrap<HTMLFormElement>(true, onClose)

  const strength = passwordStrength(next)
  const mismatch = confirm.length > 0 && confirm !== next
  const canSave =
    current.length > 0 && next.length >= 8 && confirm === next && strength >= 2 && !saving

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await changePassword(current, next)
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Presentational for the same reason as ConfirmDialog's backdrop: Escape is
    // the keyboard route out.
    <div
      className="dialog-backdrop no-print"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        ref={panelRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        style={{ width: 'min(420px, 100%)' }}
        onSubmit={onSubmit}
      >
        <div className="dialog-title" id="change-password-title">
          Change password
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--color-accent-100)',
              border: '1px solid var(--color-accent-300)',
              color: 'var(--color-accent-800)',
              fontSize: 12,
              padding: '9px 11px'
            }}
          >
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            data-autofocus
          />
        </div>

        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            className="input"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-describedby="new-password-strength"
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  background:
                    i < strength
                      ? strength >= 3
                        ? 'var(--color-safe)'
                        : 'var(--color-warn)'
                      : 'var(--color-neutral-300)'
                }}
              />
            ))}
          </div>
          <div
            id="new-password-strength"
            style={{
              fontSize: 11,
              marginTop: 4,
              color: strength >= 3 ? 'var(--color-safe-text)' : 'var(--color-neutral-600)'
            }}
          >
            {next.length === 0 ? 'Use at least 8 characters.' : STRENGTH_LABELS[strength]}
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            className={`input${mismatch ? ' input-error' : ''}`}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? 'confirm-password-error' : undefined}
          />
          {mismatch && (
            <div className="field-error" id="confirm-password-error">
              Passwords don't match.
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {saving && <Spinner size={14} track="rgba(255,255,255,.4)" head="#fff" />}
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
