/** Preserve DSH's token values at opt-out boundaries, including inside a glass surface. */
import { ATTR_EXCLUDED, ATTR_IGNORE, ATTR_OWNED, ATTR_ROOT } from '../../shared/dom.ts'
import { ROOT } from '../../shared/stylesheet.ts'
import { FILL_TOKENS, MENU_TOKENS } from '../../shared/tokens.ts'
import type { DynamicSheet } from './sheet.ts'

const TOKENS = [...Object.values(FILL_TOKENS), ...Object.values(MENU_TOKENS)]

/** Scoped resets have zero specificity: a component's own declarations still win. */
export class Exclusions {
  private readonly doc: Document
  private readonly sheet: DynamicSheet
  private readonly entries = new Map<Element, { id: number; css: string }>()
  private nextId = 1

  constructor(doc: Document, sheet: DynamicSheet) {
    this.doc = doc
    this.sheet = sheet
  }

  /** Refresh opt-outs and return roots whose inclusion changed. */
  sync(selector: string, invalidated: readonly Element[]): Element[] {
    const next = new Set(
      [...this.doc.querySelectorAll(`[${ATTR_IGNORE}]${selector ? `, ${selector}` : ''}`)].filter(
        element => this.doc.body.contains(element) && !element.closest(`[${ATTR_OWNED}]`),
      ),
    )
    const changed: Element[] = []
    for (const element of this.entries.keys()) {
      if (next.has(element)) continue
      element.removeAttribute(ATTR_EXCLUDED)
      this.entries.delete(element)
      changed.push(element)
    }
    for (const element of next) {
      if (this.entries.has(element)) continue
      const id = this.nextId++
      this.entries.set(element, { id, css: '' })
      element.setAttribute(ATTR_EXCLUDED, String(id))
      changed.push(element)
    }

    // Appending unrelated transcript rows cannot change these inherited values.
    // Avoid a page-wide style recalculation for every streaming DOM update.
    const pending = [...this.entries].filter(
      ([element, entry]) => entry.css === '' || invalidated.some(root => root.contains(element)),
    )
    const view = this.doc.defaultView
    if (pending.length > 0 && view) {
      const root = this.doc.documentElement
      const enabled = root.getAttribute(ATTR_ROOT)
      // Read the original cascade, including ancestor and inline theme overrides.
      // Restore the switch in the same task, before the browser can paint.
      root.removeAttribute(ATTR_ROOT)
      try {
        for (const [element, entry] of pending) {
          const style = view.getComputedStyle(element)
          const declarations = TOKENS.map(token => `  ${token}: ${style.getPropertyValue(token).trim() || 'initial'};`)
          entry.css = `:where(${ROOT} [${ATTR_EXCLUDED}="${entry.id}"]) {\n${declarations.join('\n')}\n}`
        }
      } finally {
        if (enabled !== null) root.setAttribute(ATTR_ROOT, enabled)
      }
    }
    this.sheet.setExclusions([...this.entries.values()].map(entry => entry.css).join('\n'))
    return changed
  }

  /** Remove internal markers; the public opt-out attributes remain intact. */
  dispose(): void {
    for (const element of this.entries.keys()) element.removeAttribute(ATTR_EXCLUDED)
    this.entries.clear()
    this.sheet.setExclusions('')
  }
}
