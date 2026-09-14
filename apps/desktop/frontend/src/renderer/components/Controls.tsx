import type { ChangeEvent, ReactNode } from 'react'
import { SearchIcon } from './Icons'

/** Search box with the leading magnifier used by Attendance and Worker Report. */
export function SearchInput({
  id,
  label,
  value,
  placeholder,
  onChange
}: {
  id: string
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <div className="field" style={{ flex: 1, minWidth: 220 }}>
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 9,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-neutral-500)',
            display: 'flex',
            pointerEvents: 'none'
          }}
        >
          <SearchIcon size={15} />
        </span>
        <input
          id={id}
          type="search"
          className="input"
          style={{ paddingLeft: 30 }}
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export interface SelectOption<T extends string> {
  value: T
  label: string
}

/** Labelled dropdown (UI-5.3, UI-6.8). */
export function Select<T extends string>({
  id,
  label,
  value,
  options,
  width,
  onChange
}: {
  id: string
  label?: string
  value: T
  options: SelectOption<T>[]
  width?: number
  onChange: (value: T) => void
}): JSX.Element {
  return (
    <div className="field" style={{ width }}>
      {label && <label htmlFor={id}>{label}</label>}
      <select
        id={id}
        className="input"
        aria-label={label ? undefined : id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** The pulsing dot that marks a live connection or a freshly changed value. */
export function LiveDot({
  color = 'var(--color-accent)',
  size = 8
}: {
  color?: string
  size?: number
}): JSX.Element {
  return (
    <span
      className="sx-live"
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: '50%', background: color, flex: 'none' }}
    />
  )
}

/** Small uppercase section heading used between content blocks. */
export function SectionLabel({
  children,
  tone = 'neutral'
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent'
}): JSX.Element {
  return (
    <div
      className="section-label"
      style={{
        color: tone === 'accent' ? 'var(--color-accent)' : 'var(--color-neutral-600)',
        marginBottom: 10
      }}
    >
      {children}
    </div>
  )
}
