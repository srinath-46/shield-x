import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/**
 * Modal keyboard contract, in one place: focus moves into the panel on open,
 * Tab cycles inside it, Escape closes it, and focus returns to whatever opened
 * it (UI-1.12). Used by every overlay — the confirm dialog, the change-password
 * form, and camera full screen.
 */
export function useFocusTrap<T extends HTMLElement>(
  open: boolean,
  onClose: () => void
): RefObject<T> {
  const panelRef = useRef<T>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    restoreTo.current = document.activeElement as HTMLElement | null

    const focusable = (): HTMLElement[] =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

    // Prefer an element the panel marked as the entry point, else the first one.
    const initial =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? panel ?? null
    initial?.focus()

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreTo.current?.focus()
    }
  }, [open, onClose])

  return panelRef
}
