/**
 * Boot rows the Host adds to every DSH Web page so the first paint is already
 * glass: the static stylesheet, the settings for the client half, and a tiny
 * script that sets the root attributes before anything is drawn.
 *
 * The row shapes mirror DSH's `IndexInjection` (`@deepseek-ai/dsh-host-webserver`).
 * They are plain JSON, so DSH can also ship them to static deployments.
 */
import { ATTR_ROOT, ATTR_SIDEBAR, ATTR_WALLPAPER, VAR_TINT, VAR_WALLPAPER } from '../shared/dom.ts'
import { BOOT_GLOBAL, isSafeWallpaperUrl, type BootPayload, type GlassSettings } from '../shared/settings.ts'
import { buildStylesheet } from '../shared/stylesheet.ts'
import { DARK_ATTRIBUTE, PLATFORM_ATTRIBUTE } from '../shared/tokens.ts'
import { wallpaperImage } from '../shared/wallpapers.ts'

/** One index injection row (subset of DSH's `IndexInjection` the plugin emits). */
export type BootRow =
  | { kind: 'global'; name: string; value: unknown }
  | { kind: 'script'; placement: 'head' | 'body'; text: string }
  | { kind: 'style'; text: string }

/** The wallpaper the boot script paints, or none. */
interface BootWallpaper {
  /** Value of the root wallpaper attribute. */
  name: string
  /** CSS image for the light palette. */
  light: string
  /** CSS image for the dark palette. */
  dark: string
  /** Skip in the macOS desktop app, whose window already shows the desktop. */
  skipOnDarwin: boolean
}

function bootWallpaper(settings: GlassSettings): BootWallpaper | undefined {
  switch (settings.wallpaper) {
    case 'none':
      return undefined
    case 'custom': {
      if (!isSafeWallpaperUrl(settings.wallpaperUrl)) return undefined
      const image = `url("${settings.wallpaperUrl}")`
      return { name: 'custom', light: image, dark: image, skipOnDarwin: false }
    }
    case 'auto':
      return {
        name: 'bay',
        light: wallpaperImage('bay', 'light'),
        dark: wallpaperImage('bay', 'dark'),
        skipOnDarwin: true,
      }
    default:
      return {
        name: settings.wallpaper,
        light: wallpaperImage(settings.wallpaper, 'light'),
        dark: wallpaperImage(settings.wallpaper, 'dark'),
        skipOnDarwin: false,
      }
  }
}

/** JSON that cannot close a `<script>` element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * The body script. It runs right after DSH's own theme boot script, so the
 * palette attribute is already on `<body>`. It never throws: any failure leaves
 * the page as DSH draws it, and the client half recovers once it loads.
 */
function bootScript(settings: GlassSettings): string {
  const wallpaper = bootWallpaper(settings)
  return [
    '(function () {',
    '  try {',
    '    var root = document.documentElement',
    "    if (window.matchMedia && window.matchMedia('(forced-colors: active)').matches) return",
    `    root.setAttribute(${scriptJson(ATTR_ROOT)}, 'on')`,
    `    root.setAttribute(${scriptJson(ATTR_SIDEBAR)}, ${scriptJson(settings.sidebar)})`,
    `    root.style.setProperty(${scriptJson(VAR_TINT)}, ${scriptJson(String(settings.tint / 100))})`,
    `    var wallpaper = ${scriptJson(wallpaper ?? null)}`,
    `    if (!wallpaper || (wallpaper.skipOnDarwin && root.getAttribute(${scriptJson(PLATFORM_ATTRIBUTE)}) === 'darwin')) return`,
    `    var dark = !!document.body && document.body.hasAttribute(${scriptJson(DARK_ATTRIBUTE)})`,
    `    root.style.setProperty(${scriptJson(VAR_WALLPAPER)}, dark ? wallpaper.dark : wallpaper.light)`,
    `    root.setAttribute(${scriptJson(ATTR_WALLPAPER)}, wallpaper.name)`,
    '  } catch (error) {',
    "    console.warn('dsh-glassui: boot script failed; the client half will apply the material', error)",
    '  }',
    '})()',
  ].join('\n')
}

let stylesheet: string | undefined

/**
 * Rows for one page render.
 * @param settings - current settings, already validated by the Host schema.
 * @param version - the plugin version, passed on to the client half.
 * @returns rows in insertion order. With the material off only the settings row is emitted.
 */
export function bootRows(settings: GlassSettings, version: string): BootRow[] {
  const payload: BootPayload = { version, settings }
  const rows: BootRow[] = [{ kind: 'global', name: BOOT_GLOBAL, value: payload }]
  if (!settings.enabled) return rows
  stylesheet ??= buildStylesheet()
  rows.push({ kind: 'style', text: stylesheet }, { kind: 'script', placement: 'body', text: bootScript(settings) })
  return rows
}
