/**
 * Pointer highlights: a soft light that follows the pointer across glass.
 *
 * The pointer position is written, in the surface's own coordinates, onto the
 * surfaces under the pointer only. The two custom properties are registered as
 * non-inherited (see the stylesheet), so a pointer move restyles those few
 * elements and never their subtrees.
 */
import { ATTR_FLAT, ATTR_HIGHLIGHTS, ATTR_PAINT, ATTR_SURFACE, VAR_POINTER_X, VAR_POINTER_Y } from '../../shared/dom.ts'

/** Surfaces that paint the highlight layer. */
const LIT_SELECTOR = `[${ATTR_SURFACE}][${ATTR_PAINT}]:not([${ATTR_FLAT}]):not([${ATTR_SURFACE}="backdrop"])`

/** Publishes the pointer position on the surfaces under it while enabled. */
export class Highlights {
  private readonly doc: Document
  private enabled = false
  private frame = 0
  private x = 0
  private y = 0
  private target: Element | null = null
  private readonly lit = new Set<HTMLElement>()

  constructor(doc: Document) {
    this.doc = doc
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
    for (const element of this.lit) if (!next.has(element)) this.clear(element)
    for (const element of next) {
      const rect = element.getBoundingClientRect()
      element.style.setProperty(VAR_POINTER_X, `${Math.round(this.x - rect.left - element.clientLeft)}px`)
      element.style.setProperty(VAR_POINTER_Y, `${Math.round(this.y - rect.top - element.clientTop)}px`)
    }
    this.lit.clear()
    for (const element of next) this.lit.add(element)
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
      this.doc.addEventListener('pointerout', this.out, { passive: true })
      return
    }
    view?.removeEventListener('pointermove', this.move, { capture: true })
    this.doc.removeEventListener('pointerout', this.out)
    if (this.frame !== 0) view?.cancelAnimationFrame(this.frame)
    this.frame = 0
    this.target = null
    for (const element of this.lit) this.clear(element)
    this.lit.clear()
    root.removeAttribute(ATTR_HIGHLIGHTS)
  }

  /** Stop following the pointer and remove every published position. */
  dispose(): void {
    this.setEnabled(false)
  }
}
