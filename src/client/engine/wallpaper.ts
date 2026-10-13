/**
 * Wallpaper: resolves the setting to a CSS image for the current palette and
 * platform and publishes it on `<html>`. An animated preset keeps its base as
 * that image and adds its moving layers in one element of the plugin's own,
 * painted between the page background and DSH (see {@link LiveLayers}).
 */
import { ATTR_OWNED, ATTR_STATIC_WALLPAPER, ATTR_WALLPAPER, VAR_WALLPAPER } from '../../shared/dom.ts'
import { isSafeWallpaperUrl, type GlassSettings, type WallpaperPreset } from '../../shared/settings.ts'
import {
  OVERSCAN,
  isAnimated,
  svgImage,
  wallpaperImage,
  wallpaperLayers,
  type Scheme,
  type WallpaperMotion,
} from '../../shared/wallpapers.ts'

/**
 * Animation updates per second. Layers move a fraction of a pixel per update, so
 * this looks continuous, and Chromium draws a frame only when a value changes:
 * an animated wallpaper redraws the glass above it 12 times a second instead of
 * at the display's refresh rate.
 */
export const STEPS_PER_SECOND = 12

/** A resolved wallpaper. */
export interface ResolvedWallpaper {
  /** Value of the root attribute. */
  name: string
  /** CSS image value of the still picture. */
  image: string
  /** The built-in preset, when it is one. */
  preset: WallpaperPreset | undefined
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
        ? { name: 'custom', image: `url("${settings.wallpaperUrl}")`, preset: undefined }
        : undefined
    case 'auto':
      return darwinDesktop ? undefined : { name: 'bay', image: wallpaperImage('bay', scheme), preset: 'bay' }
    default:
      return { name: settings.wallpaper, image: wallpaperImage(settings.wallpaper, scheme), preset: settings.wallpaper }
  }
}

/**
 * Keyframes of one moving layer: out along its path with a gentle start and stop.
 * @param motion - the layer's motion.
 * @returns Web Animations keyframes.
 */
