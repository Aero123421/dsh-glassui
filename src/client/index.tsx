/**
 * dsh-glassui, browser half.
 *
 * Starts the glass engine with the settings the Host embedded in the page,
 * follows DSH's settings form for live changes, and adds the "Glass UI"
 * section to DSH's settings. The engine needs no DSH service at all, so the
 * material works even in a composition without the settings page.
 */
import { BOOT_GLOBAL, DEFAULT_SETTINGS, ENTRY_ID, normalizeSettings, type GlassSettings } from '../shared/settings.ts'
import { UpdateController } from './update-controller.mjs'
import { GlassController } from './controller.ts'
import type { ClientContext } from './dsh.ts'
import { GlassEngine, type Diagnostics } from './engine/engine.ts'
import { detectEnvironment } from './engine/environment.ts'
import { NS, en, ja, zh, type CopyKey } from './settings/locales.ts'
import { SettingsPage, type LocaleSource, type Translate } from './settings/page.tsx'
import settingsCss from './settings/styles.css'

/** Plugin name, the same as the Host half's. */
export const name = ENTRY_ID

/** No required services: optional ones are taken with `ctx.inject` below. */
export const inject: readonly string[] = []

/** Support handle on `globalThis`, for bug reports and tests. Not a stable API. */
export const DEBUG_GLOBAL = '__DSH_GLASSUI_DEBUG__'

/** Order of the settings section; DSH's own sections come first. */
const SETTINGS_ORDER = 880

function bootSettings(): GlassSettings {
  const payload = (globalThis as Record<string, unknown>)[BOOT_GLOBAL]
  if (typeof payload === 'object' && payload !== null && 'settings' in payload) {
    return normalizeSettings(payload.settings)
  }
  return { ...DEFAULT_SETTINGS }
}

function installSettingsStyles(): () => void {
  const style = document.createElement('style')
  style.setAttribute('data-glassui-settings-style', '')
  style.textContent = settingsCss
  document.head.append(style)
  return () => style.remove()
}

/**
 * Plugin body.
 * @param ctx - client plugin context.
 */
export function apply(ctx: ClientContext): void {
  if (typeof document === 'undefined') return
  const environment = detectEnvironment(window)
  const version = __GLASSUI_VERSION__
  // The engine reports changes to the controller, which is built from the engine.
  const link: { controller?: GlassController } = {}
  const engine = new GlassEngine(window, environment, () => link.controller?.refreshDiagnostics())
  const owner = new GlassController(engine, bootSettings())
  link.controller = owner
  const updates = new UpdateController(
    undefined,
    () => owner.settleForUpdate(),
    () => owner.getSnapshot().settings,
  )
  ctx.effect(() => () => updates.dispose(), 'dsh-glassui: update state')
  ctx.inject(['connection'], child => {
    child.effect(() => updates.attach(child.connection), 'dsh-glassui: update connection')
    child.on?.('connection/reset', () => {
      void updates.load()
    })
  })

  ctx.effect(() => {
    const handle = {
      version,
      settings: (): GlassSettings => owner.getSnapshot().settings,
      diagnostics: (): Diagnostics => engine.diagnostics(),
    }
    ;(globalThis as Record<string, unknown>)[DEBUG_GLOBAL] = handle
    return () => {
      owner.dispose()
      engine.dispose()
      if ((globalThis as Record<string, unknown>)[DEBUG_GLOBAL] === handle) {
        Reflect.deleteProperty(globalThis, DEBUG_GLOBAL)
      }
    }
  }, 'dsh-glassui: engine')

  ctx.inject(['configForms'], child => {
    child.effect(() => owner.attach(child.configForms.get(ENTRY_ID)), 'dsh-glassui: settings sync')
  })

  ctx.inject(['slots', 'locale'], child => {
    child.effect(() => child.locale.register(NS, { en, ja, zh }), 'dsh-glassui: copy')
    child.effect(installSettingsStyles, 'dsh-glassui: settings styles')
    const bound = child.locale.bind(NS)
    const translate: Translate = (key: CopyKey, params) => bound(key, params)
    const locale: LocaleSource = {
      subscribe: listener => child.locale.subscribe(listener),
      revision: () => child.locale.getSnapshot().revision,
      translate,
    }
    child.slots.inject('settings.section', () =>
      child.slots.register(
        { name: 'settings.section', id: 'glassui', order: SETTINGS_ORDER, label: () => translate('title') },
        () => (
          <SettingsPage
            controller={owner}
            updates={updates}
            locale={locale}
            version={version}
            refractionSupported={environment.refraction}
          />
        ),
      ),
    )
  })
}
