import type { SVGProps } from 'react'

/**
 * Line icons at a shared 24-unit grid and 1.8 stroke, matching the wireframes.
 * Every icon is decorative — the label beside it carries the meaning (UI-1.6).
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 20, children, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function ShieldIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M12 2l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V5l7-3z" />
    </Icon>
  )
}

export function ShieldCheckIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M12 2l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V5l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  )
}

export function UsersIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </Icon>
  )
}

export function UserIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1" />
    </Icon>
  )
}

export function AlertTriangleIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M10.3 3.6 1.8 18a1.9 1.9 0 0 0 1.7 2.9h17a1.9 1.9 0 0 0 1.7-2.9L13.7 3.6a1.9 1.9 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  )
}

export function AlertCircleIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </Icon>
  )
}

export function VideoIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </Icon>
  )
}

export function ClipboardIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 4V2h6v2M8 10h8M8 14h8M8 18h5" />
    </Icon>
  )
}

export function FileIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </Icon>
  )
}

export function SearchIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  )
}

export function RefreshIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" />
    </Icon>
  )
}

export function ExpandIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  )
}

export function DownloadIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </Icon>
  )
}

export function PrinterIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </Icon>
  )
}

export function LockIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  )
}

export function LogoutIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  )
}

export function CameraOffIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M2 2l20 20" />
      <path d="M16.7 16.7A2 2 0 0 1 15 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.5-1.9M8.5 5H15a2 2 0 0 1 2 2v4.5" />
      <path d="M23 7l-6 4.3" />
    </Icon>
  )
}

export function InboxIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" />
    </Icon>
  )
}

export function CheckCircleIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
      <path d="M22 4 12 14.1l-3-3" />
    </Icon>
  )
}

/** Google's mark keeps its own brand colours (UI-2.4). */
export function GoogleIcon({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .6-2.2 1-3.7 1a6.4 6.4 0 0 1-6-4.4H2.4v2.8A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 0 1 0-4.2V7.2H2.4a11 11 0 0 0 0 9.8L6 14.2z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.2-3.2A11 11 0 0 0 2.4 7.2L6 10a6.4 6.4 0 0 1 6-4.6z"
      />
    </svg>
  )
}
