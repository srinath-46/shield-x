import type { Alert, Camera, Supervisor, Worker, Zone, ZoneId } from '@/types'

/**
 * In-memory stand-in for the backend. Every value here mirrors the approved
 * wireframes so the running app matches the design review. Replacing this file
 * (and the service wrappers around it) with real HTTP/WebSocket calls is the
 * only change the UI needs once the sensor backend exists.
 */

export const SUPERVISOR: Supervisor = {
  name: 'Ramon Mendez',
  shortName: 'R. Mendez',
  initials: 'RM',
  email: 'r.mendez@site.com',
  employeeId: 'EMP-2041',
  site: 'Northgate Tower — Phase 2',
  role: 'Site Supervisor'
}

export const ZONES: Zone[] = [
  { id: 'A', name: 'Zone A', label: 'Tower Crane' },
  { id: 'B', name: 'Zone B', label: 'Scaffold East' },
  { id: 'C', name: 'Zone C', label: 'Rebar Yard' },
  { id: 'D', name: 'Zone D', label: 'Loading Bay' }
]

export function zoneById(id: ZoneId): Zone {
  return ZONES.find((z) => z.id === id) ?? ZONES[0]
}

/** "Zone C · Rebar Yard" — the label form used throughout the wireframes. */
export function zoneFullName(id: ZoneId): string {
  const zone = zoneById(id)
  return `${zone.name} · ${zone.label}`
}

/** The site's full headcount — the roster below holds one record per worker. */
export const TOTAL_ROSTER = 142

const SURNAMES = [
  'J. Alvarez',
  'S. Kim',
  'M. Osei',
  'D. Rossi',
  'A. Haddad',
  'L. Ndiaye',
  'P. Nowak',
  'T. Yamada',
  'R. Silva',
  'K. Bakker',
  'E. Fischer',
  'N. Petrov',
  'C. Mwangi',
  'H. Tran',
  'O. Adeyemi',
  'G. Marino',
  'F. Dubois',
  'B. Novak',
  'I. Costa',
  'V. Sharma',
  'W. Chen',
  'Y. Okafor',
  'Z. Ali',
  'Q. Nguyen',
  'U. Larsen',
  'X. Moreno',
  'J. Kowalski',
  'S. Berg',
  'M. Ferreira',
  'D. Ivanov'
]

const IDS = [
  'W-1042',
  'W-0918',
  'W-0771',
  'W-0654',
  'W-1120',
  'W-0488',
  'W-1207',
  'W-0333',
  'W-0961',
  'W-1388',
  'W-0512',
  'W-0847',
  'W-1075',
  'W-0209',
  'W-1451',
  'W-0688',
  'W-1163',
  'W-0725',
  'W-0994',
  'W-1310',
  'W-0576',
  'W-0402',
  'W-1229',
  'W-0863',
  'W-1096',
  'W-0357',
  'W-1402',
  'W-0641',
  'W-0788',
  'W-1188'
]

const ZONE_CYCLE: ZoneId[] = ['C', 'A', 'B', 'A', 'D', 'B', 'C', 'D', 'A', 'B']

