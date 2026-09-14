import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircleIcon } from './Icons'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * UI-1.10 — a render fault leaves a plain-language explanation and a way out,
 * not a blank window. A supervisor on a site cannot open a console.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[shieldx] render error', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 32 }}>
        <div
          className="panel"
          style={{ maxWidth: 460, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <span style={{ color: 'var(--color-accent)', display: 'flex' }}>
            <AlertCircleIcon size={28} strokeWidth={2} />
          </span>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20 }}>
            Something went wrong on this screen
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-neutral-700)', margin: 0 }}>
            Shield X couldn't display this view. Your session is still active — reloading usually
            clears it. If it keeps happening, report this message to the system administrator.
          </p>
          <code
            style={{
              fontSize: 11,
              background: 'var(--color-neutral-100)',
              padding: '8px 10px',
              color: 'var(--color-neutral-700)',
              wordBreak: 'break-word'
            }}
          >
            {error.message}
          </code>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Shield X
            </button>
          </div>
        </div>
      </div>
    )
  }
}
