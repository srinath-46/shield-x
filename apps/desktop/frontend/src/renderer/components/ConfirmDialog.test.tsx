import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * The modal keyboard contract from `useFocusTrap`, shared by the confirm
 * dialog, the change-password form, and camera full screen (UI-1.12, UI-1.13).
 */
function Harness({ onConfirm = vi.fn() }: { onConfirm?: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Resolve
      </button>
      <ConfirmDialog
        open={open}
        title="Resolve this alert?"
        confirmLabel="Resolve alert"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
      >
        Confirm that the helmet violation has been addressed.
      </ConfirmDialog>
    </>
  )
}

describe('ConfirmDialog', () => {
  it('renders nothing until it is opened', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus to the confirming action on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Resolve alert' })).toHaveFocus()
  })

  it('closes on Escape without confirming', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('returns focus to the trigger when it closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Resolve' })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('keeps Tab inside the panel', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))

    const cancel = screen.getByRole('button', { name: 'Cancel' })
    const confirm = screen.getByRole('button', { name: 'Resolve alert' })

    await user.tab()
    expect(cancel).toHaveFocus()
    await user.tab()
    expect(confirm).toHaveFocus()
    await user.tab({ shift: true })
    expect(cancel).toHaveFocus()
  })

  it('runs the action only when the confirming button is pressed', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    await user.click(screen.getByRole('button', { name: 'Resolve alert' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
