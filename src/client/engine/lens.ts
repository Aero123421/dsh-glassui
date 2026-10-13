/**
 * Refraction: one SVG filter per eligible surface, applied as its
 * `backdrop-filter`. Only Chromium renders SVG filters there, so the engine
 * enables this module only after {@link import('./environment.ts').detectEnvironment}
 * says so. Surfaces keep the plain blur while a filter is being built or while
 * their size is changing.
 *
 * A chosen surface carries `data-glassui-lens` for as long as it is chosen; the
 * stylesheet gives it shadows that do not extend past its top-left corner.
 * The refracting `backdrop-filter` itself is a rule in the dynamic sheet,
 * present only while the filter matches the surface's current geometry.
 */
import { ATTR_LENS, ATTR_OWNED, type SurfaceKind } from '../../shared/dom.ts'
import { inkShift, type InkShift } from './ink.ts'
import { bezelFor, lensPixels, scaleFor } from './lens-map.ts'
import { lensRule, type DynamicSheet } from './sheet.ts'

const SVG = 'http://www.w3.org/2000/svg'

/** At most this many surfaces refract at once; each filter costs a full-size map. */
export const MAX_LENSES = 12
/** Surfaces larger than this share of the viewport do not refract. */
export const MAX_LENS_AREA = 0.35
/** Quiet time after a size change before a filter is rebuilt. */
const SETTLE_MS = 160
/** Rendered maps kept for reuse, keyed by geometry. */
const MAP_CACHE = 24
/** Mid-gray: "no displacement" for both channels. */
const NEUTRAL = 'rgb(128 128 128)'

const PRIORITY: Partial<Record<SurfaceKind, number>> = { composer: 0, smoke: 1, menu: 2, panel: 3 }

/** A surface that may refract. */
export interface LensTarget {
  element: Element
  kind: SurfaceKind
  area: number
}

interface Entry {
  id: number
  /** Geometry and shift the current filter was built for; empty before the first build. */
  key: string
  /** Whether the refracting rule is installed. */
  live: boolean
  timer: ReturnType<typeof setTimeout> | undefined
}

/** Owns every refraction filter. */
export class Lenses {
  private readonly doc: Document
  private readonly sheet: DynamicSheet
  private readonly entries = new Map<Element, Entry>()
  private readonly maps = new Map<string, string>()
  private readonly resize: ResizeObserver | undefined
  private defs: SVGSVGElement | undefined
  private enabled = false
  private blur = 12
  private nextId = 1
  private frame = 0

  constructor(doc: Document, sheet: DynamicSheet) {
    this.doc = doc
    this.sheet = sheet
    const view = doc.defaultView
    this.resize =
      view && typeof view.ResizeObserver === 'function'
        ? new view.ResizeObserver(records => {
            for (const record of records) this.resized(record.target)
          })
        : undefined
  }

  /** Number of surfaces currently refracting. */
  get active(): number {
    let count = 0
    for (const entry of this.entries.values()) if (entry.live) count++
    return count
  }

  /** @param on - whether refraction should be shown. */
  setEnabled(on: boolean): void {
    if (on === this.enabled) return
    this.enabled = on
    // Focus rings and transitions can change a surface's shadows without any mutation.
    for (const type of ['focusin', 'focusout', 'transitionend', 'animationend']) {
      if (on) this.doc.addEventListener(type, this.recheck, { capture: true, passive: true })
      else this.doc.removeEventListener(type, this.recheck, { capture: true })
    }
    if (!on) {
      this.releaseAll()
      if (this.frame !== 0) this.doc.defaultView?.cancelAnimationFrame(this.frame)
      this.frame = 0
    }
  }

  /** @param px - blur radius of the glass in CSS pixels. */
  setBlur(px: number): void {
    if (px === this.blur) return
    this.blur = px
    for (const node of this.defs?.querySelectorAll('feGaussianBlur') ?? []) {
      node.setAttribute('stdDeviation', this.deviation())
    }
  }

