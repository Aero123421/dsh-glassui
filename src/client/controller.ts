/**
 * Settings controller: the single owner of the effective settings in the
 * browser. It merges the Host's stored values with edits that are still being
 * saved, applies the result to the engine at once, and writes edits back
 * through DSH's settings form. The settings page reads it as an external store.
 */
import { SURFACE_KINDS } from '../shared/dom.ts'
import { DEFAULT_SETTINGS, normalizeSettings, sameSettings, type GlassSettings } from '../shared/settings.ts'
import type { Diagnostics } from './engine/engine.ts'

/** DSH's live settings form for one plugin entry (`ctx.configForms.get(id)`). */
export interface SettingsForm {
  getSnapshot(): { status: 'loading' | 'ready' | 'unavailable'; value: unknown; writable: boolean }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
}

/** The part of the engine the controller drives. */
export interface EngineHandle {
  apply(settings: GlassSettings): void
  diagnostics(): Diagnostics
  setAdjusting?(on: boolean): void
}

/**
 * How edits are persisted.
 * - `loading`: waiting for the Host's stored values.
 * - `saved`: everything shown is stored.
 * - `saving`: an edit is on its way.
 * - `local`: this connection cannot store settings; edits last until reload.
 * - `error`: the last edit was refused and has been rolled back.
 */
export type SaveState = 'loading' | 'saved' | 'saving' | 'local' | 'error'

/** What the settings page renders. */
export interface ControllerState {
  settings: GlassSettings
  save: SaveState
  diagnostics: Diagnostics
  updating: boolean
}

/** Quiet time before a burst of edits to one field (dragging the slider) is written. */
const WRITE_DELAY_MS = 300

/** Owns effective settings and their persistence. */
export class GlassController {
  private readonly engine: EngineHandle
  private stored: GlassSettings
  private readonly pending = new Map<keyof GlassSettings, { value: unknown }>()
  private readonly timers = new Map<keyof GlassSettings, ReturnType<typeof setTimeout>>()
  private form: SettingsForm | undefined
  private detachForm: (() => void) | undefined
  private writing = false
  private writeTask: Promise<void> | undefined
  private updateLock = false
  private failed = false
  private disposed = false
  private save: SaveState = 'loading'
  private state: ControllerState
  private readonly listeners = new Set<() => void>()
  private readonly adjustments = new Map<object, (() => void) | undefined>()

  /** Keep pointer controls responsive while their final material is being chosen. */
  beginAdjustment(settle?: () => void): () => void {
    if (this.disposed) return () => undefined
    const token = {}
    this.adjustments.set(token, settle)
    if (this.adjustments.size === 1) this.engine.setAdjusting?.(true)
    return () => {
      if (this.adjustments.delete(token) && this.adjustments.size === 0) this.engine.setAdjusting?.(false)
    }
  }

  /**
   * @param engine - the engine to drive.
   * @param initial - settings from the boot payload, or the defaults.
   */
  constructor(engine: EngineHandle, initial: GlassSettings = { ...DEFAULT_SETTINGS }) {
    this.engine = engine
    this.stored = initial
    this.state = { settings: initial, save: this.save, updating: this.updateLock, diagnostics: engine.diagnostics() }
    engine.apply(initial)
  }

  /** @returns the current state; the same object until something changes. */
  readonly getSnapshot = (): ControllerState => this.state

  /**
   * Observe state changes.
   * @param listener - called after each change.
   * @returns a function that stops observing.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Follow DSH's settings form for this plugin.
   * @param form - the form.
   * @returns a function that stops following it.
   */
  attach(form: SettingsForm): () => void {
    if (this.disposed) return () => undefined
    this.detachForm?.()
    this.form = form
    const adopt = (): void => {
      if (this.disposed || this.form !== form) return
      const snapshot = form.getSnapshot()
      if (snapshot.status === 'ready') this.stored = normalizeSettings(snapshot.value)
      this.recompute()
      void this.flush()
    }
    const stop = form.subscribe(adopt)
    adopt()
    const detach = (): void => {
      stop()
      if (this.form !== form) return
      this.form = undefined
      this.detachForm = undefined
      this.save = 'local'
      this.recompute()
    }
    this.detachForm = detach
    return detach
  }

  /**
   * Change one setting. The engine applies it immediately; the write to DSH
   * follows after {@link WRITE_DELAY_MS} of quiet.
   * @param field - which setting.
   * @param value - new value; normalized like any other input.
   */
  update<K extends keyof GlassSettings>(field: K, value: GlassSettings[K]): void {
    if (this.disposed || this.updateLock) return
    const next = normalizeSettings({ ...this.state.settings, [field]: value })
    // Identity distinguishes a newer edit even when its value repeats an older one.
    this.pending.set(field, { value: next[field] })
    this.failed = false
    const timer = this.timers.get(field)
    if (timer !== undefined) clearTimeout(timer)
    this.timers.set(
      field,
      setTimeout(() => {
        this.timers.delete(field)
        void this.flush()
      }, WRITE_DELAY_MS),
    )
    this.recompute()
  }

