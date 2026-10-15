/**
 * Pointer highlights: a soft light that follows the pointer across glass.
 *
 * The pointer position is written, in the surface's own coordinates, onto the
 * surfaces under the pointer only. The two custom properties are registered as
 * non-inherited (see the stylesheet), so a pointer move restyles those few
 * elements and never their subtrees.
 *
 * The viewport rectangle is read once and reused for later moves. Scroll,
 * resize, a layout mutation, or a CSS/Web animation on the surface (or an
 * ancestor) discards it, so the light stays on the pointer.
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
  private readonly observer: MutationObserver | undefined
  private viewport: VisualViewport | undefined

  constructor(doc: Document) {
    this.doc = doc
    const View = doc.defaultView?.MutationObserver
    this.observer = View ? new View(this.mutated) : undefined
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
      for (const element of next) {
        const rect = element.getBoundingClientRect()
        this.boxes.set(element, {
          left: rect.left,
          top: rect.top,
          clientLeft: element.clientLeft,
          clientTop: element.clientTop,
        })
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
   * so they must not force the next move to read layout again.
   */
  private pointerStyleOnly(record: MutationRecord): boolean {
    if (record.type !== 'attributes' || record.attributeName !== 'style') return false
    if (!(record.target instanceof HTMLElement) || !this.lit.has(record.target)) return false
    return withoutPointer(record.oldValue ?? '') === withoutPointer(record.target.getAttribute('style') ?? '')
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
      this.observer?.observe(this.doc, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeOldValue: true,
      })
      this.geometryStale = true
      return
    }
    view?.removeEventListener('pointermove', this.move, { capture: true })
    view?.removeEventListener('resize', this.markStale)
    this.doc.removeEventListener('pointerout', this.out)
    this.doc.removeEventListener('scroll', this.markStale, { capture: true })
    this.viewport?.removeEventListener('scroll', this.markStale)
    this.viewport?.removeEventListener('resize', this.markStale)
    this.viewport = undefined
    this.observer?.disconnect()
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
