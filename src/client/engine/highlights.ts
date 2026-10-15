/**
 * Pointer highlights: a soft light that follows the pointer across glass.
 *
 * The pointer position is written, in the surface's own coordinates, onto the
 * surfaces under the pointer only. The two custom properties are registered as
 * non-inherited (see the stylesheet), so a pointer move restyles those few
 * elements and never their subtrees.
 *
 * The viewport rectangle is read once and reused for later moves. Scroll,
 * resize, a text or attribute change, a size change, a font or image load, or a
 * CSS/Web animation on the surface (or an ancestor) discards it, so the light
 * stays on the pointer. The first size observation is kept only when it still
 * matches the box measured for that paint.
 */
import { ATTR_FLAT, ATTR_HIGHLIGHTS, ATTR_PAINT, ATTR_SURFACE, VAR_POINTER_X, VAR_POINTER_Y } from '../../shared/dom.ts'

/** Surfaces that paint the highlight layer. */
const LIT_SELECTOR = `[${ATTR_SURFACE}][${ATTR_PAINT}]:not([${ATTR_FLAT}]):not([${ATTR_SURFACE}="backdrop"])`

interface Box {
  left: number
  top: number
  clientLeft: number
  clientTop: number
}

interface Size {
  width: number
  height: number
}

/** Publishes the pointer position on the surfaces under it while enabled. */
export class Highlights {
  private readonly doc: Document
  private enabled = false
  private frame = 0
  private x = 0
  private y = 0
  private target: Element | null = null
  private geometryStale = true
  private readonly lit = new Set<HTMLElement>()
  private readonly boxes = new Map<HTMLElement, Box>()
  /** Style text without the pointer variables, captured when the box was measured. */
  private readonly styleBaseline = new Map<HTMLElement, string>()
  /** Last content-box size reported for an observed element. */
  private readonly observedSize = new Map<Element, string>()
  /** Border box measured when the highlight position was cached. */
  private readonly measuredBorder = new Map<Element, Size>()
  private readonly resizeTargets = new Set<Element>()
  private readonly observer: MutationObserver | undefined
  private resize: ResizeObserver | undefined
  private fonts: FontFaceSet | undefined
  private viewport: VisualViewport | undefined

  constructor(doc: Document) {
    this.doc = doc
    const View = doc.defaultView?.MutationObserver
    this.observer = View ? new View(this.mutated) : undefined
    const Resize = doc.defaultView?.ResizeObserver
    this.resize = Resize ? new Resize(this.resized) : undefined
  }

