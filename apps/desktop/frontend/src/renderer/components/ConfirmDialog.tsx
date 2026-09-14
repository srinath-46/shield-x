import type { ReactNode } from 'react'
import { useFocusTrap } from './useFocusTrap'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * UI-1.13 — every destructive or state-changing action passes through here:
 * resolving an alert (UI-6.6) and logging out (UI-8.6). Escape cancels, focus
 * is trapped inside the panel and restored to the trigger on close.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps): JSX.Element | null {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onCancel)

  if (!open) return null

  return (
    // Dismissing by clicking the backdrop is a mouse shortcut; Escape is the
    // keyboard equivalent, so the backdrop itself is presentational.
    <div
      className="dialog-backdrop no-print"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        ref={panelRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="dialog-title" id="confirm-dialog-title">
          {title}
        </div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
