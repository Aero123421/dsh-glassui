import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { GlassController, type EngineHandle, type SettingsForm } from '../../src/client/controller.ts'
import type { Diagnostics } from '../../src/client/engine/engine.ts'
import { DEFAULT_SETTINGS, normalizeSettings, type GlassSettings } from '../../src/shared/settings.ts'

const diagnostics: Diagnostics = {
  running: true,
  idle: undefined,
  environment: { refraction: false, finePointer: true, reducedTransparency: false, reducedMotion: false },
  missingTokens: [],
  ambiguousTokens: [],
  surfaces: { sidebar: 0, composer: 0, panel: 0, menu: 0, smoke: 0, code: 0, backdrop: 0 },
  lenses: 0,
  invalidExclude: false,
  scans: { batches: 0, inspected: 0, longestMs: 0, totalMs: 0 },
}

class FakeEngine implements EngineHandle {
  applied: GlassSettings[] = []
  apply(settings: GlassSettings): void {
    this.applied.push(settings)
  }
  diagnostics(): Diagnostics {
    return diagnostics
  }
  get last(): GlassSettings | undefined {
    return this.applied.at(-1)
  }
}

type Snapshot = ReturnType<SettingsForm['getSnapshot']>

class FakeForm implements SettingsForm {
  snapshot: Snapshot = { status: 'loading', value: undefined, writable: false }
  writes: [string, unknown][] = []
  /** What the next `set` resolves to; a function may also throw. */
  respond: (field: string, value: unknown) => Promise<boolean> = (field, value) => {
    this.store(field, value)
    return Promise.resolve(true)
  }
  private readonly listeners = new Set<() => void>()

  getSnapshot(): Snapshot {
    return this.snapshot
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  set(field: string, value: unknown): Promise<boolean> {
    this.writes.push([field, value])
    return this.respond(field, value)
  }
  ready(value: Partial<GlassSettings>, writable = true): void {
    this.snapshot = { status: 'ready', value: normalizeSettings(value), writable }
    for (const listener of this.listeners) listener()
  }
  store(field: string, value: unknown): void {
    const current = this.snapshot.value as GlassSettings
    this.ready({ ...current, [field]: value }, this.snapshot.writable)
  }
  get listenerCount(): number {
    return this.listeners.size
  }
}

/** Let promise callbacks run. */
async function settle(): Promise<void> {
  for (let index = 0; index < 5; index++) await Promise.resolve()
}

describe('GlassController', () => {
  it('commits a local slider draft before settling settings for an update', async () => {
    const engine = new FakeEngine(),
      form = new FakeForm()
    const controller = new GlassController(engine)
    form.ready({ tint: 35 })
    controller.attach(form)
    const finish = controller.beginAdjustment(() => {
      controller.update('tint', 61)
      finish()
    })
    const release = await controller.settleForUpdate()
    assert.equal(controller.getSnapshot().settings.tint, 61)
    assert.deepEqual(form.writes, [['tint', 61]])
    assert.equal(controller.getSnapshot().save, 'saved')
    release()
    controller.dispose()
  })
  it('holds adjustment for concurrent controls and clears it on disposal', () => {
    const states: boolean[] = []
    const engine: EngineHandle = new FakeEngine()
    engine.setAdjusting = on => states.push(on)
    const controller = new GlassController(engine)
    const first = controller.beginAdjustment(),
      second = controller.beginAdjustment()
    assert.deepEqual(states, [true])
    first()
    first()
    assert.deepEqual(states, [true])
    second()
    assert.deepEqual(states, [true, false])
    controller.beginAdjustment()
    controller.dispose()
    assert.deepEqual(states, [true, false, true, false])
  })
  beforeEach(() => {
    mock.timers.reset()
  })

  it('applies the boot settings immediately', () => {
    const engine = new FakeEngine()
    const controller = new GlassController(engine, normalizeSettings({ tint: 70 }))
    assert.equal(engine.last?.tint, 70)
    assert.equal(controller.getSnapshot().save, 'loading')
    assert.equal(controller.getSnapshot().settings.tint, 70)
  })

  it('adopts the stored settings once the form is ready', () => {
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    const form = new FakeForm()
    controller.attach(form)
    form.ready({ wallpaper: 'meadow' })
    assert.equal(controller.getSnapshot().settings.wallpaper, 'meadow')
    assert.equal(controller.getSnapshot().save, 'saved')
    assert.equal(engine.last?.wallpaper, 'meadow')
  })

  it('keeps the snapshot identity when nothing changes', () => {
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    controller.attach(form)
    form.ready({})
    const before = controller.getSnapshot()
    form.ready({})
    assert.equal(controller.getSnapshot(), before)
  })

  it('applies edits at once and writes them after a quiet period', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    const form = new FakeForm()
    controller.attach(form)
    form.ready({})
    for (const tint of [40, 50, 60]) controller.update('tint', tint)
    assert.equal(engine.last?.tint, 60)
    assert.deepEqual(form.writes, [])
    mock.timers.tick(299)
    assert.deepEqual(form.writes, [])
    mock.timers.tick(1)
    await settle()
    assert.deepEqual(form.writes, [['tint', 60]])
    assert.equal(controller.getSnapshot().save, 'saved')
    assert.equal(controller.getSnapshot().settings.tint, 60)
  })

  it('normalizes edits', () => {
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    controller.update('tint', 140)
    assert.equal(engine.last?.tint, 100)
    controller.dispose()
  })

  it('rolls back a refused edit', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    const form = new FakeForm()
    form.respond = () => Promise.resolve(false)
    controller.attach(form)
    form.ready({ sidebar: 'floating' })
    controller.update('sidebar', 'docked')
    assert.equal(engine.last?.sidebar, 'docked')
    mock.timers.tick(300)
    await settle()
    assert.equal(controller.getSnapshot().save, 'error')
    assert.equal(controller.getSnapshot().settings.sidebar, 'floating')
    assert.equal(engine.applied.at(-1)?.sidebar, 'floating')
  })