  /** Re-read the engine's diagnostics (the page polls this while open). */
  refreshDiagnostics(): void {
    if (this.disposed) return
    const diagnostics = this.engine.diagnostics()
    // The page polls once a second. An unchanged snapshot must not render again.
    if (sameDiagnostics(diagnostics, this.state.diagnostics)) return
    this.state = { ...this.state, diagnostics }
    this.emit()
  }

  /** Flush debounced writes and hold editing until the update request settles. */
  async settleForUpdate(): Promise<() => void> {
    if (this.disposed || this.updateLock) throw new Error('settings')
    for (const settle of [...this.adjustments.values()]) settle?.()
    this.updateLock = true
    this.recompute()
    const release = (): void => {
      this.updateLock = false
      this.recompute()
    }
    try {
      for (const timer of this.timers.values()) clearTimeout(timer)
      this.timers.clear()
      await this.flush()
      if (!this.isActive() || this.failed || this.pending.size > 0 || this.save !== 'saved') throw new Error('settings')
      return release
    } catch (error) {
      release()
      throw error
    }
  }

  private flush(): Promise<void> {
    this.writeTask ??= Promise.resolve()
      .then(() => this.writeReady())
      .finally(() => {
        this.writeTask = undefined
      })
    return this.writeTask
  }

  private async writeReady(): Promise<void> {
    if (this.writing || this.disposed) return
    this.writing = true
    try {
      while (this.isActive()) {
        const form = this.form
        const snapshot = form?.getSnapshot()
        if (!form || snapshot?.status !== 'ready' || !snapshot.writable) break
        const ready = [...this.pending].find(([field]) => !this.timers.has(field))
        if (!ready) break
        const [field, edit] = ready
        let accepted = false
        this.recompute()
        try {
          accepted = await form.set(field, edit.value)
        } catch (error) {
          if (this.isActive()) console.warn('dsh-glassui: saving a setting failed', error)
        }
        if (!this.isActive()) return
        if (this.form !== form) continue
        // A completion belongs to the edit and form that started it.
        if (this.pending.get(field) !== edit) continue
        this.pending.delete(field)
        this.failed ||= !accepted
        const current = form.getSnapshot()
        if (current.status === 'ready') this.stored = normalizeSettings(current.value)
      }
    } finally {
      this.writing = false
      this.recompute()
    }
  }

  private isActive(): boolean {
    return !this.disposed
  }

  private recompute(): void {
    if (this.disposed) return
    const snapshot = this.form?.getSnapshot()
    if (!snapshot) {
      if (this.pending.size > 0) this.save = 'local'
    } else if (snapshot.status === 'loading') this.save = 'loading'
    else if (snapshot.status === 'unavailable' || !snapshot.writable) this.save = 'local'
    else if (this.pending.size > 0 || this.writing) this.save = 'saving'
    else this.save = this.failed ? 'error' : 'saved'
    const settings = normalizeSettings({
      ...this.stored,
      ...Object.fromEntries([...this.pending].map(([field, edit]) => [field, edit.value])),
    })
    const changed = !sameSettings(settings, this.state.settings)
    if (changed) this.engine.apply(settings)
    if (!changed && this.save === this.state.save && this.updateLock === this.state.updating) return
    this.state = { settings, save: this.save, updating: this.updateLock, diagnostics: this.engine.diagnostics() }
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  /** Cancel pending writes. */
  dispose(): void {
    this.disposed = true
    this.adjustments.clear()
    this.engine.setAdjusting?.(false)
    this.detachForm?.()
    this.form = undefined
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.pending.clear()
    this.listeners.clear()
  }
}

function sameList(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) return false
  return true
}

/** Field-wise equality. The engine returns a fresh object on every read. */
function sameDiagnostics(left: Diagnostics, right: Diagnostics): boolean {
  if (
    left.running !== right.running ||
    left.idle !== right.idle ||
    left.lenses !== right.lenses ||
    left.invalidExclude !== right.invalidExclude
  ) {
    return false
  }
  const leftEnv = left.environment
  const rightEnv = right.environment
  if (
    leftEnv.refraction !== rightEnv.refraction ||
    leftEnv.finePointer !== rightEnv.finePointer ||
    leftEnv.reducedTransparency !== rightEnv.reducedTransparency ||
    leftEnv.reducedMotion !== rightEnv.reducedMotion
  ) {
    return false
  }
  if (!sameList(left.missingTokens, right.missingTokens) || !sameList(left.ambiguousTokens, right.ambiguousTokens)) {
    return false
  }
  for (const kind of SURFACE_KINDS) if (left.surfaces[kind] !== right.surfaces[kind]) return false
  return (
    left.scans.batches === right.scans.batches &&
    left.scans.inspected === right.scans.inspected &&
    left.scans.longestMs === right.scans.longestMs &&
    left.scans.totalMs === right.scans.totalMs
  )
}
