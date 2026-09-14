import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkerSearch } from './WorkerSearch'
import { WORKERS } from '@/services/mockData'
import { matchesQuery } from '@/services/workerService'
import type { Worker } from '@/types'

function Harness({ onSelect = vi.fn() }: { onSelect?: (w: Worker) => void }): JSX.Element {
  const [value, setValue] = useState('')
  const suggestions = value.trim() ? WORKERS.filter((w) => matchesQuery(w, value)).slice(0, 6) : []

  return (
    <div>
      <button type="button">outside</button>
      <WorkerSearch
        inputId="worker-search"
        label="Search for a worker"
        placeholder="Search by Worker ID or name"
        value={value}
        suggestions={suggestions}
        onChange={setValue}
        onSelect={(w) => {
          onSelect(w)
          setValue(`${w.id} · ${w.name}`)
        }}
        onClear={() => setValue('')}
      />
    </div>
  )
}

describe('WorkerSearch (FR-6.1)', () => {
  it('is a labelled combobox that starts collapsed', () => {
    render(<Harness />)
    const input = screen.getByRole('combobox', { name: 'Search for a worker' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers matches as the supervisor types', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'alvarez')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: /W-1042/ })).toBeInTheDocument()
  })

  it('selects with the arrow keys and Enter (UI-1.12)', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)

    await user.type(screen.getByRole('combobox'), 'W-1042')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect.mock.calls[0][0].id).toBe('W-1042')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('tracks the highlighted option for assistive technology', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'a')
    const first = screen.getAllByRole('option')[0]
    expect(input).toHaveAttribute('aria-activedescendant', first.id)
    expect(first).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}')
    const second = screen.getAllByRole('option')[1]
    expect(input).toHaveAttribute('aria-activedescendant', second.id)
  })

  it('wraps around the ends of the list', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'a')

    const options = screen.getAllByRole('option')
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      options[options.length - 1].id
    )
  })

  it('closes on Escape, leaving the typed text alone', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'alvarez')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('alvarez')
  })

  it('closes when the supervisor clicks elsewhere', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'alvarez')
    await user.click(screen.getByRole('button', { name: 'outside' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clears the field with the Clear control', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'alvarez')
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('selects by mouse as well', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)

    await user.type(screen.getByRole('combobox'), 'W-1042')
    await user.click(screen.getByRole('option', { name: /W-1042/ }))

    expect(onSelect).toHaveBeenCalledOnce()
  })
})
