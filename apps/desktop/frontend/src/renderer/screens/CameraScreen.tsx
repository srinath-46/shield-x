import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFocusTrap } from '@/components/useFocusTrap'
import { EmptyState } from '@/components/EmptyState'
import { CameraSkeleton } from '@/components/Skeleton'
import { PageHeader } from '@/components/PageHeader'
import { CameraStatusChip } from '@/components/StatusBadge'
import { Spinner } from '@/components/Spinner'
import { CameraOffIcon, CloseIcon, ExpandIcon, RefreshIcon, UserIcon } from '@/components/Icons'
import { useLiveData } from '@/state/LiveDataContext'
import { refreshCamera } from '@/services/cameraService'
import { ZONES, zoneById } from '@/services/mockData'
import type { Camera, ZoneId } from '@/types'

type ZoneFilter = ZoneId | 'all'

/**
 * Module 3.3 — live streams for human visual confirmation of PPE status.
 * The application performs no AI worker or PPE detection at any point (FR-3.6).
 */
export function CameraScreen(): JSX.Element {
  const { cameras, isLoading } = useLiveData()
  const [params, setParams] = useSearchParams()
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)

  // FR-3.7 — "Open Camera" on an alert lands here with that zone selected.
  const zoneParam = params.get('zone')
  const zone: ZoneFilter =
    zoneParam && ZONES.some((z) => z.id === zoneParam) ? (zoneParam as ZoneId) : 'all'

  const visible = zone === 'all' ? cameras : cameras.filter((c) => c.zoneId === zone)

  function selectZone(next: ZoneFilter): void {
    setParams(next === 'all' ? {} : { zone: next }, { replace: true })
  }

  return (
    <>
      <PageHeader title="Live Camera Feed">
        {/* UI-4.2 — zone selector. */}
        <div className="seg" role="group" aria-label="Select zone">
          <button
            type="button"
            className="seg-opt"
            aria-pressed={zone === 'all'}
            onClick={() => selectZone('all')}
          >
            All zones
          </button>
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              className="seg-opt"
              aria-pressed={zone === z.id}
              onClick={() => selectZone(z.id)}
            >
              {z.name}
            </button>
          ))}
        </div>
      </PageHeader>

      {isLoading ? (
        <CameraSkeleton />
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '22px 28px' }}>
          {visible.length === 0 ? (
            <EmptyState
              icon={<CameraOffIcon size={36} />}
              title="No cameras in this zone"
              message="No camera is installed for the selected zone. Choose another zone, or All zones to see the whole site."
              action={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => selectZone('all')}
                >
                  Show all zones
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
                gap: 18
              }}
            >
              {visible.map((camera) => (
                <CameraTile
                  key={camera.id}
                  camera={camera}
                  onFullscreen={() => setFullscreenId(camera.id)}
                />
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 16 }}>
            Feeds are for human visual confirmation of PPE only — the system performs no AI worker
            or PPE detection. Full-screen opens with the ⤢ control; press Esc to exit.
          </p>
        </div>
      )}

      {fullscreenId && (
        <FullscreenView
          camera={cameras.find((c) => c.id === fullscreenId)!}
          onClose={() => setFullscreenId(null)}
        />
      )}
    </>
  )
}

function CameraTile({
  camera,
  onFullscreen
}: {
  camera: Camera
  onFullscreen: () => void
}): JSX.Element {
  const zone = zoneById(camera.zoneId)
  const busy = camera.status === 'reconnecting'

  return (
    <div className="panel">
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: camera.status === 'offline' ? 'var(--color-neutral-300)' : '#232120',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          overflow: 'hidden'
        }}
      >
        <CameraBody camera={camera} />

        <div style={{ position: 'absolute', top: 10, left: 12 }}>
          <CameraStatusChip status={camera.status} />
        </div>

        {camera.status !== 'offline' && (
          <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 6 }}>
            {/* FR-3.4 / UI-4.6 */}
            <TileButton
              label={`Refresh ${zone.name} stream`}
              onClick={() => refreshCamera(camera.id)}
              disabled={busy}
            >
              <RefreshIcon size={15} strokeWidth={2} />
            </TileButton>
            {/* FR-3.3 / UI-4.5 */}
            <TileButton label={`Expand ${zone.name} to full screen`} onClick={onFullscreen}>
              <ExpandIcon size={15} strokeWidth={2} />
            </TileButton>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          fontSize: 13
        }}
      >
        <span style={{ fontWeight: 700 }}>
          {zone.name} · {zone.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{camera.id}</span>
      </div>
    </div>
  )
}

/** The stream area itself — placeholder art stands in for the video element. */
function CameraBody({ camera }: { camera: Camera }): JSX.Element {
  if (camera.status === 'reconnecting') {
    return (
      <>
        <Spinner size={30} track="rgba(255,255,255,.25)" head="#fff" />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>Reconnecting stream…</div>
      </>
    )
  }

  // UI-4.4 — an offline tile explains itself and offers a way back.
  if (camera.status === 'offline') {
    return (
      <>
        <CameraOffIcon size={34} strokeWidth={1.4} style={{ color: 'var(--color-neutral-600)' }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-neutral-700)' }}>
          Camera offline
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>Stream unavailable</div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 2 }}
          onClick={() => refreshCamera(camera.id)}
        >
          Reconnect
        </button>
      </>
    )
  }

  return <UserIcon size={60} strokeWidth={1} style={{ color: 'rgba(255,255,255,.28)' }} />
}

function TileButton({
  label,
  onClick,
  disabled,
  children
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: JSX.Element
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,.5)',
        color: '#fff',
        border: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </button>
  )
}

/** FR-3.3 — dismissible with the close control and with Escape (UI-4.5). */
function FullscreenView({ camera, onClose }: { camera: Camera; onClose: () => void }): JSX.Element {
  const zone = zoneById(camera.zoneId)
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose)

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${zone.name} full screen`}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#151413',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          color: '#fff'
        }}
      >
        <CameraStatusChip status={camera.status} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {zone.name} · {zone.label}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{camera.id}</span>
        <button
          type="button"
          className="btn"
          data-autofocus
          onClick={onClose}
          style={{ marginLeft: 'auto', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }}
        >
          <CloseIcon size={16} strokeWidth={2} />
          Close (Esc)
        </button>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <CameraBody camera={camera} />
      </div>
    </div>
  )
}