  private readonly move = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    this.x = event.clientX
    this.y = event.clientY
    this.target = event.target instanceof Element ? event.target : null
    this.schedule()
  }

  private readonly out = (event: PointerEvent): void => {
    if (event.relatedTarget !== null) return
    this.target = null
    this.schedule()
  }

  private readonly markStale = (): void => {
    this.geometryStale = true
  }

  private readonly mutated = (records: MutationRecord[]): void => {
    for (const record of records) {
      if (this.pointerStyleOnly(record)) continue
      this.geometryStale = true
      return
    }
  }

  /**
   * A size change moves the light. The first observation is not a baseline by
   * itself: if it disagrees with the box measured at paint time, the cache is
   * dropped. Later observations drop it when the content box changes.
   */
  private readonly resized = (entries: ResizeObserverEntry[]): void => {
    let changed = false
    for (const entry of entries) {
      const size = `${entry.contentRect.width}x${entry.contentRect.height}`
      const previous = this.observedSize.get(entry.target)
      this.observedSize.set(entry.target, size)
      if (previous !== undefined) {
        if (previous !== size) changed = true
        continue
      }
      const measured = this.measuredBorder.get(entry.target)
      const reported = borderBox(entry)
      if (measured !== undefined && reported !== undefined && !sameSize(measured, reported)) changed = true
    }
    if (changed) this.geometryStale = true
  }

  /** Image, video, and stylesheet loads reflow without a DOM mutation. */
  private readonly resourceSettled = (event: Event): void => {
    const target = event.target
    if (
      target === this.doc ||
      target instanceof HTMLImageElement ||
      target instanceof HTMLVideoElement ||
      target instanceof HTMLLinkElement
    )
      this.geometryStale = true
  }

  private schedule(): void {
    const view = this.doc.defaultView
    if (this.frame === 0 && view) this.frame = view.requestAnimationFrame(this.paint)
  }

  private readonly paint = (): void => {
    this.frame = 0
    const next = new Set<HTMLElement>()
    for (let node = this.target?.closest(LIT_SELECTOR); node; node = node.parentElement?.closest(LIT_SELECTOR)) {
      if (node instanceof HTMLElement) next.add(node)
    }
    if (this.shouldMeasure(next)) {
      this.geometryStale = false
      this.boxes.clear()
      this.measuredBorder.clear()
      this.styleBaseline.clear()
      for (const element of next) {
        const rect = element.getBoundingClientRect()
        this.boxes.set(element, {
          left: rect.left,
          top: rect.top,
          clientLeft: element.clientLeft,
          clientTop: element.clientTop,
        })
        this.measuredBorder.set(element, { width: rect.width, height: rect.height })
        this.styleBaseline.set(element, withoutPointer(element.getAttribute('style') ?? ''))
      }
    }
    for (const element of this.lit) if (!next.has(element)) this.clear(element)
    for (const element of next) {
      const box = this.boxes.get(element)
      if (box === undefined) continue
      const x = `${Math.round(this.x - box.left - box.clientLeft)}px`
      const y = `${Math.round(this.y - box.top - box.clientTop)}px`
      if (element.style.getPropertyValue(VAR_POINTER_X) !== x) element.style.setProperty(VAR_POINTER_X, x)
      if (element.style.getPropertyValue(VAR_POINTER_Y) !== y) element.style.setProperty(VAR_POINTER_Y, y)
    }
    this.lit.clear()
    for (const element of next) this.lit.add(element)
    this.syncResizeWatch(next)
  }

  /** True when the cached viewport rectangles would place the light somewhere else. */
  private shouldMeasure(next: ReadonlySet<HTMLElement>): boolean {
    if (this.geometryStale || next.size !== this.boxes.size) return true
    for (const element of next) {
      if (!this.boxes.has(element) || this.surfaceIsMoving(element)) return true
    }
    return false
  }

  /** A transition or animation on this surface, or on a box that contains it, can move it. */
  private surfaceIsMoving(element: HTMLElement): boolean {
    for (let node: Element | null = element; node; node = node.parentElement) {
      if (typeof node.getAnimations === 'function' && node.getAnimations().length > 0) return true
    }
    return false
  }

  /**
   * Our own pointer writes change the style attribute. They do not move the box,
   * so they must not force the next move to read layout again. The comparison
   * uses the style captured at the last measurement, because the observer does
   * not request attribute old values.
   */
  private pointerStyleOnly(record: MutationRecord): boolean {
    if (record.type !== 'attributes' || record.attributeName !== 'style') return false
    if (!(record.target instanceof HTMLElement) || !this.lit.has(record.target)) return false
    const baseline = this.styleBaseline.get(record.target)
    if (baseline === undefined) return false
    return withoutPointer(record.target.getAttribute('style') ?? '') === baseline
  }

  /** Watch the viewport roots and the surfaces currently under the pointer. */
  private syncResizeWatch(elements: Iterable<HTMLElement>): void {
    const observer = this.resize
    if (!observer) return
    const next = new Set<Element>()
    next.add(this.doc.documentElement)
    next.add(this.doc.body)
    for (const element of elements) {
      for (let node: Element | null = element; node; node = node.parentElement) next.add(node)
    }
    for (const element of [...this.resizeTargets]) {
      if (!next.has(element)) {
        observer.unobserve(element)
        this.observedSize.delete(element)
        this.resizeTargets.delete(element)
      }
    }
    for (const element of next) {
      if (this.resizeTargets.has(element)) continue
      this.resizeTargets.add(element)
      observer.observe(element)
    }
  }

  private clear(element: HTMLElement): void {
    element.style.removeProperty(VAR_POINTER_X)
    element.style.removeProperty(VAR_POINTER_Y)
  }

  /** @param on - whether highlights should follow the pointer. */
  setEnabled(on: boolean): void {
    if (on === this.enabled) return
    this.enabled = on
    const view = this.doc.defaultView
    const root = this.doc.documentElement
    if (on) {
      root.setAttribute(ATTR_HIGHLIGHTS, '')
      view?.addEventListener('pointermove', this.move, { passive: true, capture: true })
      view?.addEventListener('resize', this.markStale, { passive: true })
      this.doc.addEventListener('pointerout', this.out, { passive: true })
      this.doc.addEventListener('scroll', this.markStale, { passive: true, capture: true })
      this.viewport = view?.visualViewport ?? undefined
      this.viewport?.addEventListener('scroll', this.markStale, { passive: true })
      this.viewport?.addEventListener('resize', this.markStale, { passive: true })
      this.doc.addEventListener('load', this.resourceSettled, true)
      this.doc.addEventListener('error', this.resourceSettled, true)
      const fonts = fontSet(this.doc)
      if (fonts) {
        this.fonts = fonts
        fonts.addEventListener('loadingdone', this.markStale)
        fonts.addEventListener('loadingerror', this.markStale)
      }
      this.syncResizeWatch([])
      this.observer?.observe(this.doc, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      })
      this.geometryStale = true
      return
    }
    view?.removeEventListener('pointermove', this.move, { capture: true })
    view?.removeEventListener('resize', this.markStale)
    this.doc.removeEventListener('pointerout', this.out)
    this.doc.removeEventListener('scroll', this.markStale, { capture: true })
    this.doc.removeEventListener('load', this.resourceSettled, true)
    this.doc.removeEventListener('error', this.resourceSettled, true)
    this.fonts?.removeEventListener('loadingdone', this.markStale)
    this.fonts?.removeEventListener('loadingerror', this.markStale)
    this.fonts = undefined
    this.viewport?.removeEventListener('scroll', this.markStale)
    this.viewport?.removeEventListener('resize', this.markStale)
    this.viewport = undefined
    this.observer?.disconnect()
    this.resize?.disconnect()
    this.resizeTargets.clear()
    this.observedSize.clear()
    this.measuredBorder.clear()
    this.styleBaseline.clear()
    if (this.frame !== 0) view?.cancelAnimationFrame(this.frame)
    this.frame = 0
    this.target = null
    this.geometryStale = true
    this.boxes.clear()
    for (const element of this.lit) this.clear(element)
    this.lit.clear()
    root.removeAttribute(ATTR_HIGHLIGHTS)
  }

  /** Stop following the pointer and remove every published position. */
  dispose(): void {
    this.setEnabled(false)
  }
}

/** Style text with the pointer variables removed, so only a real layout change remains. */
function withoutPointer(style: string): string {
  return style.replace(/--glassui-l[xy]\s*:\s*[^;]*;?/g, '').replace(/\s/g, '')
}

/**
 * `Document.fonts` is required by the DOM types and absent on some documents.
 * Highlight tracking still runs without the font events.
 */
function fontSet(doc: Document): FontFaceSet | undefined {
  const fonts = (doc as unknown as { fonts?: FontFaceSet | null }).fonts
  if (!fonts) return undefined
  return fonts
}

/** Border box from a resize entry, in CSS pixels. Missing on older observers. */
function borderBox(entry: ResizeObserverEntry): Size | undefined {
  const box = entry.borderBoxSize[0]
  if (box === undefined) return { width: entry.contentRect.width, height: entry.contentRect.height }
  if (!Number.isFinite(box.inlineSize) || !Number.isFinite(box.blockSize)) return undefined
  return { width: box.inlineSize, height: box.blockSize }
}

function sameSize(measured: Size, reported: Size): boolean {
  return Math.abs(measured.width - reported.width) < 1 && Math.abs(measured.height - reported.height) < 1
}
