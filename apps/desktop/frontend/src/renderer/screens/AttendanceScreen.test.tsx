import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AttendanceScreen } from './AttendanceScreen'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { toIsoDate } from '@/services/attendanceService'

function daysBack(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toIsoDate(d)
}

/** The table renders after the simulated query resolves. */
async function table(): Promise<HTMLElement> {
  return screen.findByRole('table', {}, { timeout: 3000 })
}

describe('AttendanceScreen', () => {
  it('lists today with live PPE status and no Date column (FR-4.4 – FR-4.6)', async () => {
    renderWithProviders(<AttendanceScreen />)

    const headers = within(await table())
      .getAllByRole('columnheader')
      .map((h) => h.textContent)

    expect(headers).toEqual([
      'Worker ID',
      'Name',
      'Zone',
      'Shift',
      'Check-in',
      'Check-out',
      'Presence',
      'Helmet',
      'Vest'
    ])
    expect(screen.getByText('W-1042')).toBeInTheDocument()
    expect(screen.getAllByText('Not Worn').length).toBeGreaterThan(0)
  })

  it('counts the roster in the footer', async () => {
    renderWithProviders(<AttendanceScreen />)
    await table()
    expect(screen.getByText(/Showing 8 of 142 workers/)).toBeInTheDocument()
  })

  it('adds a Date column and switches to records over a range (FR-4.7)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AttendanceScreen />)
    await table()

    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), daysBack(6))

    await waitFor(
      () =>
        expect(within(screen.getByRole('table')).getAllByRole('columnheader')[0]).toHaveTextContent(
          'Date'
        ),
      { timeout: 3000 }
    )
    expect(screen.getByText(/attendance records/)).toBeInTheDocument()
  })

  it('filters by zone', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AttendanceScreen />)
    await table()

    await user.selectOptions(screen.getByLabelText('Zone'), 'A')

    await waitFor(() => {
      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) expect(within(row).getByText('Zone A')).toBeInTheDocument()
    })
  })

  it('explains an empty result and restores the default view (UI-5.7)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AttendanceScreen />)
    await table()

    await user.type(screen.getByLabelText('Search worker'), 'W-9999')

    const empty = await screen.findByText('No matching records', {}, { timeout: 3000 })
    expect(empty).toBeInTheDocument()
    expect(screen.getByText(/W-9999/)).toBeInTheDocument()
    expect(screen.getByText(/today/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await table()).toBeInTheDocument()
    expect(screen.getByLabelText('Search worker')).toHaveValue('')
  })

  it('pages through the roster', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AttendanceScreen />)
    await table()

    expect(screen.getByRole('button', { name: /Prev/ })).toBeDisabled()
    const firstId = within(screen.getByRole('table')).getAllByRole('row')[1].textContent

    await user.click(screen.getByRole('button', { name: /Next/ }))

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')[1].textContent).not.toBe(firstId)
    })
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument()
  })
})