export function motionKeyframes(motion: WallpaperMotion): Keyframe[] {
  const path: readonly (readonly [number, number])[] = [
    [0, 0],
    [0.2, 0.1],
    [0.5, 0.5],
    [0.8, 0.9],
    [1, 1],
  ]
  // Percentages in a transform refer to the layer, which is larger than the frame by the overscan.
  const size = 1 + 2 * OVERSCAN
  return path.map(([offset, f]) => ({
    offset,
    transform: `translate(${round((motion.x * f) / size)}%, ${round((motion.y * f) / size)}%) scale(${round(1 + (motion.scale - 1) * f, 4)})`,
  }))
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * The moving layers of an animated wallpaper: one fixed element, a child of
 * `<html>` placed before `<body>` at `z-index: -1`, so it paints above the page
 * background and below everything DSH draws, including the translucent canvas
 * that keeps text readable. Each layer is a whole image moved by a compositor
 * animation; nothing runs on the main thread while it plays.
 */
class LiveLayers {
  private readonly doc: Document
  private container: HTMLDivElement | undefined
  private layers: HTMLDivElement[] = []
  private key = ''

  constructor(doc: Document) {
    this.doc = doc
  }

  /**
   * Show these layers, reusing the running animations when only the images change.
   * @param preset - the preset, for reuse across palette switches.
   * @param layers - images and motions of the moving layers.
   */
  show(preset: WallpaperPreset, layers: readonly { image: string; motion: WallpaperMotion }[]): void {
    const key = `${preset}|${layers.length}`
    if (this.container?.isConnected && key === this.key) {
      layers.forEach((layer, index) => this.layers[index]?.style.setProperty('background-image', layer.image))
      return
    }
    this.hide()
    this.key = key
    const container = this.doc.createElement('div')
    container.setAttribute(ATTR_OWNED, 'wallpaper')
    container.setAttribute('aria-hidden', 'true')
    container.style.cssText = 'position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;'
    // The same 16:10 frame `background-size: cover` gives the still picture.
    const frame = this.doc.createElement('div')
    frame.style.cssText =
      'position:absolute;left:50%;top:50%;width:max(100vw,160vh);height:max(100vh,62.5vw);transform:translate(-50%,-50%);'
    container.append(frame)
    for (const layer of layers) {
      const element = this.doc.createElement('div')
      element.style.cssText = `position:absolute;inset:${-OVERSCAN * 100}%;background:center / 100% 100% no-repeat;will-change:transform;`
      element.style.setProperty('background-image', layer.image)
      frame.append(element)
      this.layers.push(element)
      if (typeof element.animate === 'function') {
        element.animate(motionKeyframes(layer.motion), {
          duration: layer.motion.duration * 1000,
          iterations: Number.POSITIVE_INFINITY,
          direction: 'alternate',
          easing: `steps(${layer.motion.duration * STEPS_PER_SECOND})`,
        })
      }
    }
    const root = this.doc.documentElement
    root.insertBefore(container, this.doc.body)
    this.container = container
  }

  hide(): void {
    for (const layer of this.layers) for (const animation of layer.getAnimations()) animation.cancel()
    this.layers = []
    this.container?.remove()
    this.container = undefined
    this.key = ''
  }
}

/** A still SVG/image kept at its full native cover geometry in a composited layer. */
class StillLayer {
  private readonly doc: Document
  private element: HTMLDivElement | undefined
  private image = ''
  private appliedImage = ''
  private observer: MutationObserver | undefined

  constructor(doc: Document) {
    this.doc = doc
  }

  show(image: string): void {
    this.image = image
    const view = this.doc.defaultView
    if (!this.observer && view) {
      this.observer = new view.MutationObserver(() => this.sync())
      this.observer.observe(this.doc.documentElement, { attributes: true, attributeFilter: ['style'] })
    }
    this.sync()
  }

  private sync(): void {
    const root = this.doc.documentElement
    // Explicit root background customization keeps its original CSS cascade.
    // Checking declarations never forces computed style/layout on a density edit.
    const overridden = [
      'background-image',
      'background-color',
      'background-size',
      'background-position',
      'background-repeat',
      'background-attachment',
    ].some(name => root.style.getPropertyValue(name) !== '')
    if (overridden) {
      this.element?.remove()
      this.element = undefined
      this.appliedImage = ''
      root.removeAttribute(ATTR_STATIC_WALLPAPER)
      return
    }
    if (!this.element?.isConnected) {
      this.element = this.doc.createElement('div')
      this.element.setAttribute(ATTR_OWNED, 'static-wallpaper')
      this.element.setAttribute('aria-hidden', 'true')
      root.insertBefore(this.element, this.doc.body)
      this.appliedImage = ''
    }
    if (this.image !== this.appliedImage) {
      this.element.style.backgroundImage = this.image
      this.appliedImage = this.image
    }
    if (!root.hasAttribute(ATTR_STATIC_WALLPAPER)) root.setAttribute(ATTR_STATIC_WALLPAPER, '')
  }

  hide(): void {
    this.observer?.disconnect()
    this.observer = undefined
    this.element?.remove()
    this.element = undefined
    this.image = ''
    this.appliedImage = ''
    this.doc.documentElement.removeAttribute(ATTR_STATIC_WALLPAPER)
  }
}

/** Publishes the wallpaper on `<html>`; caches generated images. */
export class Wallpaper {
  private readonly doc: Document
  private readonly live: LiveLayers
  private readonly still: StillLayer
  private readonly cache = new Map<string, ResolvedWallpaper | undefined>()
  private readonly layerCache = new Map<
    string,
    { base: string; moving: { image: string; motion: WallpaperMotion }[] }
  >()
  private current: string | undefined

  constructor(doc: Document) {
    this.doc = doc
    this.live = new LiveLayers(doc)
    this.still = new StillLayer(doc)
  }

  /**
   * Show a wallpaper, or none.
   * @param settings - current settings.
   * @param scheme - active palette.
   * @param darwinDesktop - whether the page runs in DSH's macOS desktop app.
   * @param motion - whether animated wallpapers may move (false with reduced motion).
   */
  apply(settings: GlassSettings, scheme: Scheme, darwinDesktop: boolean, motion = true): void {
    const key = `${settings.wallpaper}|${settings.wallpaperUrl}|${scheme}|${darwinDesktop}|${motion}`
    if (key === this.current) return
    this.current = key
    if (!this.cache.has(key)) {
      this.cache.set(key, resolveWallpaper(settings, scheme, darwinDesktop))
      if (this.cache.size > 24) {
        const oldest = this.cache.keys().next().value
        if (oldest !== undefined) this.cache.delete(oldest)
      }
    }
    const wallpaper = this.cache.get(key)
    const root = this.doc.documentElement
    if (!wallpaper) {
      this.live.hide()
      this.still.hide()
      root.removeAttribute(ATTR_WALLPAPER)
      root.style.removeProperty(VAR_WALLPAPER)
      return
    }
    const preset = wallpaper.preset
    if (motion && preset !== undefined && isAnimated(preset)) {
      this.still.hide()
      const layers = this.layers(preset, scheme)
      root.style.setProperty(VAR_WALLPAPER, layers.base)
      this.live.show(preset, layers.moving)
    } else {
      this.live.hide()
      root.style.setProperty(VAR_WALLPAPER, wallpaper.image)
      // Custom images can animate (GIF/APNG/WebP). Preserve their existing
      // root-image decoder and animation timeline; cache only built-in stills.
      if (preset !== undefined) this.still.show(wallpaper.image)
      else this.still.hide()
    }
    root.setAttribute(ATTR_WALLPAPER, wallpaper.name)
  }

  private layers(
    preset: WallpaperPreset,
    scheme: Scheme,
  ): { base: string; moving: { image: string; motion: WallpaperMotion }[] } {
    const key = `${preset}|${scheme}`
    let entry = this.layerCache.get(key)
    if (!entry) {
      const [base, ...rest] = wallpaperLayers(preset, scheme)
      entry = {
        base: base ? svgImage(base.svg) : 'none',
        moving: rest.flatMap(layer => (layer.motion ? [{ image: svgImage(layer.svg), motion: layer.motion }] : [])),
      }
      this.layerCache.set(key, entry)
    }
    return entry
  }

  /** Remove the wallpaper. */
  dispose(): void {
    this.live.hide()
    this.still.hide()
    const root = this.doc.documentElement
    root.removeAttribute(ATTR_WALLPAPER)
    root.style.removeProperty(VAR_WALLPAPER)
    this.current = undefined
    this.cache.clear()
    this.layerCache.clear()
  }
}
