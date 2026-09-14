import { NavLink } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { useLiveData } from '@/state/LiveDataContext'
import {
  AlertTriangleIcon,
  ClipboardIcon,
  FileIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  VideoIcon
} from './Icons'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: UsersIcon },
  { to: '/camera', label: 'Live Camera', Icon: VideoIcon },
  { to: '/attendance', label: 'Attendance', Icon: ClipboardIcon },
  { to: '/alerts', label: 'Alerts', Icon: AlertTriangleIcon },
  { to: '/report', label: 'Worker Report', Icon: FileIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon }
] as const

/**
 * UI-1.7 — the persistent navigation. Present on every module, active item
 * marked by an accent left bar, accent text, and `aria-current="page"`.
 */
export function Sidebar(): JSX.Element {
  const { supervisor } = useAuth()
  const { activeAlertCount } = useLiveData()

  return (
    <div
      className="no-print"
      style={{
        width: 220,
        flex: 'none',
        height: '100%',
        background: 'var(--color-surface)',
        borderRight: '2px solid var(--color-divider)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '18px 16px',
          borderBottom: '2px solid var(--color-divider)'
        }}
      >
        <span style={{ color: 'var(--color-accent)', display: 'flex' }}>
          <ShieldIcon size={22} strokeWidth={2} />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: '-0.01em'
          }}
        >
          Shield X
        </span>
      </div>

      <nav
        aria-label="Main"
        style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', flex: 1 }}
      >
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 16px',
              fontSize: 14,
              lineHeight: 1.2,
              textDecoration: 'none',
              borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
              fontWeight: isActive ? 700 : 500,
              background: isActive
                ? 'color-mix(in srgb, var(--color-accent) 9%, transparent)'
                : 'transparent'
            })}
          >
            <Icon size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/alerts' && activeAlertCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 7px',
                  background: 'var(--color-accent)',
                  color: '#fff'
                }}
                aria-label={`${activeAlertCount} active alerts`}
              >
                {activeAlertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderTop: '2px solid var(--color-divider)'
        }}
      >
        <Avatar initials={supervisor?.initials ?? '—'} size={34} fontSize={12} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
            {supervisor?.shortName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', lineHeight: 1.2 }}>
            {supervisor?.role}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Initials stand in until a real profile photo is available (FR-2.1, FR-7.1). */
export function Avatar({
  initials,
  size = 40,
  fontSize = 14
}: {
  initials: string
  size?: number
  fontSize?: number
}): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: 'var(--color-neutral-300)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-neutral-700)',
        fontWeight: 700,
        fontSize
      }}
    >
      {initials}
    </div>
  )
}
