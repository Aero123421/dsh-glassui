/**
 * Wallpaper: resolves the setting to a CSS image for the current palette and
 * platform and publishes it on `<html>`.
 */
import { ATTR_WALLPAPER, VAR_WALLPAPER } from '../../shared/dom.ts'
import { isSafeWallpaperUrl, type GlassSettings } from '../../shared/settings.ts'
import { wallpaperImage, type Scheme } from '../../shared/wallpapers.ts'

/** A resolved wallpaper. */
export interface ResolvedWallpaper {
  /** Value of the root attribute. */
  name: string
  /** CSS image value. */
  image: string
}

/**
 * Resolve the wallpaper setting.
 * @param settings - current settings.
 * @param scheme - active palette.
 * @param darwinDesktop - whether the page runs in DSH's macOS desktop app.
 * @returns the wallpaper, or undefined for none.
 */
export function resolveWallpaper(
  settings: GlassSettings,
  scheme: Scheme,
  darwinDesktop: boolean,
): ResolvedWallpaper | undefined {
  switch (settings.wallpaper) {
    case 'none':
      return undefined
    case 'custom':
      return isSafeWallpaperUrl(settings.wallpaperUrl)
        ? { name: 'custom', image: `url("${settings.wallpaperUrl}")` }
        : undefined
    case 'auto':
      return darwinDesktop ? undefined : { name: 'bay', image: wallpaperImage('bay', scheme) }
    default:
      return { name: settings.wallpaper, image: wallpaperImage(settings.wallpaper, scheme) }
  }
}

/** Publishes the wallpaper on `<html>`; caches generated images. */
export class Wallpaper {
  private readonly doc: Document
  private readonly cache = new Map<string, ResolvedWallpaper | undefined>()
  private current: string | undefined

  constructor(doc: Document) {
    this.doc = doc
  }

  /**
   * Show a wallpaper, or none.
   * @param settings - current settings.
   * @param scheme - active palette.
   * @param darwinDesktop - whether the page runs in DSH's macOS desktop app.
   */
  apply(settings: GlassSettings, scheme: Scheme, darwinDesktop: boolean): void {
    const key = `${settings.wallpaper}|${settings.wallpaperUrl}|${scheme}|${darwinDesktop}`
    if (key === this.current) return
    this.current = key
    if (!this.cache.has(key)) this.cache.set(key, resolveWallpaper(settings, scheme, darwinDesktop))
    const wallpaper = this.cache.get(key)
    const root = this.doc.documentElement
    if (!wallpaper) {
      root.removeAttribute(ATTR_WALLPAPER)
      root.style.removeProperty(VAR_WALLPAPER)
      return
    }
    root.style.setProperty(VAR_WALLPAPER, wallpaper.image)
    root.setAttribute(ATTR_WALLPAPER, wallpaper.name)
  }

  /** Remove the wallpaper. */
  dispose(): void {
    const root = this.doc.documentElement
    root.removeAttribute(ATTR_WALLPAPER)
    root.style.removeProperty(VAR_WALLPAPER)
    this.current = undefined
  }
}
