/**
 * Probes: hidden, zero-size elements styled with a single token each. Reading
 * their computed style yields exactly the string an element painted with that
 * token reports, in this browser's own serialization, which is what makes the
 * comparisons in `classify.ts` exact.
 */
import { ATTR_FILL, ATTR_FLAT, ATTR_OWNED, ATTR_RAW, ATTR_SURFACE, type SurfaceKind } from '../../shared/dom.ts'
import {
  ELEVATION_SENTINELS,
  FILL_KEYS,
  FILL_TOKENS,
  MENU_TOKENS,
  RESERVED_TOKENS,
  type ElevationTier,
  type FillKey,
} from '../../shared/tokens.ts'

/** A computed color that means "the token is not defined here". */
export const UNSET = 'rgba(0, 0, 0, 0)'

/** DSH's own values of the watched and reserved fills, before the plugin nudges them. */
export interface RawFills {
  watched: ReadonlyMap<FillKey, string>
  reserved: readonly string[]
}

/** Owns the probe elements under one hidden container in `<body>`. */
export class Probes {
  private readonly doc: Document
  private host: HTMLElement | undefined
  private readonly cache = new Map<string, HTMLElement>()

  constructor(doc: Document) {
    this.doc = doc
  }

  private container(): HTMLElement {
    if (this.host?.isConnected) return this.host
    const host = this.doc.createElement('div')
    host.setAttribute(ATTR_OWNED, 'probes')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict'
    this.doc.body.append(host)
    this.host = host
    this.cache.clear()
    return host
  }

  private probe(key: string, setup: (element: HTMLElement) => void): HTMLElement {
    const cached = this.cache.get(key)
    if (cached?.isConnected) return cached
    const element = this.doc.createElement('div')
    setup(element)
    this.container().append(element)
    this.cache.set(key, element)
    return element
  }

  private style(element: HTMLElement): CSSStyleDeclaration {
    const view = this.doc.defaultView
    if (!view) throw new Error('dsh-glassui: probes need a document with a window')
    return view.getComputedStyle(element)
  }

  /**
   * Computed background of a token as `<body>` currently resolves it.
   * @param token - a custom property name.
   * @returns the computed color.
   */
  color(token: string): string {
    return this.style(this.probe(`bg:${token}`, element => (element.style.background = `var(${token})`)))
      .backgroundColor
  }

  /**
   * DSH's own fill values. The plugin's nudge rules are suspended for the read
   * by an attribute on `<body>`; reading inside one task means nothing is painted
   * in between.
   * @returns watched and reserved values; undefined tokens read as {@link UNSET}.
   */
  raw(): RawFills {
    const body = this.doc.body
    body.setAttribute(ATTR_RAW, '')
    try {
      const watched = new Map(FILL_KEYS.map(key => [key, this.color(FILL_TOKENS[key])] as const))
      const reserved = RESERVED_TOKENS.map(token => this.color(token)).filter(value => value !== UNSET)
      return { watched, reserved }
    } finally {
      body.removeAttribute(ATTR_RAW)
    }
  }

  /** @returns computed colors of the elevation sentinels. */
  elevation(): Record<ElevationTier, string> {
    const read = (tier: ElevationTier): string =>
      this.style(this.probe(`sentinel:${tier}`, element => (element.style.color = ELEVATION_SENTINELS[tier]))).color
    return { panel: read('panel'), prominent: read('prominent'), soft: read('soft') }
  }

  /** @returns the computed `backdrop-filter` of DSH's menu material token. */
  menuFilter(): string {
    return this.style(
      this.probe('menu-filter', element => element.style.setProperty('backdrop-filter', `var(${MENU_TOKENS.filter})`)),
    ).backdropFilter
  }

  /**
   * The computed background a discovered element shows while tagged, so a tagged
   * element can be checked without removing its tags.
   * @param kind - surface kind.
   * @param fill - its watched fill.
   * @param flat - whether it is a nested, transparent surface.
   * @returns the computed color.
   */
  tagged(kind: SurfaceKind, fill: FillKey, flat: boolean): string {
    const element = this.probe(`tagged:${kind}:${fill}:${flat}`, created => {
      created.setAttribute(ATTR_SURFACE, kind)
      created.setAttribute(ATTR_FILL, fill)
      if (flat) created.setAttribute(ATTR_FLAT, '')
      created.style.background = `var(${FILL_TOKENS[fill]})`
    })
    return this.style(element).backgroundColor
  }

  /** Remove every probe. */
  dispose(): void {
    this.host?.remove()
    this.host = undefined
    this.cache.clear()
  }
}
