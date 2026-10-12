/**
 * dsh-glassui, Host half.
 *
 * Declares the live settings (DSH stores them in the profile and serves them to
 * the settings page and the Plugins page) and contributes the boot rows to every
 * Web page render. The Host never touches DSH files, routes or sessions.
 */
import z from '@deepseek-ai/schemastery'
import {
  DEFAULT_SETTINGS,
  ENTRY_ID,
  MAX_EXCLUDE_LENGTH,
  SIDEBAR_STYLES,
  WALLPAPER_CHOICES,
  normalizeSettings,
  type GlassSettings,
} from '../shared/settings.ts'
import { bootRows, type BootRow } from './boot.ts'

/** Plugin name; DSH matches it with the entry in cordis.patch.yml. */
export const name = ENTRY_ID

/** A live configuration value (DSH's `Volatile<T>`). */
export interface Volatile<T> {
  get(): T
}

/** Live settings as DSH hands them to {@link apply}. */
export type Config = { [K in keyof GlassSettings]: Volatile<GlassSettings[K]> }

const d = DEFAULT_SETTINGS

/** Settings schema. Every field is live: edits apply without restarting DSH. */
export const Config = z.object({
  enabled: z.boolean().default(d.enabled).description('Turn the glass material on or off.').volatile(),
  tint: z
    .natural()
    .max(100)
    .default(d.tint)
    .description('Glass density, from 0 (ultra clear) to 100 (fully tinted).')
    .volatile(),
  wallpaper: z
    .union(WALLPAPER_CHOICES)
    .default(d.wallpaper)
    .description('Wallpaper behind the app. "auto" uses Bay in a browser and none in the macOS desktop app.')
    .volatile(),
  wallpaperUrl: z
    .string()
    .default(d.wallpaperUrl)
    .description(
      'Image used when the wallpaper is "custom": an https URL, a path on this server, or a base64 image data URL.',
    )
    .volatile(),
  sidebar: z
    .union(SIDEBAR_STYLES)
    .default(d.sidebar)
    .description('Float the sidebar as an inset pane, or keep it docked.')
    .volatile(),
  refraction: z
    .boolean()
    .default(d.refraction)
    .description('Bend the background along glass edges (Chromium-based browsers only).')
    .volatile(),
  highlights: z.boolean().default(d.highlights).description('A soft highlight that follows the pointer.').volatile(),
  exclude: z
    .string()
    .max(MAX_EXCLUDE_LENGTH)
    .default(d.exclude)
    .description('CSS selectors of elements the plugin must leave untouched, comma separated.')
    .volatile(),
})

/** Event map entry of DSH's Web server used here. */
interface HostContext {
  on(event: 'webserver/index-inject', listener: (table: BootRow[]) => void): () => void
}

/**
 * Read every live value once, so one page render sees one consistent snapshot.
 * @param config - live settings.
 * @returns validated settings.
 */
export function readSettings(config: Config): GlassSettings {
  return normalizeSettings({
    enabled: config.enabled.get(),
    tint: config.tint.get(),
    wallpaper: config.wallpaper.get(),
    wallpaperUrl: config.wallpaperUrl.get(),
    sidebar: config.sidebar.get(),
    refraction: config.refraction.get(),
    highlights: config.highlights.get(),
    exclude: config.exclude.get(),
  })
}

/**
 * Plugin body: contribute boot rows to each page render. The listener is
 * released with the plugin, and rows are rebuilt on every render, so settings
 * edits reach the next page load without a restart.
 * @param ctx - Host plugin context.
 * @param config - live settings.
 */
export function apply(ctx: HostContext, config: Config): void {
  ctx.on('webserver/index-inject', table => {
    table.push(...bootRows(readSettings(config), __GLASSUI_VERSION__))
  })
}
