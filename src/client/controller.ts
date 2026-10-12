/**
 * Settings controller: the single owner of the effective settings in the
 * browser. It merges the Host's stored values with edits that are still being
 * saved, applies the result to the engine at once, and writes edits back
 * through DSH's settings form. The settings page reads it as an external store.
 */
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
}

/** Quiet time before a burst of edits to one field (dragging the slider) is written. */
const WRITE_DELAY_MS = 300

/** Owns effective settings and their persistence. */
export class GlassController {
  private readonly engine: EngineHandle
  private stored: GlassSettings
  private readonly pending = new Map<keyof GlassSettings, unknown>()
  private readonly timers = new Map<keyof GlassSettings, ReturnType<typeof setTimeout>>()
  private form: SettingsForm | undefined
  private save: SaveState = 'loading'
  private state: ControllerState
  private readonly listeners = new Set<() => void>()

  /**
   * @param engine - the engine to drive.
   * @param initial - settings from the boot payload, or the defaults.
   */
  constructor(engine: EngineHandle, initial: GlassSettings = { ...DEFAULT_SETTINGS }) {
    this.engine = engine
    this.stored = initial
    this.state = { settings: initial, save: this.save, diagnostics: engine.diagnostics() }
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
    this.form = form
    const adopt = (): void => {
      const snapshot = form.getSnapshot()
      if (snapshot.status === 'ready') this.stored = normalizeSettings(snapshot.value)
      if (snapshot.status === 'unavailable' || (snapshot.status === 'ready' && !snapshot.writable)) this.save = 'local'
      else if (snapshot.status === 'ready' && this.save === 'loading') this.save = 'saved'
      // An edit the Host already reflects is no longer pending.
      for (const [field, value] of this.pending) {
        if (this.stored[field] === value && !this.timers.has(field) && this.save !== 'local') this.pending.delete(field)
      }
      this.recompute()
    }
    const stop = form.subscribe(adopt)
    adopt()
    return () => {
      stop()
      if (this.form === form) this.form = undefined
    }
  }

  /**
   * Change one setting. The engine applies it immediately; the write to DSH
   * follows after {@link WRITE_DELAY_MS} of quiet.
   * @param field - which setting.
   * @param value - new value; normalized like any other input.
   */
  update<K extends keyof GlassSettings>(field: K, value: GlassSettings[K]): void {
    const next = normalizeSettings({ ...this.state.settings, [field]: value })
    this.pending.set(field, next[field])
    const timer = this.timers.get(field)
    if (timer !== undefined) clearTimeout(timer)
    if (this.save !== 'local') {
      this.timers.set(
        field,
        setTimeout(() => {
          this.timers.delete(field)
          void this.write(field)
        }, WRITE_DELAY_MS),
      )
    }
    this.recompute()
  }

  /** Re-read the engine's diagnostics (the page polls this while open). */
  refreshDiagnostics(): void {
    this.state = { ...this.state, diagnostics: this.engine.diagnostics() }
    this.emit()
  }

  private async write(field: keyof GlassSettings): Promise<void> {
    const form = this.form
    if (!this.pending.has(field)) return
    if (!form) {
      // No settings form in this composition: keep the edit for this page only.
      this.save = 'local'
      this.recompute()
      return
    }
    const value = this.pending.get(field)
    this.save = 'saving'
    this.recompute()
    let accepted = false
    try {
      accepted = await form.set(field, value)
    } catch (error) {
      console.warn('dsh-glassui: saving a setting failed', error)
    }
    // A newer edit of the same field supersedes this write; it reports on its own.
    if (this.pending.has(field) && this.pending.get(field) !== value) return
    if (!accepted) {
      this.pending.delete(field)
      this.save = 'error'
    } else {
      if (this.stored[field] === value) this.pending.delete(field)
      this.save = this.timers.size > 0 ? 'saving' : 'saved'
    }
    this.recompute()
  }

  private recompute(): void {
    const settings = normalizeSettings({ ...this.stored, ...Object.fromEntries(this.pending) })
    const changed = !sameSettings(settings, this.state.settings)
    if (changed) this.engine.apply(settings)
    if (!changed && this.save === this.state.save) return
    this.state = { settings, save: this.save, diagnostics: this.engine.diagnostics() }
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  /** Cancel pending writes. */
  dispose(): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.listeners.clear()
  }
}
