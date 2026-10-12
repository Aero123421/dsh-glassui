/**
 * User settings: the one shape shared by the Host schema, the boot payload, the
 * settings page and the engine. Values that cross a process or wire boundary
 * (the boot global, the settings form) pass through {@link normalizeSettings},
 * which never throws and falls back field by field.
 */

/** Profile entry id of the plugin; also its settings namespace. Matches cordis.patch.yml. */
export const ENTRY_ID = 'dsh-glassui'

/** Global the Host boot rows assign before any client code runs. */
export const BOOT_GLOBAL = '__DSH_GLASSUI__'

/** Built-in wallpapers drawn by {@link import('./wallpapers.ts').wallpaperSvg}; tide and the ones after it move. */
export const WALLPAPER_PRESETS = [
  'bay',
  'sunrise',
  'meadow',
  'graphite',
  'lagoon',
  'dusk',
  'dune',
  'tide',
  'aurora',
  'bloom',
  'prism',
] as const
export type WallpaperPreset = (typeof WALLPAPER_PRESETS)[number]

/**
 * Wallpaper choice. `auto` picks Bay in a browser and no wallpaper in the macOS
 * desktop app, whose window already shows the desktop through vibrancy.
 */
export const WALLPAPER_CHOICES = ['auto', ...WALLPAPER_PRESETS, 'none', 'custom'] as const
export type WallpaperChoice = (typeof WALLPAPER_CHOICES)[number]

/** `floating` insets the sidebar as a pane with rounded corners; `docked` keeps DSH's layout. */
export const SIDEBAR_STYLES = ['floating', 'docked'] as const
export type SidebarStyle = (typeof SIDEBAR_STYLES)[number]

/** `glass` turns code blocks into a denser glass; `solid` keeps DSH's opaque code blocks. */
export const CODE_BLOCK_STYLES = ['glass', 'solid'] as const
export type CodeBlockStyle = (typeof CODE_BLOCK_STYLES)[number]

/** Every setting of the plugin. */
export interface GlassSettings {
  /** Master switch. */
  enabled: boolean
  /** Glass density from 0 (ultra clear) to 100 (fully tinted). */
  tint: number
  /** Wallpaper painted behind the app. */
  wallpaper: WallpaperChoice
  /** Image used when {@link wallpaper} is `custom`; see {@link isSafeWallpaperUrl}. */
  wallpaperUrl: string
  /** Sidebar presentation. */
  sidebar: SidebarStyle
  /** Code block presentation. */
  codeBlocks: CodeBlockStyle
  /** Lens refraction along glass edges where the browser supports it (Chromium). */
  refraction: boolean
  /** A soft highlight that follows the pointer on devices with a fine pointer. */
  highlights: boolean
  /** CSS selector list of elements (and their descendants) the plugin must never touch. */
  exclude: string
}

/** Settings used when nothing is configured. */
export const DEFAULT_SETTINGS: Readonly<GlassSettings> = Object.freeze({
  enabled: true,
  tint: 35,
  wallpaper: 'auto',
  wallpaperUrl: '',
  sidebar: 'floating',
  codeBlocks: 'glass',
  refraction: true,
  highlights: true,
  exclude: '',
})

/** Longest accepted custom wallpaper URL, so a pasted data URL cannot bloat every page load. */
export const MAX_WALLPAPER_URL_LENGTH = 2048

/** Longest accepted exclusion selector list. */
export const MAX_EXCLUDE_LENGTH = 1000

const IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i

/**
 * Whether a custom wallpaper URL may be placed in a CSS `url()`. Accepts http(s)
 * URLs, same-origin paths and base64 raster data URLs; rejects scripts, SVG data
 * (which can carry its own requests) and characters that could end the `url()`.
 * @param url - the configured value.
 * @returns true when the value is usable as a wallpaper.
 */
export function isSafeWallpaperUrl(url: string): boolean {
  if (url.length === 0 || url.length > MAX_WALLPAPER_URL_LENGTH) return false
  if (/["'()\\\s<>]/.test(url)) return false
  if (IMAGE_DATA_URL.test(url)) return true
  if (url.startsWith('/') && !url.startsWith('//')) return true
  if (url.startsWith('./') || url.startsWith('../')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function oneOf<T extends string>(choices: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (choices as readonly string[]).includes(value) ? (value as T) : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function text(value: unknown, max: number, fallback: string): string {
  return typeof value === 'string' && value.length <= max ? value.trim() : fallback
}

/**
 * Turn untrusted data into complete settings. Unknown fields are dropped and every
 * invalid field falls back to its default; the tint is rounded and clamped.
 * @param input - a settings object from the boot payload, the settings form or a test.
 * @returns a fresh, complete settings object.
 */
export function normalizeSettings(input: unknown): GlassSettings {
  const source = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const d = DEFAULT_SETTINGS
  const tint =
    typeof source.tint === 'number' && Number.isFinite(source.tint)
      ? Math.min(100, Math.max(0, Math.round(source.tint)))
      : d.tint
  return {
    enabled: bool(source.enabled, d.enabled),
    tint,
    wallpaper: oneOf(WALLPAPER_CHOICES, source.wallpaper, d.wallpaper),
    wallpaperUrl: text(source.wallpaperUrl, MAX_WALLPAPER_URL_LENGTH, d.wallpaperUrl),
    sidebar: oneOf(SIDEBAR_STYLES, source.sidebar, d.sidebar),
    codeBlocks: oneOf(CODE_BLOCK_STYLES, source.codeBlocks, d.codeBlocks),
    refraction: bool(source.refraction, d.refraction),
    highlights: bool(source.highlights, d.highlights),
    exclude: text(source.exclude, MAX_EXCLUDE_LENGTH, d.exclude),
  }
}

/**
 * Compare two settings objects field by field.
 * @param a - first settings.
 * @param b - second settings.
 * @returns true when every field is equal.
 */
export function sameSettings(a: GlassSettings, b: GlassSettings): boolean {
  return (Object.keys(DEFAULT_SETTINGS) as (keyof GlassSettings)[]).every(key => a[key] === b[key])
}

/** Payload of the boot global. */
export interface BootPayload {
  /** Plugin version that rendered the payload. */
  version: string
  /** Settings at page render time. */
  settings: GlassSettings
}
