import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AlertsScreen } from './AlertsScreen'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { resetStore } from '@/services/store'

/**
 * Resolving an alert mutates the shared store, so each case re-seeds it. The
 * screen itself is imported statically — a dynamic re-import would give it a
 * different LiveDataContext instance than the provider mounts.
 */
describe('AlertsScreen', () => {
  beforeEach(() => {
    resetStore()
  })

  async function renderAlerts() {
    renderWithProviders(<AlertsScreen />)
    return screen.findByText(/Active ·/, {}, { timeout: 3000 })
  }

  it('groups active alerts above resolved history, newest first (UI-6.1 – UI-6.3)', async () => {
    await renderAlerts()

    expect(screen.getByText(/Resolved · history/)).toBeInTheDocument()
    expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0)
    expect(screen.getAllByText('RESOLVED').length).toBeGreaterThan(0)

    // The seeded active alerts run 14:32, 14:20, 13:58 — newest at the top.
    const times = screen
      .getAllByText(/\d{2} \w{3} \d{2}:\d{2}/)
      .slice(0, 3)
      .map((el) => el.textContent!.slice(-5))
    expect([...times].sort().reverse()).toEqual(times)
  })

  it('shows each alert with its worker, zone and PPE state (FR-5.3 – FR-5.6)', async () => {
    await renderAlerts()
    expect(screen.getByText('W-1042 · J. Alvarez')).toBeInTheDocument()
    expect(screen.getByText(/Zone C · Rebar Yard/)).toBeInTheDocument()
    expect(screen.getAllByText('Helmet Not Worn').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Vest Worn').length).toBeGreaterThan(0)
  })

  it('asks for confirmation before resolving (UI-6.6)', async () => {
    const user = userEvent.setup()
    await renderAlerts()

    await user.click(screen.getAllByRole('button', { name: 'Resolve' })[0])

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Resolve this alert?')).toBeInTheDocument()
    // Still active — nothing changed by opening the prompt.
    expect(screen.getByText(/Active · 3/)).toBeInTheDocument()
  })

  it('leaves the alert untouched when the prompt is cancelled', async () => {
    const user = userEvent.setup()
    await renderAlerts()

    await user.click(screen.getAllByRole('button', { name: 'Resolve' })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/Active · 3/)).toBeInTheDocument()
  })

  it('moves the alert to history and confirms the outcome (FR-5.10, FR-5.12)', async () => {
    const user = userEvent.setup()
    await renderAlerts()

    await user.click(screen.getAllByRole('button', { name: 'Resolve' })[0])
    await user.click(screen.getByRole('button', { name: 'Resolve alert' }))

    await waitFor(() => expect(screen.getByText(/Active · 2/)).toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent(/resolved/i)
    // Retained as history rather than deleted.
    expect(screen.getByText('W-1042 · J. Alvarez')).toBeInTheDocument()
  })

  it('filters by status (UI-6.8)', async () => {
    const user = userEvent.setup()
    await renderAlerts()

    await user.selectOptions(screen.getByLabelText('alert-status'), 'resolved')

    await waitFor(() => expect(screen.queryByText(/Active ·/)).not.toBeInTheDocument())
    expect(screen.getByText(/Resolved · history/)).toBeInTheDocument()
  })

  it('offers a camera link for each active alert (FR-5.9)', async () => {
    await renderAlerts()
    expect(screen.getAllByRole('button', { name: /Open Camera/ }).length).toBe(3)
  })
})
