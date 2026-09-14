/** Domain model for the Site Supervisor module. */

export type ZoneId = 'A' | 'B' | 'C' | 'D'

export interface Zone {
  id: ZoneId
  /** "Zone A" */
  name: string
  /** "Tower Crane" */
  label: string
}

export type Shift = 'Day' | 'Night'

/** A PPE item is worn, not worn, or has no live reading (worker off site). */
export type PpeStatus = 'worn' | 'not-worn' | 'unknown'

export type PresenceStatus = 'present' | 'checked-out' | 'absent'

export interface Worker {
  id: string
  name: string
  zoneId: ZoneId
  shift: Shift
  presence: PresenceStatus
  checkIn: string | null
  checkOut: string | null
  helmet: PpeStatus
  vest: PpeStatus
  /** Rolling compliance rates, 0–100. */
  helmetCompliance: number
  vestCompliance: number
  violations: number
}

export interface AttendanceRecord {
  date: string
  checkIn: string | null
  checkOut: string | null
  helmetCompliance: number
  vestCompliance: number
  violations: number
}

export type PpeItem = 'helmet' | 'vest'

export interface Alert {
  id: string
  workerId: string
  workerName: string
  zoneId: ZoneId
  /** Which sensor raised the alert. */
  item: PpeItem
  helmet: PpeStatus
  vest: PpeStatus
  /** ISO timestamp of when the sensor reported the removal. */
  raisedAt: string
  status: 'active' | 'resolved'
  resolvedBy?: string
  resolvedAt?: string
}

export type CameraStatus = 'online' | 'offline' | 'reconnecting'

export interface Camera {
  id: string
  zoneId: ZoneId
  status: CameraStatus
}

export interface Supervisor {
  name: string
  shortName: string
  initials: string
  email: string
  employeeId: string
  site: string
  role: string
}

export interface DashboardMetrics {
  totalOnsite: number
  activeViolations: number
  safeWorkers: number
  zoneCount: number
  camerasOnline: number
  camerasTotal: number
  updatedAt: number
}

export interface AttendanceFilters {
  query: string
  zoneId: ZoneId | 'all'
  shift: Shift | 'all'
  from: string
  to: string
}

export interface AlertFilters {
  status: 'all' | 'active' | 'resolved'
  zoneId: ZoneId | 'all'
  date: 'today' | 'week' | 'all'
}
