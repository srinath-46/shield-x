import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { Worker } from '@/types'
import { zoneById } from '@/services/mockData'
import { SearchIcon } from './Icons'
import { visuallyHidden } from './visuallyHidden'

interface WorkerSearchProps {
  label: string
  placeholder: string
  value: string
  suggestions: Worker[]
  inputId?: string
  onChange: (value: string) => void
  onSelect: (worker: Worker) => void
  onClear: () => void
}

/**
 * FR-6.1 — locate a worker by ID or name. A combobox rather than a bare input:
 * ↑/↓ walk the matches, Enter picks the highlighted one, Escape closes the list,
 * and a click outside dismisses it (UI-1.11, UI-1.12).
 */
export function WorkerSearch({
  label,
  placeholder,
  value,
  suggestions,
  inputId,
  onChange,
  onSelect,
  onClear
}: WorkerSearchProps): JSX.Element {
  const generatedId = useId()
  const id = inputId ?? generatedId
  const listId = `${id}-listbox`

  const [open, setOpen] = useState(false)
  const [highlightedRaw, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const visible = open && suggestions.length > 0
  // Clamped on render rather than reset in an effect, so a shrinking list can
  // never leave the highlight pointing past the end of it.
  const highlighted = Math.min(highlightedRaw, Math.max(0, suggestions.length - 1))

  useEffect(() => {
    if (!visible) return
    const onPointerDown = (e: PointerEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [visible])

  function choose(worker: Worker): void {
    onSelect(worker)
    setOpen(false)
    setHighlighted(0)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!visible) {
      if (e.key === 'ArrowDown') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(suggestions[highlighted])
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', maxWidth: 460 }}>
      <label htmlFor={id} style={visuallyHidden}>
        {label}
      </label>
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
        type="text"
        className="input"
        style={{ paddingLeft: 30, paddingRight: 62 }}
        placeholder={placeholder}
        value={value}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible ? `${id}-option-${highlighted}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', right: 4, top: 3 }}
          onClick={() => {
            onClear()
            setOpen(false)
          }}
        >
          Clear
        </button>
      )}

      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            zIndex: 5,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {suggestions.map((w, i) => (
            <li
              key={w.id}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseEnter={() => setHighlighted(i)}
              // The input keeps focus, so selection happens on mousedown.
              onMouseDown={(e) => {
                e.preventDefault()
                choose(w)
              }}
              style={{
                display: 'flex',
                gap: 10,
                padding: '8px 12px',
                fontSize: 13,
                cursor: 'pointer',
                background:
                  i === highlighted
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'transparent'
              }}
            >
              <b>{w.id}</b>
              <span>{w.name}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--color-neutral-600)' }}>
                {zoneById(w.zoneId).name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
