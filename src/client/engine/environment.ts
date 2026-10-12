/**
 * Browser capabilities and user preferences the engine adapts to.
 */

interface UserAgentData {
  brands?: readonly { brand: string }[]
}

/** What the current browser can do and what the user asked for. */
export interface Environment {
  /** SVG filters inside `backdrop-filter` render (Chromium). Firefox accepts the syntax but draws nothing. */
  readonly refraction: boolean
  /** A precise pointer that can hover; pointer highlights are pointless on touch screens. */
  finePointer(): boolean
  /** The user asked the OS to reduce motion. */
  reducedMotion(): boolean
  /** The user asked the OS to reduce transparency. */
  reducedTransparency(): boolean
  /** The user asked for stronger contrast. */
  increasedContrast(): boolean
  /** A forced-colors (high contrast) mode is active; the plugin then stays off entirely. */
  forcedColors(): boolean
  /**
   * Observe changes of any preference above.
   * @param listener - called after a change.
   * @returns a function that stops observing.
   */
  onChange(listener: () => void): () => void
}

/**
 * Detect the environment of a window.
 * @param win - the window the engine runs in.
 * @returns the environment.
 */
export function detectEnvironment(win: Window & typeof globalThis): Environment {
  const query = (text: string): MediaQueryList | undefined =>
    typeof win.matchMedia === 'function' ? win.matchMedia(text) : undefined
  const fine = query('(hover: hover) and (pointer: fine)')
  const motion = query('(prefers-reduced-motion: reduce)')
  const transparency = query('(prefers-reduced-transparency: reduce)')
  const contrast = query('(prefers-contrast: more)')
  const forced = query('(forced-colors: active)')
  // User-Agent Client Hints exist only in secure contexts; DSH Web is often opened over
  // plain http on a LAN address, so fall back to the user agent string there.
  const brands = (win.navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData?.brands
  const chromium = brands
    ? brands.some(entry => /Chromium/i.test(entry.brand))
    : /(?:Chrome|Chromium)\/\d/.test(win.navigator.userAgent)
  const supportsUrl =
    typeof win.CSS !== 'undefined' &&
    typeof win.CSS.supports === 'function' &&
    win.CSS.supports('backdrop-filter', 'url(#a)')
  return {
    refraction: chromium && supportsUrl,
    finePointer: () => fine?.matches ?? false,
    reducedMotion: () => motion?.matches ?? false,
    reducedTransparency: () => transparency?.matches ?? false,
    increasedContrast: () => contrast?.matches ?? false,
    forcedColors: () => forced?.matches ?? false,
    onChange(listener) {
      const lists = [fine, motion, transparency, contrast, forced].filter(
        (list): list is MediaQueryList => list !== undefined,
      )
      for (const list of lists) list.addEventListener('change', listener)
      return () => {
        for (const list of lists) list.removeEventListener('change', listener)
      }
    },
  }
}
