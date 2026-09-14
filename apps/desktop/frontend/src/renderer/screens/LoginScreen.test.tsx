import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LoginScreen } from './LoginScreen'
import { AuthProvider } from '@/state/AuthContext'
import { VALID_CREDENTIALS } from '@/services/mockData'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginScreen', () => {
  it('shows the brand, both sign-in routes, and the recovery link (UI-2.1 – UI-2.5)', () => {
    renderLogin()
    expect(screen.getByText('Shield X')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in with Google/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument()
  })

  it('masks the password field (FR-1.4)', () => {
    renderLogin()
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('blocks submission and explains a malformed email (FR-1.3, UI-1.10)', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'r.mendez@site')
    await user.type(screen.getByLabelText('Password'), 'shieldx')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    // Never reached the credential check.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports a failed sign-in without naming the wrong field (FR-1.5, UI-2.7)', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), VALID_CREDENTIALS.email)
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert).toHaveTextContent('Incorrect email or password. Please try again.')
    expect(alert.textContent).not.toMatch(/email is|password is|no such/i)
  })

  it('disables the button and shows progress while authenticating (UI-2.8)', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), VALID_CREDENTIALS.email)
    await user.type(screen.getByLabelText('Password'), VALID_CREDENTIALS.password)
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    const submitting = await screen.findByRole('button', { name: /Signing in/ })
    expect(submitting).toBeDisabled()
  })

  it('offers password recovery in place, without leaving the card (FR-1.7)', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), VALID_CREDENTIALS.email)
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }))

    await waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent(/reset instructions/i),
      { timeout: 3000 }
    )
    // Back on the sign-in form, still on the same screen.
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
