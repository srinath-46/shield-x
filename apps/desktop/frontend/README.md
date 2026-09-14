# Shield X — Site Supervisor Desktop Application (Frontend)

Electron + React desktop frontend for the Shield X BLE-based construction safety monitoring system.

This module is **feature-complete against the SRS and runs entirely on mock data**. It is handed
over to the backend team to be connected to real services. Everything a real API needs to touch
lives in one directory — `src/renderer/services/` — and the contract it must satisfy is written out
in [Backend integration](#backend-integration) below.

Built to the approved specification documents, which are delivered alongside this repository rather
than inside it:

- `ShieldX_SRS_Functional_and_UI_Requirements.md` — the FR-x.y / UI-x.y requirements. Requirement
  IDs are quoted in code comments next to the logic that implements them, so any behaviour in this
  app can be traced back to the clause that asked for it.
- `ShieldX UI_UX Wireframes v2.html` — the approved wireframes. The design tokens and screen layouts
  here are ported from it.

---

## Prerequisites

| Tool             | Version                | Notes                                                    |
| ---------------- | ---------------------- | -------------------------------------------------------- |
| Node.js          | ≥ 20.19 (built on 23.10) | Vite 5 and Electron 32 both require ≥ 20.19             |
| npm              | ≥ 10 (built on 11.18)  | `package-lock.json` is lockfile v3                       |
| OS               | Windows 10/11, macOS, Linux | Developed and smoke-tested on Windows 11            |

`npm install` downloads the Electron binary (~100 MB) on first run. Behind a corporate proxy, set
`ELECTRON_MIRROR` or `electron_config_cache` accordingly.

See [`requirements.txt`](./requirements.txt) for the full pinned dependency list and the
environment expectations for the backend side.

## Running

```bash
npm install
npm run dev        # launches the Electron app with hot reload
npm run build      # typechecks, then bundles main / preload / renderer into out/
npm run typecheck
npm run verify     # typecheck + lint + format:check + test + build — the gate before any commit
```

Sign in with **r.mendez@site.com** / **shieldx**, or use the Google button, which resolves to the
same mock supervisor.

## What is real and what is mocked

There is no backend yet. Every screen reads through `src/renderer/services/`, which returns mock
data from promises with a short delay so loading states behave like real fetches. A simulated BLE
sensor feed (`services/liveFeed.ts`) raises a PPE alert every few seconds, which moves the dashboard
counts and pushes a new-alert banner into the Alerts screen without a reload.

Camera tiles render placeholder art rather than video: streams come from site CCTV/IP cameras and
are for human visual confirmation only — the application performs no AI worker or PPE detection
(FR-3.6).

Everything else — routing, auth gating, session expiry, filtering, the alert lifecycle, CSV export,
printing, the full keyboard and screen-reader surface — is the real implementation and does not
change when the backend lands.

## Layout

```
src/
  main/          Electron main process — 1280x800 window, min 1024x700
  preload/       contextBridge surface (platform facts only)
  renderer/
    styles/system.css   design tokens + component classes ported from the wireframes
    types/              domain model (Worker, Alert, Camera, Supervisor, …)
    services/           the mock backend — the only layer a real API touches
    state/              AuthContext (session) and LiveDataContext (sensor stream)
    components/         AppShell, Sidebar, StatusBadge, ConfirmDialog, MetricCard,
                        Skeleton, ErrorBoundary, WorkerSearch, useFocusTrap, …
    screens/            one file per module
scripts/smoke.cjs       end-to-end run against the built app
test/                   vitest setup and shared render helpers
```

The roster holds one record per worker on site (142), so the dashboard figures, the attendance
footer, and pagination are all derived from the same list and cannot disagree.

Routing uses `HashRouter`, since the packaged app is served from `file://`. `RequireAuth` in
`App.tsx` blocks every module but Login until authentication succeeds (FR-1.8).

---

# Backend integration

## The seam

Screens never import mock data and never call `fetch`. They read through two React contexts and a
set of pure helper functions:

```
screens/*  ──reads──►  state/LiveDataContext  ──subscribes──►  services/store.ts   ◄── services/liveFeed.ts
           └─calls──►  services/*Service.ts (pure helpers + async actions)
```

`store.ts` holds the current site state (`workers`, `alerts`, `cameras`) plus a `subscribe()`
channel. Everything else in the service layer is either a **pure helper** that transforms data
already in hand (`filterWorkers`, `attendanceRows`, `matchesQuery`, `attendanceOn`, `filterAlerts`,
`sortNewestFirst`, `computeMetrics`, …) or a **short async action** (`login`, `resolveAlert`,
`refreshCamera`, `changePassword`).

**So the integration is narrower than the file count suggests:** fill `store.ts` from the API, keep
`subscribe()` firing on every change, and replace the async actions with real calls. The pure
helpers work unchanged on live records — they are already covered by tests that encode the SRS
rules, and those tests are your regression net.

Do not change the shapes in `src/renderer/types/index.ts` without agreement — they are the contract,
and the whole UI plus 129 tests are typed against them.

## What each service needs from the API

| Frontend function                            | Needs                                            | Suggested endpoint                     |
| -------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `authService.login(email, password)`         | authenticate → `Supervisor` + token               | `POST /auth/login`                     |
| `authService.loginWithGoogle()`              | OAuth handshake → `Supervisor` + token            | `GET /auth/google` (system browser)    |
| `authService.supervisorForEmail(email)`      | validate a restored session → `Supervisor`        | `GET /auth/me` (see Sessions)          |
| `authService.requestPasswordReset(email)`    | trigger reset mail; always report success (FR-1.7)| `POST /auth/forgot-password`           |
| `authService.changePassword(current, next)`  | rotate password (FR-7.7)                          | `POST /auth/change-password`           |
| `store.getWorkers()`                         | full roster with live presence + PPE state        | `GET /workers`                         |
| `store.getAlerts()`                          | active **and** resolved alerts (history is kept)  | `GET /alerts`                          |
| `store.getCameras()`                         | camera inventory + online/offline status          | `GET /cameras`                         |
| `alertService.resolveAlert(id)`              | mark resolved, record who and when (FR-5.10)      | `POST /alerts/{id}/resolve`            |
| `cameraService.refreshCamera(id)`            | tear down and re-establish one stream (FR-3.4)    | `POST /cameras/{id}/refresh`           |
| `workerService.getAttendanceHistory(worker)` | per-worker daily history → `AttendanceRecord[]`   | `GET /workers/{id}/attendance`         |
| `liveFeed`                                   | **push** channel for sensor events                | WebSocket / SSE / IPC — see below      |

Payload shapes are exactly the exported interfaces in `src/renderer/types/index.ts`: `Worker`,
`Alert`, `Camera`, `Supervisor`, `AttendanceRecord`. `raisedAt` / `resolvedAt` are ISO 8601 strings;
`checkIn` / `checkOut` are display-time strings or `null`; compliance rates are numbers 0–100.

`DashboardMetrics` is **derived on the client** by `computeMetrics()` from the roster and the alert
list, deliberately — that is why the three dashboard cards can never disagree with the Alerts screen
(FR-5.11). Do not add a `/metrics` endpoint and feed the cards separately; that reintroduces exactly
the drift this design removes.

## The live feed is the important one

`services/liveFeed.ts` currently emits a synthetic PPE alert on a 9-second interval. It is the stand
-in for the BLE sensor stream, and it is what makes the dashboard, the alert banner, and the alert
count move without a reload (FR-2.6, FR-5.1, FR-5.2, UI-6.9).

Replacing it means keeping three things intact:

1. **`onSensorAlert(listener)`** — fires once per new alert. The Alerts screen banner rides on this.
2. **`startLiveFeed()` returns its own teardown**, and `stopLiveFeed()` is idempotent. Tests and the
   app shell both rely on this; a feed that cannot be stopped leaks intervals across the suite.
3. **Every mutation calls `emit()` in `store.ts`.** `LiveDataContext` reads module state React cannot
   see, so `subscribe()` is the only thing that makes the UI recompute. An update that mutates the
   store without emitting will render nothing and look like a frontend bug.

`LiveDataContext` also treats "no store mutation for 30 s" as the feed being down and says so in the
UI rather than showing stale figures as if they were live. A real connection should keep that
behaviour — either by heartbeat or by calling into the store on reconnect.

## Sessions and auth

The supervisor stays signed in across reloads and restarts (FR-1.9). `services/sessionService.ts`
persists the account email and two timestamps — **never a password** — and runs two clocks: a
30-minute idle timeout that user activity defers, and a 12-hour absolute cap that it cannot.
Whichever fires first ends the session, `RequireAuth` returns the supervisor to Login, and the screen
explains that inactivity was the cause rather than silently presenting a blank form. Logging out
clears the record immediately and is reported as a logout, not a timeout.

Storage is treated as untrusted: a malformed, stale, or hand-edited record is discarded rather than
partially believed, and a session whose account no longer resolves is dropped. If storage is
unavailable the app still signs in — the session simply stops persisting.

**When you wire real auth:** store the token in place of the email in `StoredSession`, and make
`supervisorForEmail` an async `GET /auth/me` against it. Note that it is currently synchronous
because a session is restored during the first render, before anything paints; going async means
adding a loading state to `AuthContext` so the app does not flash the login screen for a valid
session. Keep the server's own expiry authoritative and treat the client clocks as an upper bound,
not the source of truth.

Two behaviours are specified and must survive the swap: a failed login must **never reveal which
credential was wrong** (FR-1.5 — the UI shows one generic message), and forgot-password must
**always report success** so the response cannot be used to enumerate accounts (FR-1.7).

## Where configuration goes

There is no API base URL yet because nothing makes a network call. When you add one, put it in the
main process and expose it through `src/preload/` — the renderer runs with `contextIsolation` on and
`nodeIntegration` off, so it cannot read `process.env` itself. The preload bridge currently exposes
platform facts only and is the right place to extend.

Electron's CSP and `webPreferences` live in `src/main/index.ts`. Remote origins for the API and for
camera streams need allowing there.

## Suggested order of work

1. Auth + session (`/auth/login`, `/auth/me`) — unblocks everything behind `RequireAuth`.
2. Roster and alerts into `store.ts` as a one-shot fetch, keeping `emit()` on every write.
3. The push channel replacing `liveFeed.ts`.
4. Alert resolution and camera refresh — the two write paths.
5. Attendance history, then camera streams into the tiles.

After each step, `npm run verify` must stay green. If a pure helper's test fails, the API is
returning a shape the SRS rules did not expect — fix the shape, not the test.

---

## Modules

| Screen             | Route            | Notes                                                                                                  |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------ |
| Login              | `/login`         | email + password, Google OAuth, forgot-password, inline validation, auth errors, timeout notice        |
| Dashboard          | `/dashboard`     | three metric cards (violations card emphasised while > 0), camera preview, quick-access tiles          |
| Live Camera Feed   | `/camera?zone=C` | zone selector, per-tile online/offline/reconnecting, refresh, full-screen (Esc to exit)                |
| Attendance         | `/attendance`    | search, zone/shift filters, date range, sticky-header table, empty state, pagination                   |
| — date range       |                  | opens on today with live PPE status; widening From/To brings in recorded history, adding a Date column |
| Alerts             | `/alerts`        | active vs resolved groups, newest first, Open Camera, Resolve with confirmation                        |
| Worker Report      | `/report`        | search, profile panel, compliance bars, violation metric, history table, CSV download + print          |
| Supervisor Profile | `/profile`       | read-only account fields, change password with strength/mismatch validation, logout confirmation       |

## Design system

Everything is built on the tokens in `src/renderer/styles/system.css`: Archivo type, `#ec3013`
accent, flat 0px radii, and the safety colour semantics used throughout — green for
compliant/present/online, accent red for violations, grey for offline/no data/resolved. Every
coloured badge carries a text label, so status never depends on colour alone (UI-1.6).

The layout holds from 1024×700 (the window's minimum) upward: grids reflow, the attendance table
scrolls inside its own container with the header pinned, and alert rows stack rather than clip
their actions.

## Tests and quality gates

```bash
npm run test           # 129 tests, 13 files (vitest)
npm run test:coverage  # writes artifacts/coverage; services/** must stay above 80% lines
npm run lint           # eslint 9 flat config — typescript-eslint, react-hooks, jsx-a11y
npm run format         # prettier --write .   (format:check is the CI-safe variant)
npm run build && npm run smoke   # real Electron end-to-end run
```

Tests sit beside their subjects as `*.test.ts(x)`. The service suites carry the requirement logic —
the date-range and today-vs-history rules in `attendanceService`, the alert lifecycle and metric
derivation in `store`, the generic "incorrect email or password" that never names the wrong field
(FR-1.5) in `authService`. The component and screen suites assert interaction contracts rather than
markup: the focus trap shared by all three overlays, the combobox keys, and that "Resolve" opens a
confirmation instead of resolving immediately (UI-6.6).

Two things make the suite reliable. `store.ts` keeps module-level mutable state, so
`resetStore()` runs between cases and each test starts from the seeded roster; and `test/setup.ts`
stubs the three browser APIs jsdom lacks (`ResizeObserver`, `URL.createObjectURL`, `window.print`),
guarded so the pure `// @vitest-environment node` suites still run without a DOM. Every test also
stops the simulated sensor feed on teardown, so its 9-second interval can't leak across files.

`scripts/smoke.cjs` boots the built app in a real Electron window, signs in, reloads to prove the
session survives (FR-1.9), walks all seven routes, resolves an alert, prints a worker report to PDF,
and fails the run on any console error or on horizontal overflow at 1280×800 or 1024×700 (UI-1.8).
Two constraints are baked in. It asserts against the DOM, never pixels: `capturePage` can hand back
a stale frame, or throw outright, when the window isn't painting — so screenshots are evidence only
and a failed capture is reported as a note rather than failing the run. And it never waits on
`requestAnimationFrame`, which never fires while the window is occluded. Alert assertions name the
specific alert by `data-alert-id`, because the simulated feed raises new ones mid-run and any
count-based assertion would race it. The run clears storage on boot, since Electron reuses one
profile and yesterday's session would otherwise skip the login screen. Artifacts land in
`artifacts/smoke/`.

## Keyboard and assistive technology

A skip link is the first focusable element on every screen. All three overlays — the confirm
dialog, the change-password form, and camera full screen — share `useFocusTrap`: focus moves in on
open, Tab cycles inside, Escape closes, and focus returns to whatever opened them. The worker
search is a combobox (↑/↓/Enter/Escape). Dashboard figures and the alert banners are live regions,
so values that change in place are announced rather than updating silently.

---

## Handover status

**Delivered.** All seven modules against the SRS; 129 tests across 13 files; `npm run verify` and
`npm run smoke` (37 checks) both exit 0.

**Known open items**, none of them frontend work:

- **FR-3.1 — live CCTV streams.** Tiles render placeholder art with full online/offline/reconnecting
  states. Blocked on camera hardware and a stream URL, not on UI.
- **Not under version control.** `git init` and a CI workflow running `npm run verify` should be the
  first thing done on receipt.
- **No packaging target.** `electron-builder` is not configured; `npm run build` produces `out/`, not
  an installer.
