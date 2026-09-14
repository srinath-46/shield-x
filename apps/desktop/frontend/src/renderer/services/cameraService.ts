import { getCameras, setCameraStatus } from './store'

/**
 * FR-3.4 — a manual refresh tears the stream down and re-establishes it. The
 * tile shows its reconnecting state for the duration (UI-4.6).
 *
 * A camera that was offline stays offline unless the reconnect succeeds; the
 * mock lets it recover so the state can be exercised.
 */
export async function refreshCamera(cameraId: string): Promise<void> {
  const camera = getCameras().find((c) => c.id === cameraId)
  if (!camera) return

  setCameraStatus(cameraId, 'reconnecting')
  await new Promise((resolve) => setTimeout(resolve, 1800))
  setCameraStatus(cameraId, 'online')
}