  /**
   * Make the refracting set match the eligible surfaces.
   * @param targets - every discovered surface that could refract.
   */
  sync(targets: readonly LensTarget[]): void {
    const chosen = new Set(
      this.enabled
        ? targets
            .filter(target => PRIORITY[target.kind] !== undefined && target.area > 0 && target.area <= MAX_LENS_AREA)
            .sort((a, b) => (PRIORITY[a.kind] ?? 9) - (PRIORITY[b.kind] ?? 9) || a.area - b.area)
            .slice(0, MAX_LENSES)
            .map(target => target.element)
        : [],
    )
    for (const element of [...this.entries.keys()]) {
      if (!chosen.has(element) || !element.isConnected) this.release(element)
    }
    for (const element of chosen) {
      if (this.entries.has(element)) {
        this.verify(element)
        continue
      }
      const entry: Entry = { id: this.nextId++, key: '', live: false, timer: undefined }
      this.entries.set(element, entry)
      element.setAttribute(ATTR_LENS, String(entry.id))
      this.resize?.observe(element)
      this.schedule(element, 0)
    }
  }

  private readonly recheck = (): void => {
    const view = this.doc.defaultView
    if (this.frame !== 0 || !view) return
    this.frame = view.requestAnimationFrame(() => {
      this.frame = 0
      for (const element of this.entries.keys()) this.verify(element)
    })
  }

  /** Rebuild a surface's filter when its geometry or shift no longer match. */
  private verify(element: Element): void {
    const entry = this.entries.get(element)
    if (!entry || entry.timer !== undefined || !element.isConnected) return
    // A discovery refresh can notice the new size before ResizeObserver does.
    // Use the same blur fallback and debounce instead of rebuilding every drag frame.
    if (entry.key !== this.geometryKey(element)) this.resized(element)
  }

  private deviation(): string {
    return (this.blur * 0.8).toFixed(1)
  }

  private resized(element: Element): void {
    const entry = this.entries.get(element)
    if (!entry || entry.key === this.geometryKey(element)) return
    // Plain blur while the size settles: a filter sized for the old box would clip the backdrop.
    this.setLive(entry, false)
    this.schedule(element, SETTLE_MS)
  }

  private setLive(entry: Entry, live: boolean): void {
    if (entry.live === live) return
    entry.live = live
    this.sheet.setLens(entry.id, live ? lensRule(entry.id) : undefined)
  }

  private schedule(element: Element, delay: number): void {
    const entry = this.entries.get(element)
    if (!entry) return
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    entry.timer = setTimeout(() => {
      entry.timer = undefined
      this.build(element)
    }, delay)
  }

  /** Size, corner radius and filter shift, e.g. `774x114r28s1,1`. */
  private geometryKey(element: Element): string {
    const { width, height } = this.size(element)
    const view = this.doc.defaultView
    if (!view) return ''
    const style = view.getComputedStyle(element)
    const radius = Math.round(Math.min(parseFloat(style.borderTopLeftRadius) || 0, width / 2, height / 2))
    const shift = inkShift(style)
    return `${width}x${height}r${radius}s${shift.x},${shift.y}`
  }

  private size(element: Element): { width: number; height: number } {
    if (element instanceof (this.doc.defaultView?.HTMLElement ?? HTMLElement)) {
      return { width: Math.round(element.offsetWidth), height: Math.round(element.offsetHeight) }
    }
    const rect = element.getBoundingClientRect()
    return { width: Math.round(rect.width), height: Math.round(rect.height) }
  }

