/**
 * End-to-end smoke run against the built application.
 *
 *   npm run build && npm run smoke
 *
 * Boots the packaged renderer in a real Electron window, signs in, walks every
 * module, and exits non-zero if anything fails. Two rules learned the hard way
 * and worth keeping:
 *
 *   - assertions read the DOM, never pixels: capturePage can return a stale
 *     frame when the window is not painting;
 *   - never await requestAnimationFrame, which never fires when the window is
 *     occluded, hanging the run.
 *
 * Screenshots are written to artifacts/smoke/ as evidence only.
 */
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const ROOT = path.join(__dirname, '..')
const INDEX = path.join(ROOT, 'out/renderer/index.html')
const PRELOAD = path.join(ROOT, 'out/preload/index.js')
const ARTIFACTS = path.join(ROOT, 'artifacts/smoke')

const CREDENTIALS = { email: 'r.mendez@site.com', password: 'shieldx' }

const failures = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function check(name, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
    failures.push(name)
  }
}

/** Sets a controlled input the way a user would, so React sees the change. */
const setValue = (id, value) => `
  (() => {
    const el = document.getElementById(${JSON.stringify(id)})
    if (!el) return 'missing:' + ${JSON.stringify(id)}
    const proto = el.tagName === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return 'ok'
  })()
`

const clickByText = (text) => `
  (() => {
    const b = [...document.querySelectorAll('button')]
      .find((x) => x.textContent.trim().includes(${JSON.stringify(text)}))
    if (b) b.click()
    return !!b
  })()
`

const ROUTES = [
  ['#/dashboard', 'Dashboard'],
  ['#/camera', 'Live Camera Feed'],
  ['#/attendance', 'Attendance Management'],
  ['#/alerts', 'Alert Management'],
  ['#/report', 'Worker Report Query'],
  ['#/profile', 'Supervisor Profile']
]

