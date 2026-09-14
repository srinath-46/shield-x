import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { MetricCard } from '@/components/MetricCard'
import { LiveDot } from '@/components/Controls'
import { useElementWidth } from '@/components/useElementWidth'
import { FeedStatusBanner } from '@/components/FeedStatusBanner'
import { DashboardSkeleton } from '@/components/Skeleton'
import {
  AlertTriangleIcon,
  ClipboardIcon,
  FileIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
  VideoIcon
} from '@/components/Icons'
import { useAuth } from '@/state/AuthContext'
import { useLiveData } from '@/state/LiveDataContext'
import { zoneFullName } from '@/services/mockData'

/** Module 3.2 — the at-a-glance safety picture for the site. */
export function DashboardScreen(): JSX.Element {
  const navigate = useNavigate()
  const { supervisor } = useAuth()
  const { metrics, activeAlertCount, cameras, isLoading } = useLiveData()
  const secondsAgo = useSecondsSince(metrics.updatedAt)
  const [contentRef, contentWidth] = useElementWidth<HTMLDivElement>()

  const liveZone = cameras.find((c) => c.status === 'online')

  return (
    <>
      <PageHeader title="Dashboard">
        {/* UI-3.8 — a standing cue that figures are arriving continuously. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--color-neutral-600)'
          }}
        >
          <LiveDot color="var(--color-safe)" />
          Live · updated {secondsAgo}s ago
        </div>
        {/* UI-3.7 — profile access from the header region. */}
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')}>
          <UserIcon size={16} strokeWidth={1.9} />
          {supervisor?.shortName}
        </button>
      </PageHeader>

      <FeedStatusBanner />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div ref={contentRef} style={{ flex: 1, overflow: 'auto', padding: '26px 28px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 18,
              marginBottom: 22
            }}
          >
            {/* FR-2.2 */}
            <MetricCard
              label="Total Workers Onsite"
              value={metrics.totalOnsite}
              caption={`across ${metrics.zoneCount} zones`}
              icon={<UsersIcon size={22} style={{ color: 'var(--color-neutral-500)' }} />}
            />
            {/* FR-2.3 — emphasised while anything is unresolved (UI-3.4). */}
            <MetricCard
              label="Active PPE Violations"
              value={metrics.activeViolations}
              emphasised={metrics.activeViolations > 0}
              caption={
                metrics.activeViolations > 0 ? (
                  <>
                    <LiveDot size={7} />
                    unresolved — needs attention
                  </>
                ) : (
                  'all clear — no open violations'
                )
              }
              icon={
                <AlertTriangleIcon
                  size={22}
                  strokeWidth={2}
                  style={{
                    color:
                      metrics.activeViolations > 0
                        ? 'var(--color-accent)'
                        : 'var(--color-neutral-500)'
                  }}
                />
              }
            />
            {/* FR-2.4 */}
            <MetricCard
              label="Safe Workers"
              value={metrics.safeWorkers}
              caption={`${Math.round((metrics.safeWorkers / Math.max(1, metrics.totalOnsite)) * 100)}% PPE compliant`}
              icon={<ShieldCheckIcon size={22} style={{ color: 'var(--color-safe)' }} />}
            />
          </div>

          {/* The camera preview keeps its emphasis until the pair no longer fits. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: contentWidth > 0 && contentWidth < 780 ? '1fr' : '1.4fr 1fr',
              gap: 18
            }}
          >
            {/* FR-2.5 / UI-3.5 — preview with direct access to the camera module. */}
            <div className="panel">
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 8',
                  background: '#232120',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <VideoIcon size={44} strokeWidth={1.4} style={{ color: 'rgba(255,255,255,.5)' }} />
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: '#fff',
                    background: 'rgba(0,0,0,.45)',
                    padding: '3px 8px'
                  }}
                >
                  <LiveDot size={7} />
                  {liveZone
                    ? `LIVE · ${zoneFullName(liveZone.zoneId).split(' · ')[0]}`
                    : 'NO LIVE FEED'}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    fontSize: 11,
                    color: 'rgba(255,255,255,.75)',
                    background: 'rgba(0,0,0,.45)',
                    padding: '3px 8px'
                  }}
                >
                  {metrics.camerasOnline} of {metrics.camerasTotal} cameras online
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Live Camera Feed</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                    Human visual PPE confirmation
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/camera')}
                >
                  Open feed →
                </button>
              </div>
            </div>

            {/* FR-2.7 – FR-2.9 / UI-3.6 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-label">Quick access</div>
              <QuickTile
                to="/attendance"
                icon={<ClipboardIcon size={20} />}
                title="Attendance"
                subtitle="Check-in / PPE status"
              />
              <QuickTile
                to="/alerts"
                icon={<AlertTriangleIcon size={20} />}
                title="Alert Management"
                subtitle={
                  activeAlertCount > 0
                    ? `${activeAlertCount} active violation${activeAlertCount === 1 ? '' : 's'}`
                    : 'no active violations'
                }
                badge={activeAlertCount > 0 ? String(activeAlertCount) : undefined}
              />
              <QuickTile
                to="/report"
                icon={<FileIcon size={20} />}
                title="Worker Report"
                subtitle="Query & export"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function QuickTile({
  to,
  icon,
  title,
  subtitle,
  badge
}: {
  to: string
  icon: JSX.Element
  title: string
  subtitle: string
  badge?: string
}): JSX.Element {
  return (
    <Link
      to={to}
      className="panel"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: 15
      }}
    >
      <span style={{ color: 'var(--color-accent)', display: 'flex' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{subtitle}</div>
      </div>
      {badge ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            background: 'var(--color-accent)',
            color: '#fff'
          }}
        >
          {badge}
        </span>
      ) : (
        <span style={{ color: 'var(--color-neutral-500)' }}>→</span>
      )}
    </Link>
  )
}

/** Ticks the "updated Ns ago" label without touching the data itself. */
function useSecondsSince(timestamp: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return Math.max(0, Math.round((now - timestamp) / 1000))
}