  private build(element: Element): void {
    const entry = this.entries.get(element)
    if (!entry || !this.enabled) return
    if (!element.isConnected) {
      this.release(element)
      return
    }
    const key = this.geometryKey(element)
    const match = /^(\d+)x(\d+)r(\d+)s(\d+),(\d+)$/.exec(key)
    entry.key = key
    const width = Number(match?.[1] ?? 0)
    const height = Number(match?.[2] ?? 0)
    const radius = Number(match?.[3] ?? 0)
    const shift: InkShift = { x: Number(match?.[4] ?? 0), y: Number(match?.[5] ?? 0) }
    // Older Chromium offsets by ink overflow; newer versions use the border box.
    // Zero overflow works in both. Custom outer shadows and focus rings keep blur.
    if (!match || width < 8 || height < 8 || shift.x !== 0 || shift.y !== 0) {
      this.setLive(entry, false)
      return
    }
    const bezel = bezelFor(width, height)
    const href = this.map(`${width}x${height}r${radius}`, { width, height, radius, bezel })
    if (href === undefined) {
      this.setLive(entry, false)
      return
    }
    // The element's box, in the filter's (shifted) user space.
    const box = { x: String(-shift.x), y: String(-shift.y), width: String(width), height: String(height) }
    const filter = this.filter(entry.id)
    for (const [attribute, value] of Object.entries(box)) filter.setAttribute(attribute, value)
    filter.replaceChildren(
      this.node('feGaussianBlur', {
        in: 'SourceGraphic',
        stdDeviation: this.deviation(),
        edgeMode: 'duplicate',
        result: 'blur',
      }),
      // Neutral beneath the map, so a pixel the map misses is not displaced.
      this.node('feFlood', { ...box, 'flood-color': NEUTRAL, result: 'neutral' }),
      this.node('feImage', { ...box, href, preserveAspectRatio: 'none', result: 'image' }),
      this.node('feMerge', { result: 'map' }, [
        this.node('feMergeNode', { in: 'neutral' }),
        this.node('feMergeNode', { in: 'image' }),
      ]),
      this.node('feDisplacementMap', {
        in: 'blur',
        in2: 'map',
        scale: String(scaleFor(bezel)),
        xChannelSelector: 'R',
        yChannelSelector: 'G',
      }),
    )
    this.setLive(entry, true)
  }

  private map(key: string, geometry: Parameters<typeof lensPixels>[0]): string | undefined {
    const cached = this.maps.get(key)
    if (cached !== undefined) return cached
    const canvas = this.doc.createElement('canvas')
    canvas.width = geometry.width
    canvas.height = geometry.height
    const context = canvas.getContext('2d')
    if (!context) return undefined
    const image = context.createImageData(geometry.width, geometry.height)
    image.data.set(lensPixels(geometry))
    context.putImageData(image, 0, 0)
    const url = canvas.toDataURL('image/png')
    this.maps.set(key, url)
    if (this.maps.size > MAP_CACHE) {
      const oldest = this.maps.keys().next().value
      if (oldest !== undefined) this.maps.delete(oldest)
    }
    return url
  }

  private filter(id: number): SVGFilterElement {
    const existing = this.doc.getElementById(`glassui-lens-${id}`)
    if (existing instanceof (this.doc.defaultView?.SVGFilterElement ?? SVGFilterElement)) return existing
    const filter = this.node('filter', {
      id: `glassui-lens-${id}`,
      x: '0',
      y: '0',
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB',
    }) as SVGFilterElement
    this.container().append(filter)
    return filter
  }

  private container(): SVGSVGElement {
    if (this.defs?.isConnected) return this.defs
    const svg = this.doc.createElementNS(SVG, 'svg')
    svg.setAttribute(ATTR_OWNED, 'defs')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
    this.doc.body.append(svg)
    this.defs = svg
    return svg
  }

  private node(
    name: string,
    attributes: Readonly<Record<string, string>>,
    children: readonly SVGElement[] = [],
  ): SVGElement {
    const node = this.doc.createElementNS(SVG, name)
    for (const [attribute, value] of Object.entries(attributes)) node.setAttribute(attribute, value)
    node.append(...children)
    return node
  }

  private release(element: Element): void {
    const entry = this.entries.get(element)
    if (!entry) return
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    this.resize?.unobserve(element)
    this.setLive(entry, false)
    element.removeAttribute(ATTR_LENS)
    this.doc.getElementById(`glassui-lens-${entry.id}`)?.remove()
    this.entries.delete(element)
  }

  private releaseAll(): void {
    for (const element of [...this.entries.keys()]) this.release(element)
  }

  /** Remove every filter and lens attribute. */
  dispose(): void {
    this.setEnabled(false)
    this.releaseAll()
    this.resize?.disconnect()
    this.defs?.remove()
    this.defs = undefined
    this.maps.clear()
  }
}
