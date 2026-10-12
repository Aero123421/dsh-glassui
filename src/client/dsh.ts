/**
 * The parts of DSH's client API this plugin uses, typed structurally so the
 * plugin carries no build-time dependency on DSH packages. Each service is
 * optional: the plugin degrades gracefully when a composition lacks it.
 */
import type { SettingsForm } from './controller.ts'

/** `ctx.slots`: the slot registry. */
export interface Slots {
  /** Run `setup` once the slot is declared; dispose with the plugin. */
  inject(name: string, setup: () => () => void): void
  register(
    options: { name: string; id?: string; order?: number; label?: string | (() => string) },
    component: (props: Record<string, unknown>) => unknown,
  ): () => void
}

/** `ctx.locale`: dictionaries and translation. */
export interface Locale {
  register(ns: string, copy: Readonly<Record<string, Readonly<Record<string, string>>>>): () => void
  bind(ns: string): (key: string, params?: Readonly<Record<string, unknown>>) => string
  subscribe(listener: () => void): () => void
  getSnapshot(): { revision: number }
}

/** `ctx.configForms`: live settings forms of Host plugin entries. */
export interface ConfigForms {
  get(entryId: string): SettingsForm
}

/** A client plugin context. */
export interface ClientContext {
  /** Register a disposable effect owned by the plugin. */
  effect(setup: () => () => void, label?: string): void
  /** Run `callback` in a child context once every named service is available. */
  inject(services: readonly string[], callback: (ctx: ClientContext) => void): void
  slots: Slots
  locale: Locale
  configForms: ConfigForms
}