  it('treats a failing write as refused', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const warn = mock.method(console, 'warn', () => undefined)
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    form.respond = () => Promise.reject(new Error('offline'))
    controller.attach(form)
    form.ready({})
    controller.update('highlights', false)
    mock.timers.tick(300)
    await settle()
    assert.equal(controller.getSnapshot().save, 'error')
    assert.equal(controller.getSnapshot().settings.highlights, true)
    assert.equal(warn.mock.callCount(), 1)
    warn.mock.restore()
  })

  it('keeps the newest edit when an older write completes late', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    let release: (() => void) | undefined
    form.respond = (field, value) =>
      new Promise(resolve => {
        release = () => {
          form.store(field, value)
          resolve(true)
        }
      })
    controller.attach(form)
    form.ready({})
    controller.update('tint', 10)
    mock.timers.tick(300)
    await settle()
    controller.update('tint', 90)
    release?.()
    await settle()
    assert.equal(controller.getSnapshot().settings.tint, 90)
  })

  it('works locally when the connection cannot store settings', () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    const form = new FakeForm()
    controller.attach(form)
    form.ready({}, false)
    assert.equal(controller.getSnapshot().save, 'local')
    controller.update('refraction', false)
    mock.timers.tick(1000)
    assert.deepEqual(form.writes, [])
    assert.equal(controller.getSnapshot().settings.refraction, false)
    assert.equal(engine.last?.refraction, false)
  })

  it('keeps edits for the page when no settings form exists', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new GlassController(new FakeEngine())
    controller.update('wallpaper', 'graphite')
    mock.timers.tick(300)
    await settle()
    assert.equal(controller.getSnapshot().save, 'local')
    assert.equal(controller.getSnapshot().settings.wallpaper, 'graphite')
  })

  it('does not notify when a diagnostics poll repeats the same snapshot', () => {
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    let calls = 0
    controller.subscribe(() => calls++)
    controller.refreshDiagnostics()
    assert.equal(calls, 0)
    const current = controller.getSnapshot().diagnostics
    engine.diagnostics = () => ({ ...current, lenses: current.lenses + 1, scans: { ...current.scans, batches: 4 } })
    controller.refreshDiagnostics()
    assert.equal(calls, 1)
    assert.equal(controller.getSnapshot().diagnostics.lenses, 1)
    assert.equal(controller.getSnapshot().diagnostics.scans.batches, 4)
    controller.refreshDiagnostics()
    assert.equal(calls, 1)
    controller.dispose()
  })

  it('notifies subscribers and stops when unsubscribed', () => {
    const controller = new GlassController(new FakeEngine())
    let calls = 0
    const stop = controller.subscribe(() => calls++)
    controller.update('tint', 20)
    assert.equal(calls, 1)
    stop()
    controller.update('tint', 30)
    assert.equal(calls, 1)
    controller.dispose()
  })

  it('detaches from the form', () => {
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    const detach = controller.attach(form)
    assert.equal(form.listenerCount, 1)
    detach()
    assert.equal(form.listenerCount, 0)
  })

  it('starts from the defaults without boot settings', () => {
    const engine = new FakeEngine()
    new GlassController(engine)
    assert.deepEqual(engine.last, DEFAULT_SETTINGS)
  })

  it('waits for a loading form instead of discarding an early edit', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    form.respond = (field, value) => {
      if (form.snapshot.status !== 'ready') return Promise.resolve(false)
      form.store(field, value)
      return Promise.resolve(true)
    }
    controller.attach(form)
    controller.update('tint', 80)
    mock.timers.tick(300)
    await settle()
    assert.deepEqual(form.writes, [])
    form.ready({})
    mock.timers.tick(300)
    await settle()
    assert.equal(controller.getSnapshot().settings.tint, 80)
    assert.equal(controller.getSnapshot().save, 'saved')
  })

  it('resumes persistence when a read-only form becomes writable', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    controller.attach(form)
    form.ready({}, false)
    controller.update('wallpaper', 'meadow')
    form.ready({})
    mock.timers.tick(300)
    await settle()
    assert.deepEqual(form.writes, [['wallpaper', 'meadow']])
    assert.equal(controller.getSnapshot().save, 'saved')
  })

  it('serializes writes and keeps the latest repeated value after a refused older write', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new GlassController(new FakeEngine())
    const form = new FakeForm()
    const replies: ((accepted: boolean) => void)[] = []
    form.respond = (field, value) =>
      new Promise(resolve => {
        replies.push(accepted => {
          if (accepted) form.store(field, value)
          resolve(accepted)
        })
      })
    controller.attach(form)
    form.ready({})
    controller.update('tint', 10)
    mock.timers.tick(300)
    await settle()
    controller.update('tint', 90)
    mock.timers.tick(300)
    await settle()
    controller.update('tint', 10)
    mock.timers.tick(300)
    await settle()
    assert.equal(form.writes.length, 1, 'only one request is in flight')
    replies[0]?.(false)
    await settle()
    assert.equal(controller.getSnapshot().settings.tint, 10, 'the newer edit survives')
    assert.deepEqual(form.writes, [
      ['tint', 10],
      ['tint', 10],
    ])
    replies[1]?.(true)
    await settle()
    assert.equal(controller.getSnapshot().save, 'saved')
  })

  it('does not reapply glass when a write settles after disposal', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    const engine = new FakeEngine()
    const controller = new GlassController(engine)
    const form = new FakeForm()
    let rejectWrite: (() => void) | undefined
    form.respond = () =>
      new Promise(resolve => {
        rejectWrite = () => resolve(false)
      })
    controller.attach(form)
    form.ready({})
    controller.update('enabled', false)
    mock.timers.tick(300)
    await settle()
    controller.dispose()
    const count = engine.applied.length
    rejectWrite?.()
    await settle()
    assert.equal(engine.applied.length, count)
    assert.equal(form.listenerCount, 0)
  })
})

