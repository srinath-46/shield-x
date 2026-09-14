import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { LiveDot, SectionLabel, Select } from '@/components/Controls'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useElementWidth } from '@/components/useElementWidth'
import { FeedStatusBanner } from '@/components/FeedStatusBanner'
import { ListSkeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { AlertStatusBadge, PpeBadge } from '@/components/StatusBadge'
import { CheckCircleIcon, VideoIcon } from '@/components/Icons'
import { useLiveData } from '@/state/LiveDataContext'
import { filterAlerts, formatAlertTime, sortNewestFirst } from '@/services/alertService'
import { ZONES, zoneFullName } from '@/services/mockData'
import type { Alert, AlertFilters, ZoneId } from '@/types'

const DEFAULT_FILTERS: AlertFilters = { status: 'all', zoneId: 'all', date: 'today' }

/** Module 3.5 — review, verify, and resolve PPE alerts. */
export function AlertsScreen(): JSX.Element {
  const navigate = useNavigate()
  const { alerts, incoming, dismissIncoming, resolveAlert, isLoading } = useLiveData()
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS)
  const [pendingResolve, setPendingResolve] = useState<Alert | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null)
  const [listRef, listWidth] = useElementWidth<HTMLDivElement>()
  const stacked = listWidth > 0 && listWidth < 860

  const visible = useMemo(() => sortNewestFirst(filterAlerts(alerts, filters)), [alerts, filters])
  const active = visible.filter((a) => a.status === 'active')
  const resolved = visible.filter((a) => a.status === 'resolved')

  async function confirmResolve(): Promise<void> {
    if (!pendingResolve) return
    setResolving(true)
    try {
      await resolveAlert(pendingResolve.id)
      setResolvedNotice(
        `Alert for ${pendingResolve.workerId} · ${pendingResolve.workerName} resolved.`
      )
      setPendingResolve(null)
    } finally {
      setResolving(false)
    }
  }

  // The confirmation strip clears itself; it reports an outcome, not a task.
  useEffect(() => {
    if (!resolvedNotice) return
    const t = setTimeout(() => setResolvedNotice(null), 4000)
    return () => clearTimeout(t)
  }, [resolvedNotice])

  return (
    <>
      <PageHeader title="Alert Management">
        {/* UI-6.8 */}
        <Select
          id="alert-status"
          width={140}
          value={filters.status}
          onChange={(status) =>
            setFilters((f) => ({ ...f, status: status as AlertFilters['status'] }))
          }
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'resolved', label: 'Resolved' }
          ]}
        />
        <Select
          id="alert-zone"
          width={130}
          value={filters.zoneId}
          onChange={(zoneId) => setFilters((f) => ({ ...f, zoneId: zoneId as ZoneId | 'all' }))}
          options={[
            { value: 'all', label: 'All zones' },
            ...ZONES.map((z) => ({ value: z.id, label: z.name }))
          ]}
        />
        <Select
          id="alert-date"
          width={130}
          value={filters.date}
          onChange={(date) => setFilters((f) => ({ ...f, date: date as AlertFilters['date'] }))}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 days' },
            { value: 'all', label: 'All dates' }
          ]}
        />
      </PageHeader>

      <FeedStatusBanner />

      {/* The outcome of the confirmation, so the action doesn't end in silence. */}
      {resolvedNotice && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 28px',
            background: 'var(--color-safe-bg)',
            borderBottom: '1px solid var(--color-safe)',
            color: 'var(--color-safe-text)',
            fontSize: 12,
            flex: 'none'
          }}
        >
          <CheckCircleIcon size={15} strokeWidth={2} />
          {resolvedNotice}
        </div>
      )}

      {/* UI-6.9 — new alerts announce themselves without a manual refresh. */}
      {incoming.length > 0 && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 28px',
            background: 'var(--color-accent-100)',
            borderBottom: '1px solid var(--color-accent-300)',
            fontSize: 12,
            color: 'var(--color-accent-800)',
            flex: 'none'
          }}
        >
          <LiveDot />
          <span>
            <b>
              {incoming.length} new alert{incoming.length === 1 ? '' : 's'}
            </b>{' '}
            just arrived — {incoming[0].workerId}, {incoming[0].item} removed in{' '}
            {zoneFullName(incoming[0].zoneId)}.
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={dismissIncoming}
          >
            Dismiss
          </button>
        </div>
      )}

      <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<CheckCircleIcon size={36} />}
            title="No alerts match these filters"
            message="Nothing to review for the selected status, zone, and date. Widen the filters to see historical alerts."
          />
        ) : (
          <>
            {/* UI-6.2 / UI-6.3 — active alerts first, newest at the top. */}
            {active.length > 0 && (
              <>
                <SectionLabel tone="accent">Active · {active.length}</SectionLabel>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: resolved.length > 0 ? 26 : 0
                  }}
                >
                  {active.map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      stacked={stacked}
                      isNew={incoming.some((i) => i.id === alert.id)}
                      onOpenCamera={() => navigate(`/camera?zone=${alert.zoneId}`)}
                      onResolve={() => setPendingResolve(alert)}
                    />
                  ))}
                </div>
              </>
            )}

            {resolved.length > 0 && (
              <>
                <SectionLabel>Resolved · history</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resolved.map((alert) => (
                    <AlertRow key={alert.id} alert={alert} stacked={stacked} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* UI-6.6 — resolving is confirmed before the status changes. */}
      <ConfirmDialog
        open={pendingResolve !== null}
        title="Resolve this alert?"
        confirmLabel="Resolve alert"
        busy={resolving}
        onCancel={() => setPendingResolve(null)}
        onConfirm={confirmResolve}
      >
        {pendingResolve && (
          <>
            Confirm that the {pendingResolve.item} violation for{' '}
            <b>
              {pendingResolve.workerId} · {pendingResolve.workerName}
            </b>{' '}
            ({zoneFullName(pendingResolve.zoneId)}) has been addressed. The alert moves to resolved
            history and the dashboard violation count updates.
          </>
        )}
      </ConfirmDialog>
    </>
  )
}

/** UI-6.1 — one row carries every field the specification lists. */
function AlertRow({
  alert,
  isNew = false,
  stacked = false,
  onOpenCamera,
  onResolve
}: {
  alert: Alert
  isNew?: boolean
  /** Below ~860px the row becomes two lines rather than clipping its actions. */
  stacked?: boolean
  onOpenCamera?: () => void
  onResolve?: () => void
}): JSX.Element {
  const active = alert.status === 'active'

  return (
    <div
      className={isNew ? 'sx-flash' : undefined}
      // Identifies the row for the end-to-end run, which has to name the exact
      // alert it resolved: the sensor feed raises new ones while it works, so
      // counting rows would race with it.
      data-alert-id={alert.id}
      data-alert-status={alert.status}
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        gap: stacked ? 10 : 16,
        padding: active ? '14px 16px' : '13px 16px',
        background: active ? 'var(--color-accent-100)' : 'var(--color-surface)',
        border: `1px solid ${active ? 'var(--color-accent-300)' : 'var(--color-divider)'}`,
        borderLeft: active ? '4px solid var(--color-accent)' : undefined,
        opacity: active ? 1 : 0.85
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {alert.workerId} · {alert.workerName}
        </div>
        <div
          style={{
            fontSize: 12,
            color: active ? 'var(--color-neutral-700)' : 'var(--color-neutral-600)'
          }}
        >
          {zoneFullName(alert.zoneId)} · {formatAlertTime(alert.raisedAt)}
          {alert.resolvedBy && ` · resolved by ${alert.resolvedBy}`}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: stacked ? 8 : 16,
          flexWrap: stacked ? 'wrap' : 'nowrap'
        }}
      >
        <PpeBadge status={alert.helmet} item="Helmet" solid />
        <PpeBadge status={alert.vest} item="Vest" solid />
        <AlertStatusBadge status={alert.status} />

        {active && (
          <>
            {/* FR-5.9 / UI-6.5 */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={stacked ? { marginLeft: 'auto' } : undefined}
              onClick={onOpenCamera}
            >
              <VideoIcon size={14} strokeWidth={2} />
              Open Camera
            </button>
            {/* FR-5.10 */}
            <button type="button" className="btn btn-primary btn-sm" onClick={onResolve}>
              Resolve
            </button>
          </>
        )}
      </div>
    </div>
  )
}
