export interface ShieldXApi {
  platform: string
  appName: string
}

declare global {
  interface Window {
    shieldx?: ShieldXApi
  }
}

export {}