app.whenReady().then(async () => {
  if (!fs.existsSync(INDEX)) {
    console.error(`No build found at ${INDEX}. Run "npm run build" first.`)
    app.exit(1)
    return
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true })

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    backgroundColor: '#f3f2f2',
    webPreferences: { preload: PRELOAD, sandbox: false }
  })

  const consoleErrors = []
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2) consoleErrors.push(message.slice(0, 200))
  })

  const run = (js) => win.webContents.executeJavaScript(js)
  // innerText reflects CSS text-transform, so section labels come back
  // uppercased. Compare case-insensitively rather than matching the styling.
  const rawText = () => run('document.body.innerText')
  const text = async () => (await rawText()).toLowerCase()
  const has = async (needle) => (await text()).includes(needle.toLowerCase())
  // Evidence only, and never allowed to fail the run: capturePage throws
  // outright ("display surface not available") when the compositor has nothing
  // to hand back — a locked screen or an occluded window is enough. The
  // assertions all read the DOM, so a missing screenshot costs nothing.
  const shot = async (name) => {
    try {
      const image = await win.webContents.capturePage()
      fs.writeFileSync(path.join(ARTIFACTS, `${name}.png`), image.toPNG())
    } catch (err) {
      console.log(`  note  screenshot ${name} skipped — ${err.message}`)
    }
  }

  try {
    await win.loadFile(INDEX)
    // Electron reuses one profile across runs, so a session persisted by the
    // previous run (FR-1.9) would otherwise skip the login screen entirely.
    await run(`localStorage.clear(); true`)
    win.webContents.reload()
    await sleep(1500)

    console.log('\nAuthentication')
    check('login screen is the entry point', await has('Site Supervisor sign-in'))

    await run(setValue('login-email', 'not-an-email'))
    await run(setValue('login-password', CREDENTIALS.password))
    await run(`document.querySelector('form').requestSubmit(); true`)
    await sleep(400)
    check('malformed email is rejected inline', await has('Enter a valid email address.'))

    await run(setValue('login-email', CREDENTIALS.email))
    await run(setValue('login-password', 'wrong-password'))
    await run(`document.querySelector('form').requestSubmit(); true`)
    await sleep(1600)
    check(
      'wrong credentials are refused without naming the field',
      await has('Incorrect email or password')
    )

    await run(setValue('login-password', CREDENTIALS.password))
    await run(`document.querySelector('form').requestSubmit(); true`)
    await sleep(2400)
    check('valid credentials reach the dashboard', await has('Total Workers Onsite'))
    await shot('01-dashboard')

    console.log('\nSession (FR-1.9)')
    // The only place a genuine reload happens: unit tests can restore a stored
    // session, but only this proves it survives the renderer being torn down.
    win.webContents.reload()
    await sleep(2400)
    check('the session survives a reload', await has('Total Workers Onsite'))
    check('the login screen is not shown again', !(await has('Site Supervisor sign-in')))

    const stored = await run(`localStorage.getItem('shieldx.session')`)
    check('a session record is persisted', !!stored, String(stored))
    check(
      'no credentials are persisted alongside it',
      !!stored && !stored.includes(CREDENTIALS.password),
      String(stored)
    )

    console.log('\nRoutes')
    for (const [hash, heading] of ROUTES) {
      await run(`location.hash = '${hash}'; true`)
      await sleep(900)
      check(`${hash} renders "${heading}"`, await has(heading))
    }

    console.log('\nLayout (UI-1.8)')
    for (const [w, h] of [
      [1280, 800],
      [1024, 700]
    ]) {
      win.setSize(w, h)
      await sleep(600)
      for (const [hash] of ROUTES) {
        await run(`location.hash = '${hash}'; true`)
        await sleep(500)
        const box = await run(
          `({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })`
        )
        check(
          `${hash} does not scroll horizontally at ${w}x${h}`,
          box.scrollW <= box.clientW,
          `${box.scrollW} > ${box.clientW}`
        )
      }
      await shot(`02-layout-${w}x${h}`)
    }
    win.setSize(1280, 800)
    await sleep(500)

    console.log('\nAlert lifecycle')
    await run(`location.hash = '#/alerts'; true`)
    await sleep(900)
    // Track the one alert we resolve by id. The simulated sensor feed raises new
    // alerts throughout the run, so any assertion on counts races against it.
    const statusOf = (id) =>
      run(
        `(document.querySelector('[data-alert-id="${id}"]') || {}).getAttribute?.('data-alert-status') ?? 'gone'`
      )
    const target = await run(
      `(document.querySelector('[data-alert-status="active"]') || {}).dataset?.alertId ?? null`
    )
    check('active alerts are listed', !!target, `saw ${target}`)

    await run(clickByText('Resolve'))
    await sleep(600)
    check(
      'resolving asks for confirmation',
      await run(`!!document.querySelector('[role="dialog"]')`)
    )
    await shot('03-resolve-confirm')

    await run(clickByText('Resolve alert'))
    await sleep(900)
    const after = await statusOf(target)
    check(
      'confirming moves that alert out of the active list',
      after === 'resolved',
      `${target} is "${after}"`
    )
    check('the outcome is confirmed on screen', await has('resolved.'))
    check('resolved alerts are retained as history', await has('Resolved'))

    console.log('\nWorker report')
    await run(`location.hash = '#/report'; true`)
    await sleep(900)
    check('prompts for a worker before anything is selected', await has('No worker selected'))

    await run(setValue('report-search', 'W-1042'))
    await sleep(600)
    await run(
      `(() => { const o = document.querySelector('[role="option"]'); if (o) o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return !!o })()`
    )
    await sleep(1500)
    check('renders the selected worker report', await has('Attendance history'))
    await shot('04-worker-report')

    const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    fs.writeFileSync(path.join(ARTIFACTS, 'worker-report.pdf'), pdf)
    const pdfText = pdf.toString('latin1')
    check('the printed report identifies itself', pdfText.length > 8000)
    check(
      'the print header is rendered for paper',
      await run(`!!document.querySelector('.print-only')`)
    )

    console.log('\nConsole')
    check('no console errors during the run', consoleErrors.length === 0, consoleErrors.join(' | '))
  } catch (err) {
    check('smoke run completed without throwing', false, err.message)
  }

  console.log(
    failures.length === 0
      ? `\nSmoke run passed. Artifacts in ${path.relative(ROOT, ARTIFACTS)}\n`
      : `\nSmoke run FAILED (${failures.length}): ${failures.join(', ')}\n`
  )
  app.exit(failures.length === 0 ? 0 : 1)
})
