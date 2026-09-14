import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlertStatusBadge, CameraStatusChip, PpeBadge, PresenceBadge } from './StatusBadge'

/**
 * UI-1.6 — colour is never the sole means of conveying status. Every one of
 * these has to carry readable text, whatever its palette.
 */
describe('status badges always carry a text label', () => {
  it('states helmet and vest status in words', () => {
    render(
      <>
        <PpeBadge status="worn" />
        <PpeBadge status="not-worn" />
      </>
    )
    expect(screen.getByText('Worn')).toBeInTheDocument()
    expect(screen.getByText('Not Worn')).toBeInTheDocument()
  })

  it('names the item when both appear in one row', () => {
    render(
      <>
        <PpeBadge status="not-worn" item="Helmet" solid />
        <PpeBadge status="worn" item="Vest" />
      </>
    )
    expect(screen.getByText('Helmet Not Worn')).toBeInTheDocument()
    expect(screen.getByText('Vest Worn')).toBeInTheDocument()
  })

  it('renders a dash when there is no live reading, rather than implying compliance', () => {
    const { container } = render(<PpeBadge status="unknown" />)
    expect(container.textContent).toBe('—')
    expect(screen.queryByText('Worn')).not.toBeInTheDocument()
  })

  it('states presence in words', () => {
    render(
      <>
        <PresenceBadge status="present" />
        <PresenceBadge status="checked-out" />
        <PresenceBadge status="absent" />
      </>
    )
    expect(screen.getByText('Present')).toBeInTheDocument()
    expect(screen.getByText('Checked out')).toBeInTheDocument()
    expect(screen.getByText('Absent')).toBeInTheDocument()
  })

  it('states camera reachability in words (UI-4.3)', () => {
    render(
      <>
        <CameraStatusChip status="online" />
        <CameraStatusChip status="offline" />
        <CameraStatusChip status="reconnecting" />
      </>
    )
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
    expect(screen.getByText('OFFLINE')).toBeInTheDocument()
    expect(screen.getByText('RECONNECTING')).toBeInTheDocument()
  })

  it('states alert status in words (UI-6.7)', () => {
    render(
      <>
        <AlertStatusBadge status="active" />
        <AlertStatusBadge status="resolved" />
      </>
    )
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('RESOLVED')).toBeInTheDocument()
  })
})