function checkInTime(index: number, night: boolean): string {
  const base = night ? 19 : 6
  const minutes = 40 + ((index * 7) % 35)
  const hour = base + Math.floor(minutes / 60)
  return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const INITIALS = 'ABCDEFGHIJKLMNOPRSTVWYZ'

const takenIds = new Set(IDS)

/** Names and IDs for the rest of the site, past the 30 hand-written seeds. */
function generatedIdentity(i: number): { id: string; name: string } {
  const surname = SURNAMES[i % SURNAMES.length].slice(3)
  const initial = INITIALS[(i * 7) % INITIALS.length]
  // Spread the numbers across the 200–1500 range so IDs don't read as a run,
  // stepping past any that a hand-written seed already uses.
  let number = 200 + ((i * 43) % 1300)
  let id = `W-${String(number).padStart(4, '0')}`
  while (takenIds.has(id)) {
    number = 200 + ((number - 199) % 1300)
    id = `W-${String(number).padStart(4, '0')}`
  }
  takenIds.add(id)
  return { id, name: `${initial}. ${surname}` }
}

/**
 * One record per worker on site. The first six are the exact rows drawn in
 * wireframe frame A, including their PPE states; the rest are generated so the
 * roster length, the dashboard counts, and pagination all agree.
 */
export const WORKERS: Worker[] = Array.from({ length: TOTAL_ROSTER }, (_, i) => {
  const seeded = i < IDS.length
  const { id, name } = seeded ? { id: IDS[i], name: SURNAMES[i] } : generatedIdentity(i)
  const night = i % 7 === 3
  const checkedOut = i % 9 === 3
  return {
    id,
    name,
    zoneId: ZONE_CYCLE[i % ZONE_CYCLE.length],
    shift: night ? 'Night' : 'Day',
    presence: checkedOut ? 'checked-out' : 'present',
    checkIn: checkInTime(i, night),
    checkOut: checkedOut ? (night ? '03:58' : '16:04') : null,
    helmet: checkedOut ? 'unknown' : 'worn',
    vest: checkedOut ? 'unknown' : 'worn',
    helmetCompliance: 100 - ((i * 3) % 23),
    vestCompliance: 100 - ((i * 5) % 19),
    violations: (i * 3) % 8
  } satisfies Worker
})

// Frame A's opening rows, restated so the seeded screen matches the wireframe.
WORKERS[0] = {
  ...WORKERS[0],
  zoneId: 'C',
  shift: 'Day',
  checkIn: '06:58',
  helmet: 'not-worn',
  vest: 'worn',
  helmetCompliance: 92,
  vestCompliance: 88,
  violations: 7
}
WORKERS[1] = {
  ...WORKERS[1],
  zoneId: 'A',
  shift: 'Day',
  checkIn: '07:02',
  helmet: 'worn',
  vest: 'not-worn'
}
WORKERS[2] = { ...WORKERS[2], zoneId: 'B', shift: 'Day', checkIn: '06:45' }
WORKERS[3] = {
  ...WORKERS[3],
  zoneId: 'A',
  shift: 'Night',
  presence: 'checked-out',
  checkIn: '19:03',
  checkOut: '03:58',
  helmet: 'unknown',
  vest: 'unknown'
}
WORKERS[4] = {
  ...WORKERS[4],
  zoneId: 'D',
  shift: 'Day',
  checkIn: '07:10',
  helmet: 'not-worn',
  vest: 'worn'
}
WORKERS[5] = { ...WORKERS[5], zoneId: 'B', shift: 'Day', checkIn: '06:52' }

export const CAMERAS: Camera[] = [
  { id: 'CAM 01', zoneId: 'A', status: 'online' },
  { id: 'CAM 02', zoneId: 'B', status: 'online' },
  { id: 'CAM 03', zoneId: 'C', status: 'offline' },
  { id: 'CAM 04', zoneId: 'D', status: 'online' }
]

/** Today at the given wall-clock time, as an ISO string. */
function todayAt(hour: number, minute: number): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const ALERTS: Alert[] = [
  {
    id: 'AL-5001',
    workerId: 'W-1042',
    workerName: 'J. Alvarez',
    zoneId: 'C',
    item: 'helmet',
    helmet: 'not-worn',
    vest: 'worn',
    raisedAt: todayAt(14, 32),
    status: 'active'
  },
  {
    id: 'AL-5000',
    workerId: 'W-0918',
    workerName: 'S. Kim',
    zoneId: 'A',
    item: 'vest',
    helmet: 'worn',
    vest: 'not-worn',
    raisedAt: todayAt(14, 20),
    status: 'active'
  },
  {
    id: 'AL-4999',
    workerId: 'W-1120',
    workerName: 'A. Haddad',
    zoneId: 'D',
    item: 'helmet',
    helmet: 'not-worn',
    vest: 'worn',
    raisedAt: todayAt(13, 58),
    status: 'active'
  },
  {
    id: 'AL-4998',
    workerId: 'W-0771',
    workerName: 'M. Osei',
    zoneId: 'B',
    item: 'helmet',
    helmet: 'worn',
    vest: 'worn',
    raisedAt: todayAt(11, 14),
    status: 'resolved',
    resolvedBy: SUPERVISOR.shortName,
    resolvedAt: todayAt(11, 26)
  },
  {
    id: 'AL-4997',
    workerId: 'W-0654',
    workerName: 'D. Rossi',
    zoneId: 'A',
    item: 'vest',
    helmet: 'worn',
    vest: 'worn',
    raisedAt: todayAt(9, 47),
    status: 'resolved',
    resolvedBy: SUPERVISOR.shortName,
    resolvedAt: todayAt(10, 2)
  }
]

/** Credentials the mock authentication service accepts (FR-1.1). */
export const VALID_CREDENTIALS = {
  email: SUPERVISOR.email,
  password: 'shieldx'
}