describe('settings settlement before plugin updates', () => {
  it('flushes a debounced slider edit without restarting the engine and locks further edits', async () => {
    const engine = new FakeEngine(),
      controller = new GlassController(engine),
      form = new FakeForm()
    controller.attach(form)
    form.ready({ wallpaper: 'meadow', exclude: '.third-party' })
    controller.update('tint', 72)
    const count = engine.applied.length
    const release = await controller.settleForUpdate()
    assert.deepEqual(form.writes, [['tint', 72]])
    assert.equal(controller.getSnapshot().save, 'saved')
    assert.equal(controller.getSnapshot().updating, true)
    controller.update('tint', 12)
    assert.equal(controller.getSnapshot().settings.tint, 72)
    assert.equal(engine.applied.length, count)
    assert.equal(controller.getSnapshot().settings.exclude, '.third-party')
    release()
    assert.equal(controller.getSnapshot().updating, false)
    controller.dispose()
  })
  it('waits for the actual in-flight save; rejected writes cannot admit an update', async () => {
    const controller = new GlassController(new FakeEngine()),
      form = new FakeForm()
    controller.attach(form)
    form.ready({})
    let reply: ((value: boolean) => void) | undefined
    form.respond = () =>
      new Promise(resolve => {
        reply = resolve
      })
    controller.update('tint', 82)
    let settled = false
    const operation = controller.settleForUpdate().then(() => {
      settled = true
    })
    await settle()
    assert.equal(settled, false)
    reply?.(false)
    await assert.rejects(operation, /settings/)
    assert.equal(controller.getSnapshot().save, 'error')
    assert.equal(controller.getSnapshot().updating, false)
    controller.dispose()
  })
  it('refuses local-only unsaved settings', async () => {
    const controller = new GlassController(new FakeEngine()),
      form = new FakeForm()
    controller.attach(form)
    form.ready({}, false)
    controller.update('wallpaper', 'sunrise')
    await assert.rejects(controller.settleForUpdate(), /settings/)
    assert.equal(controller.getSnapshot().settings.wallpaper, 'sunrise')
    controller.dispose()
  })
})
