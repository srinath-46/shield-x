import { contextBridge } from 'electron'

/**
 * The renderer's only bridge to the host. Kept deliberately small: the UI is
 * self-contained, so the desktop shell exposes just the platform facts a
 * renderer cannot read for itself. Printing the worker report (FR-6.10) needs
 * no bridge — the renderer calls window.print() directly.
 */
const api = {
  platform: process.platform,
  appName: 'Shield X'
}

contextBridge.exposeInMainWorld('shieldx', api)

export type ShieldXApi = typeof api
