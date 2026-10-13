/**
 * The engine's dynamic stylesheet: nudged token values for the current palette
 * and one rule per refraction filter. It is the only stylesheet the client
 * half writes at runtime, and it is removed on shutdown.
 */
import { ATTR_EXCLUDED, ATTR_FLAT, ATTR_LENS, ATTR_OWNED, ATTR_RAW, ATTR_SURFACE } from '../../shared/dom.ts'
import type { Rgba } from '../../shared/color.ts'
import { formatColor } from '../../shared/color.ts'
import { BODY, INCLUDED, ROOT } from '../../shared/stylesheet.ts'
import { DARK_ATTRIBUTE, FILL_TOKENS, type FillKey } from '../../shared/tokens.ts'

/**
 * Rules giving each watched fill its nudged value, for one palette only, so a
 * palette switch never shows the previous palette's values.
 * @param nudged - nudged colors by fill.
 * @param dark - whether they belong to the dark palette.
 * @returns CSS text, empty when there is nothing to nudge.
 */
export function nudgeRules(nudged: ReadonlyMap<FillKey, Rgba>, dark: boolean): string {
  if (nudged.size === 0) return ''
  const scheme = dark ? `[${DARK_ATTRIBUTE}]` : `:not([${DARK_ATTRIBUTE}])`
  const declarations = [...nudged].map(([key, color]) => `  ${FILL_TOKENS[key]}: ${formatColor(color)};`).join('\n')
  return `${ROOT} body${scheme}:not([${ATTR_RAW}]):not([${ATTR_EXCLUDED}]) {\n${declarations}\n}`
}

/**
 * The rule that applies one refraction filter.
 * @param id - lens number.
 * @returns CSS text.
 */
export function lensRule(id: number): string {
  return (
    `${BODY} [${ATTR_SURFACE}]${INCLUDED}[${ATTR_LENS}="${id}"]:not([${ATTR_SURFACE}="backdrop"]):not([${ATTR_FLAT}]) {\n` +
    `  backdrop-filter: url(#glassui-lens-${id}) saturate(180%) brightness(1.04);\n}`
  )
}

/** One `<style>` element in `<head>`, rewritten whenever a section changes. */
export class DynamicSheet {
  private readonly doc: Document
  private element: HTMLStyleElement | undefined
  private nudges = ''
  private exclusions = ''
  private readonly lenses = new Map<number, string>()

  constructor(doc: Document) {
    this.doc = doc
  }

  /** @param css - replacement nudge rules. */
  setNudges(css: string): void {
    if (css === this.nudges) return
    this.nudges = css
    this.flush()
  }

  /** @param css - original token values at opt-out boundaries. */
  setExclusions(css: string): void {
    if (css === this.exclusions) return
    this.exclusions = css
    this.flush()
  }

  /**
   * Add or remove a lens rule.
   * @param id - lens number.
   * @param css - the rule, or undefined to remove it.
   */
  setLens(id: number, css: string | undefined): void {
    if (css === undefined) {
      if (!this.lenses.delete(id)) return
    } else {
      if (this.lenses.get(id) === css) return
      this.lenses.set(id, css)
    }
    this.flush()
  }

  private flush(): void {
    if (!this.element?.isConnected) {
      this.element = this.doc.createElement('style')
      this.element.setAttribute(ATTR_OWNED, 'dynamic')
      this.doc.head.append(this.element)
    }
    this.element.textContent = [this.nudges, this.exclusions, ...this.lenses.values()].filter(Boolean).join('\n')
  }

  /** Remove the stylesheet. */
  dispose(): void {
    this.element?.remove()
    this.element = undefined
    this.nudges = ''
    this.exclusions = ''
    this.lenses.clear()
  }
}
