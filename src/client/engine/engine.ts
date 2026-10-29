/**
 * The glass engine: finds DSH surfaces by the theme tokens they paint with,
 * marks them with the plugin's attributes, and keeps those marks correct as the
 * page changes. All visual work is done by the stylesheet; the engine only
 * writes attributes in the `data-glassui-*` namespace, a few custom properties
 * on `<html>`, and its own elements (one stylesheet, the probes and the SVG
 * filters). {@link GlassEngine.stop} removes every one of them.
 *
 * Work is batched per animation frame: reads first, then writes, under a time
 * budget, so a burst of DOM changes (a streaming reply) costs a bounded slice of
 * each frame and marks land before the frame is painted.
 */
import { nudgeApart, parseColor, type Rgba } from '../../shared/color.ts'
import {
  ATTR_ECHO,
  ATTR_ADJUSTING,
  ATTR_FILL,
  ATTR_FLAT,
  ATTR_FLOAT,
  ATTR_IGNORE,
  ATTR_MATERIAL,
  ATTR_OWNED,
  ATTR_PAINT,
  ATTR_ROOT,
  ATTR_SIDEBAR,
  ATTR_SURFACE,
  FOOTPRINT_SELECTOR,
  SURFACE_KINDS,
  VAR_INLINE_OPACITY,
  VAR_TINT,
  type SurfaceKind,
} from '../../shared/dom.ts'
import type { GlassSettings } from '../../shared/settings.ts'
import { buildStylesheet } from '../../shared/stylesheet.ts'
import {
  CODE_FILLS,
  DARK_ATTRIBUTE,
  FILL_KEYS,
  FILL_TOKENS,
  MARKDOWN_HINT_ATTRIBUTE,
  PLATFORM_ATTRIBUTE,
  RESERVED_TOKENS,
  type FillKey,
} from '../../shared/tokens.ts'
import { classify, type Classification, type ElementSample, type Signatures } from './classify.ts'
import type { Environment } from './environment.ts'
import { Exclusions } from './exclusions.ts'
import { Highlights } from './highlights.ts'
import { Lenses, type LensTarget } from './lens.ts'
import { Probes, UNSET } from './probes.ts'
import { DynamicSheet, nudgeRules } from './sheet.ts'
import { Wallpaper } from './wallpaper.ts'

/** Elements that can be chrome. Text, media and form controls never are. */
const CANDIDATE_TAGS = new Set([
  'DIV',
  'ASIDE',
  'NAV',
  'HEADER',
  'FOOTER',
  'SECTION',
  'MAIN',
  'FORM',
  'DIALOG',
  'MENU',
  'UL',
  'OL',
  'ARTICLE',
  'BUTTON',
  'FIELDSET',
  'DETAILS',
])

/** Subtrees that never contain chrome: skipped entirely. */
const OPAQUE_TAGS = new Set([
  'SVG',
  'PRE',
  'CODE',
  'TABLE',
  'IFRAME',
  'VIDEO',
  'CANVAS',
  'IMG',
  'TEXTAREA',
  'SELECT',
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
])

/** Marker that identifies the stylesheet the Host embedded in the page. */
export const STYLESHEET_MARKER = '/* dsh-glassui:'

/** Time budget per frame for scanning, in milliseconds. */
export const FRAME_BUDGET_MS = 8

/** Kinds stacked under a surface of the same fill turn transparent instead of adding glass. */
const STACKING_KINDS: ReadonlySet<SurfaceKind> = new Set(['sidebar', 'composer', 'panel', 'smoke', 'code'])

interface Tagged {
  kind: SurfaceKind
  fill: FillKey | undefined
  flat: boolean
  area: number
}

interface Decision {
  element: Element
  verdict: Classification | undefined
  area: number
  untag: boolean
  /** The element repaints the glass color of the surface it sits in. */
  echo?: boolean
}

/** Scan counters. */
export interface ScanStats {
  /** Frames that did scanning work. */
  batches: number
  /** Elements inspected in total. */
  inspected: number
  /** Longest single batch, in milliseconds. */
  longestMs: number
  /** Total time spent scanning, in milliseconds. */
  totalMs: number
}

/** A snapshot for the settings page, support requests and tests. */
export interface Diagnostics {
  running: boolean
  /** Why the engine is not running, when it is not. */
  idle: 'disabled' | 'forced-colors' | undefined
  environment: { refraction: boolean; finePointer: boolean; reducedTransparency: boolean; reducedMotion: boolean }
  /** Watched fills DSH does not define in this release. */
  missingTokens: FillKey[]
  /** Watched fills that could not be told apart (e.g. another theme set them to the same color). */
  ambiguousTokens: FillKey[]
  /** Discovered surfaces by kind, nested transparent ones excluded. */
  surfaces: Record<SurfaceKind, number>
  /** Surfaces currently refracting. */
  lenses: number
  /** The exclusion selector is invalid and is being ignored. */
  invalidExclude: boolean
  scans: ScanStats
}

function emptySurfaceCounts(): Record<SurfaceKind, number> {
  return Object.fromEntries(SURFACE_KINDS.map(kind => [kind, 0])) as Record<SurfaceKind, number>
}

/**
 * Validate a selector list against a document.
 * @param doc - document whose selector engine is used.
 * @param selector - user input.
 * @returns the trimmed selector, '' for none, or undefined when invalid.
 */
export function validSelector(doc: Document, selector: string): string | undefined {
  const value = selector.trim()
  if (value === '') return ''
  try {
    doc.createDocumentFragment().querySelector(value)
    return value
  } catch {
    return undefined
  }
}

/** A window with its constructors (`MutationObserver`, `Element`, …). */
export type PageWindow = Window & typeof globalThis

/**
 * Backdrop blur radius in CSS pixels.
 * Reduced transparency removes it. Increased contrast still uses at least 0.85 of the tint range.
 * @param tintPercent - glass tint, 0–100.
 * @param reducedTransparency - `prefers-reduced-transparency: reduce`.
 * @param increasedContrast - `prefers-contrast: more`.
 * @returns the radius. `0` when reduced transparency is on, even if contrast is increased.
 */
export function blurRadiusPx(tintPercent: number, reducedTransparency: boolean, increasedContrast: boolean): number {
  if (reducedTransparency) return 0
  const tint = tintPercent / 100
  return 6 + Math.max(tint, increasedContrast ? 0.85 : 0) * 22
}

/** Discovers surfaces and keeps the page's glass in step with the settings. */
export class GlassEngine {
  private readonly win: PageWindow
  private readonly doc: Document
  private readonly env: Environment
  private readonly onChange: (() => void) | undefined
  private settings: GlassSettings | undefined
  private running = false
  private idle: Diagnostics['idle'] = 'disabled'

  private readonly probes: Probes
  private readonly sheet: DynamicSheet
  private readonly exclusions: Exclusions
  private readonly lenses: Lenses
  private readonly highlights: Highlights
  private readonly wallpaper: Wallpaper
  private ownSheet: HTMLStyleElement | undefined

  private menuFilterDirty = false
  private signatures: Signatures | undefined
  private readonly expected = new Map<string, string>()
  private missing: FillKey[] = []
  private ambiguous: FillKey[] = []

  private readonly tagged = new Map<Element, Tagged>()
  private readonly echoes = new Set<Element>()
  private readonly roots = new Set<Element>()
  private readonly singles = new Set<Element>()
  /** Keep existing glass until its replacement can be read and committed in one frame. */
  private readonly invalidated = new Set<Element>()
  /** Independent surface families; retain their old glass until each family can be replaced. */
  private reclassifications: Element[][] = []
  /** Elements whose marks were just removed; they are classified again in the next frame. */
  private readonly requeue: Element[] = []
  private walkers: { root: Element; walker: TreeWalker; started: boolean }[] = []
  private frame = 0
  private paletteDirty = false
  private exclusionsDirty = false
  private exclude = ''
  private invalidExclude = false
  private readonly stats: ScanStats = { batches: 0, inspected: 0, longestMs: 0, totalMs: 0 }

  private subtree: MutationObserver | undefined
  private bodyWatch: MutationObserver | undefined
  private rootWatch: MutationObserver | undefined
  private headWatch: MutationObserver | undefined
  private stopEnvironment: (() => void) | undefined
  private disposed = false
  private adjusting = false

  /**
   * @param win - window of the page.
   * @param env - capabilities and user preferences.
   * @param onChange - called (at most once per frame) after the surface set or diagnostics change.
   */
  constructor(win: PageWindow, env: Environment, onChange?: () => void) {
    this.win = win
    this.doc = win.document
    this.env = env
    this.onChange = onChange
    this.probes = new Probes(this.doc)
    this.sheet = new DynamicSheet(this.doc)
    this.exclusions = new Exclusions(this.doc, this.sheet)
    this.lenses = new Lenses(this.doc, this.sheet)
    this.highlights = new Highlights(this.doc)
    this.wallpaper = new Wallpaper(this.doc)
    // Preferences must remain observable while high contrast suspends rendering.
    this.stopEnvironment = this.env.onChange(() => {
      if (this.settings) {
        this.apply(this.settings)
        this.applyPresentation()
      }
      this.paletteChanged()
    })
  }

  /** Whether the material is currently applied. */
  get active(): boolean {
    return this.running
  }

  /**
   * Apply settings: start, update or stop as needed. Safe to call repeatedly.
   * @param settings - complete, validated settings.
   */
  apply(settings: GlassSettings): void {
    if (this.disposed) return
    const previous = this.settings
    this.settings = settings
    if (!settings.enabled || this.env.forcedColors()) {
      this.idle = settings.enabled ? 'forced-colors' : 'disabled'
      this.stop()
      return
    }
    if (!this.running) {
      this.start()
      return
    }
    const root = this.doc.documentElement
    if (previous?.sidebar !== settings.sidebar) root.setAttribute(ATTR_SIDEBAR, settings.sidebar)
    if (previous?.inlineCodeOpacity !== settings.inlineCodeOpacity)
      root.style.setProperty(VAR_INLINE_OPACITY, String(settings.inlineCodeOpacity / 100))
    if (previous?.tint !== settings.tint) {
      root.style.setProperty(VAR_TINT, String(settings.tint / 100))
      this.expected.clear()
      if (!this.adjusting) this.lenses.setBlur(this.blurPx())
      // New or re-enabled menus are recognized by the blur derived from tint.
      this.menuFilterDirty = true
    }
    if (previous?.exclude !== settings.exclude) this.updateExclude(true)
    if (previous?.codeBlocks !== settings.codeBlocks) this.updateCodeBlocks()
    // Density only changes fills and blur; it cannot change the lens geometry,
    // wallpaper or highlight eligibility. Keep every input synchronous without
    // forcing a layout read for unchanged presentation.
    if (
      previous?.sidebar !== settings.sidebar ||
      previous.refraction !== settings.refraction ||
      previous.highlights !== settings.highlights ||
      previous.wallpaper !== settings.wallpaper ||
      previous.wallpaperUrl !== settings.wallpaperUrl
    )
      this.applyPresentation()
  }

  private start(): void {
    const settings = this.settings
    // `document.body` is typed non-null but is null until the parser reaches it.
    if (!settings || !(this.doc.body as HTMLElement | null)) return
    this.running = true
    this.idle = undefined
    this.ensureStylesheet()
    const root = this.doc.documentElement
    root.setAttribute(ATTR_ROOT, 'on')
    if (this.adjusting) root.setAttribute(ATTR_ADJUSTING, '')
    root.setAttribute(ATTR_SIDEBAR, settings.sidebar)
    root.style.setProperty(VAR_TINT, String(settings.tint / 100))
    root.style.setProperty(VAR_INLINE_OPACITY, String(settings.inlineCodeOpacity / 100))
    this.lenses.setBlur(this.blurPx())
    this.updateExclude(false)
    this.refreshExclusions()
    this.refreshPalette()
    this.applyPresentation()

    this.subtree = new this.win.MutationObserver(records => this.mutated(records))
    this.subtree.observe(this.doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    })
    this.bodyWatch = new this.win.MutationObserver(() => this.paletteChanged())
    this.bodyWatch.observe(this.doc.body, { attributes: true, attributeFilter: [DARK_ATTRIBUTE, 'style', 'class'] })
    this.rootWatch = new this.win.MutationObserver(() => this.applyPresentation())
    this.rootWatch.observe(root, { attributes: true, attributeFilter: [PLATFORM_ATTRIBUTE] })
    // DSH and its plugins install their stylesheets as they load, possibly after this
    // plugin; any stylesheet change may define or redefine tokens.
    this.headWatch = new this.win.MutationObserver(records => {
      if (records.some(record => !this.ownRecord(record))) this.paletteChanged()
    })
    this.headWatch.observe(this.doc.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'media', 'disabled'],
    })
    this.win.addEventListener('resize', this.resized, { passive: true })
    this.doc.addEventListener('load', this.loaded, true)
    this.doc.addEventListener('transitionend', this.settled, true)
    this.doc.addEventListener('animationend', this.settled, true)

    this.roots.add(this.doc.body)
    this.schedule()
  }

  /** Remove every trace of the plugin from the page. Safe to call when not running. */
  stop(): void {
    const wasRunning = this.running
    this.running = false
    if (this.frame !== 0) this.win.cancelAnimationFrame(this.frame)
    this.frame = 0
    this.subtree?.disconnect()
    this.bodyWatch?.disconnect()
    this.rootWatch?.disconnect()
    this.headWatch?.disconnect()
    this.subtree = this.bodyWatch = this.rootWatch = this.headWatch = undefined
    this.doc.removeEventListener('load', this.loaded, true)
    this.doc.removeEventListener('transitionend', this.settled, true)
    this.doc.removeEventListener('animationend', this.settled, true)
    this.win.removeEventListener('resize', this.resized)
    this.roots.clear()
    this.singles.clear()
    this.invalidated.clear()
    this.reclassifications = []
    this.exclusionsDirty = false
    this.walkers = []
    this.requeue.length = 0

    this.lenses.dispose()
    this.highlights.dispose()
    this.wallpaper.dispose()
    this.exclusions.dispose()
    this.sheet.dispose()
    this.probes.dispose()
    this.ownSheet?.remove()
    this.ownSheet = undefined
    for (const element of [...this.tagged.keys()]) this.untag(element)
    for (const element of this.echoes) element.removeAttribute(ATTR_ECHO)
    this.echoes.clear()
    this.signatures = undefined
    this.expected.clear()

    const root = this.doc.documentElement
    root.removeAttribute(ATTR_ROOT)
    root.removeAttribute(ATTR_ADJUSTING)
    root.removeAttribute(ATTR_SIDEBAR)
    root.style.removeProperty(VAR_TINT)
    root.style.removeProperty(VAR_INLINE_OPACITY)
    // Sweep: also clears marks on elements that were detached while tagged and later re-attached.
    for (const element of this.doc.querySelectorAll(FOOTPRINT_SELECTOR)) {
      if (element.hasAttribute(ATTR_OWNED)) {
        element.remove()
        continue
      }
      for (const name of [...element.getAttributeNames()]) {
        if (name.startsWith('data-glassui') && name !== ATTR_IGNORE && name !== ATTR_MATERIAL)
          element.removeAttribute(name)
      }
    }
    if (wasRunning) this.changed()
  }

  /** Release the engine permanently, including observers retained while paused. */
  dispose(): void {
    this.disposed = true
    this.stopEnvironment?.()
    this.stopEnvironment = undefined
    this.stop()
    if (this.notifyFrame !== 0) this.win.cancelAnimationFrame(this.notifyFrame)
    this.notifyFrame = 0
  }

  /** @returns a snapshot of the engine's state. */
  diagnostics(): Diagnostics {
    const surfaces = emptySurfaceCounts()
    for (const [element, entry] of this.tagged) if (!entry.flat && element.isConnected) surfaces[entry.kind]++
    return {
      running: this.running,
      idle: this.running ? undefined : this.idle,
      environment: {
        refraction: this.env.refraction,
        finePointer: this.env.finePointer(),
        reducedTransparency: this.env.reducedTransparency(),
        reducedMotion: this.env.reducedMotion(),
      },
      missingTokens: [...this.missing],
      ambiguousTokens: [...this.ambiguous],
      surfaces,
      lenses: this.lenses.active,
      invalidExclude: this.invalidExclude,
      scans: { ...this.stats },
    }
  }

  // ---- presentation ------------------------------------------------------

  private blurPx(): number {
    return blurRadiusPx(this.settings?.tint ?? 35, this.env.reducedTransparency(), this.env.increasedContrast())
  }

  private scheme(): 'light' | 'dark' {
    return this.doc.body.hasAttribute(DARK_ATTRIBUTE) ? 'dark' : 'light'
  }

  private applyPresentation(): void {
    const settings = this.settings
    if (!this.running || !settings) return
    if (!this.adjusting) this.lenses.setBlur(this.blurPx())
    const darwin = this.doc.documentElement.getAttribute(PLATFORM_ATTRIBUTE) === 'darwin'
    this.wallpaper.apply(settings, this.scheme(), darwin, !this.env.reducedMotion())
    this.highlights.setEnabled(
      settings.highlights &&
        !this.adjusting &&
        this.env.finePointer() &&
        !this.env.reducedMotion() &&
        !this.env.reducedTransparency(),
    )
    this.lenses.setEnabled(settings.refraction && this.env.refraction && !this.env.reducedTransparency())
    this.syncLenses()
  }

  /** Drag with plain blur; SVG filter parameters and highlights settle once on release. */
  setAdjusting(on: boolean): void {
    if (this.disposed || this.adjusting === on) return
    this.adjusting = on
    if (!this.running) return
    this.doc.documentElement.toggleAttribute(ATTR_ADJUSTING, on)
    this.applyPresentation()
  }

  private ensureStylesheet(): void {
    for (const style of this.doc.querySelectorAll('style')) {
      if (style.textContent.startsWith(STYLESHEET_MARKER)) return
    }
    const style = this.doc.createElement('style')
    style.setAttribute(ATTR_OWNED, 'stylesheet')
    style.textContent = buildStylesheet()
    this.doc.head.append(style)
    this.ownSheet = style
  }

  /** Code fills switch between watched (glass) and reserved (solid): re-read and rescan. */
  private updateCodeBlocks(): void {
    if (this.settings?.codeBlocks !== 'glass') {
      for (const [element, entry] of [...this.tagged]) if (entry.kind === 'code') this.untag(element)
      this.syncLenses()
      this.changed()
    }
    this.paletteChanged()
  }

  private codeGlass(): boolean {
    return this.settings?.codeBlocks === 'glass'
  }

  /** Watched fills under the current settings. */
  private watchedFills(): FillKey[] {
    return this.codeGlass() ? [...FILL_KEYS] : FILL_KEYS.filter(fill => !CODE_FILLS.has(fill))
  }

  private updateExclude(rescan: boolean): void {
    const selector = validSelector(this.doc, this.settings?.exclude ?? '')
    this.invalidExclude = selector === undefined
    const next = selector ?? ''
    if (next === this.exclude) return
    this.exclude = next
    if (!rescan) return
    this.refreshExclusions()
    if (next !== '') {
      for (const element of [...this.tagged.keys()]) if (element.closest(next)) this.untag(element)
      for (const element of this.echoes) {
        if (element.closest(next)) {
          element.removeAttribute(ATTR_ECHO)
          this.echoes.delete(element)
        }
      }
    }
    this.syncLenses()
    this.changed()
    this.roots.add(this.doc.body)
    this.schedule()
  }

  // ---- palette -----------------------------------------------------------

  private refreshExclusions(): void {
    for (const element of this.exclusions.sync(this.exclude, [...this.invalidated])) {
      this.invalidated.add(element)
      this.roots.add(element)
    }
  }

  /** Media queries can change geometry, fills and elevation without DOM mutations. */
  private readonly resized = (): void => this.paletteChanged()

  private paletteChanged(): void {
    if (!this.running) return
    this.paletteDirty = true
    this.invalidated.add(this.doc.body)
    this.roots.add(this.doc.body)
    this.schedule()
  }

  /**
   * Read DSH's token values, nudge the watched fills apart, and derive the
   * signatures for the current palette.
   */
  private refreshPalette(): void {
    const raw = this.probes.raw()
    const watched = this.watchedFills()
    // With solid code blocks, the code fills are reserved like any other content fill.
    const reserved = [
      ...raw.reserved,
      ...FILL_KEYS.filter(fill => !watched.includes(fill)).map(fill => raw.watched.get(fill) ?? UNSET),
    ]
    const parsed = (value: string): Rgba | undefined => (value === UNSET ? undefined : parseColor(value))
    const nudged = nudgeApart(
      watched.map(fill => [fill, parsed(raw.watched.get(fill) ?? UNSET)] as const),
      reserved.map(parsed).filter((value): value is Rgba => value !== undefined),
    )
    this.sheet.setNudges(nudgeRules(nudged, this.scheme() === 'dark'))

    // Inline theme overrides can defeat a nudge. Compare the final computed
    // values against reserved fills too, so ordinary content never becomes glass.
    const reservedColors = new Set(
      [...RESERVED_TOKENS, ...FILL_KEYS.filter(fill => !watched.includes(fill)).map(fill => FILL_TOKENS[fill])].map(
        token => this.probes.color(token),
      ),
    )

    const fills = new Map<string, FillKey>()
    const seen = new Map<string, FillKey[]>()
    this.missing = []
    for (const fill of watched) {
      if (raw.watched.get(fill) === UNSET) {
        this.missing.push(fill)
        continue
      }
      const value = this.probes.color(FILL_TOKENS[fill])
      seen.set(value, [...(seen.get(value) ?? []), fill])
    }
    this.ambiguous = []
    for (const [value, keys] of seen) {
      const [only] = keys
      if (keys.length === 1 && only !== undefined && !reservedColors.has(value)) fills.set(value, only)
      else this.ambiguous.push(...keys)
    }
    this.menuFilterDirty = false
    this.signatures = { fills, elevation: this.probes.elevation(), menuFilter: this.probes.menuFilter() }
    this.expected.clear()
  }

  private readonly loaded = (event: Event): void => {
    if (event.target instanceof this.win.HTMLLinkElement) this.paletteChanged()
  }

  private ownedNode(node: Node): boolean {
    const element = node instanceof this.win.Element ? node : node.parentElement
    return element !== null && element.closest(`[${ATTR_OWNED}]`) !== null
  }

  /** Whether a mutation only concerns the plugin's own elements. */
  private ownRecord(record: MutationRecord): boolean {
    if (this.ownedNode(record.target)) return true
    if (record.type !== 'childList') return false
    const nodes = [...record.addedNodes, ...record.removedNodes]
    return nodes.length > 0 && nodes.every(node => node instanceof this.win.Element && node.hasAttribute(ATTR_OWNED))
  }

  // ---- scanning ----------------------------------------------------------

  private readonly settled = (event: Event): void => {
    const target = event.target
    if (this.running && target instanceof this.win.Element && CANDIDATE_TAGS.has(target.tagName)) {
      this.singles.add(target)
      this.schedule()
    }
  }

  private mutated(records: MutationRecord[]): void {
    let removed = false
    for (const record of records) {
      if (this.ownRecord(record)) continue
      if (record.type === 'attributes') {
        if (!(record.target instanceof this.win.Element)) continue
        const attribute = record.attributeName ?? ''
        if (attribute.startsWith('data-glassui-') && attribute !== ATTR_IGNORE && attribute !== ATTR_MATERIAL) continue
        if (
          attribute !== 'class' &&
          attribute !== 'style' &&
          attribute !== ATTR_IGNORE &&
          attribute !== ATTR_MATERIAL &&
          attribute !== 'contenteditable' &&
          this.exclude === ''
        )
          continue
        if (record.attributeName === 'style' && this.onlyOwnStyleChanged(record)) continue
        this.exclusionsDirty = true
        // An ancestor can change descendants' fills, exclusions or stacking.
        this.invalidated.add(record.target)
        this.roots.add(record.target)
        continue
      }
      this.exclusionsDirty = true
      for (const node of record.addedNodes) {
        if (node instanceof this.win.Element && !node.hasAttribute(ATTR_OWNED)) {
          this.invalidated.add(node)
          this.roots.add(node)
        }
      }
      if (record.removedNodes.length > 0) removed = true
    }
    if (removed) this.prune()
    if (this.exclusionsDirty || this.roots.size > 0 || this.singles.size > 0) this.schedule()
  }

  private oldStyle: CSSStyleDeclaration | undefined
  private newStyle: CSSStyleDeclaration | undefined

  private docStyle(): CSSStyleDeclaration {
    return this.win.document.createElement('div').style
  }

  private onlyOwnStyleChanged(record: MutationRecord): boolean {
    this.oldStyle ??= this.docStyle()
    this.newStyle ??= this.docStyle()
    const plain = (text: string, style: CSSStyleDeclaration): string => {
      style.cssText = text
      for (const name of [...style]) if (name.startsWith('--glassui-')) style.removeProperty(name)
      return style.cssText
    }
    return (
      plain(record.oldValue ?? '', this.oldStyle) ===
      plain((record.target as Element).getAttribute('style') ?? '', this.newStyle)
    )
  }

  /**
   * Refresh already visible glass before scanning new candidates. A resize drag
   * can change an ancestor's style in every animation frame. Removing its marks
   * in the mutation callback would paint an opaque frame before the next scan.
   * Read and restore each surface family together, including nested fills and
   * echoes. Independent code families can settle across frames without removing
   * their old marks; chrome is prioritized during a resize.
   */
  private reclassify(deadline: number): boolean {
    if (this.invalidated.size > 0) {
      const roots = [...this.invalidated]
      this.invalidated.clear()
      const pending = new Set(this.reclassifications.flat())
      const elements = [...new Set([...this.tagged.keys(), ...this.echoes, ...pending])]
        .filter(element => pending.has(element) || roots.some(root => root.contains(element)))
        .sort((a, b) => (a.compareDocumentPosition(b) & this.win.Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      const families = new Map<Element, Element[]>()
      for (const element of elements) {
        // Refresh all chrome together so viewport-sized backdrops never gain or
        // lose a composited layer between frames. A nested code banner belongs
        // to its outer block; independent blocks can settle in later frames.
        let family: Element = this.doc.body
        for (let parent: Element | null = element; parent; parent = parent.parentElement) {
          if (this.tagged.get(parent)?.kind === 'code') family = parent
        }
        const group = families.get(family) ?? []
        group.push(element)
        families.set(family, group)
      }
      const chrome = families.get(this.doc.body)
      families.delete(this.doc.body)
      const batches: Element[][] = []
      let batch = chrome ?? []
      for (const family of families.values()) {
        if (batch.length >= 64) {
          batches.push(batch)
          batch = []
        }
        batch.push(...family)
      }
      if (batch.length > 0) batches.push(batch)
      this.reclassifications = batches
    }
    let dirty = false
    while (this.reclassifications.length > 0) {
      const elements = this.reclassifications.shift()
      if (elements) dirty = this.reclassifyFamily(elements) || dirty
      if (performance.now() >= deadline) break
    }
    return dirty
  }

  private reclassifyFamily(elements: Element[]): boolean {
    const echoes = new Set(elements.filter(element => this.echoes.has(element)))
    if (elements.length === 0) return false
    for (const element of elements) {
      if (this.tagged.has(element)) this.untag(element, false)
      if (this.echoes.delete(element)) element.removeAttribute(ATTR_ECHO)
    }
    const decisions = elements
      .filter(element => element.isConnected && this.admissible(element))
      .map(element => this.inspect(element))
    for (const decision of decisions) this.commit(decision)
    // Echoes depend on the restored parent's glass color. Resolve them now too,
    // rather than briefly painting a second layer while a later scan catches up.
    const restoredEchoes = decisions.filter(
      ({ element }) => echoes.has(element) && this.isEcho(element, this.win.getComputedStyle(element).backgroundColor),
    )
    for (const { element } of restoredEchoes) {
      this.untag(element, false)
      element.setAttribute(ATTR_ECHO, '')
      this.echoes.add(element)
    }
    this.stats.inspected += decisions.length
    return true
  }

  private schedule(): void {
    if (this.running && this.frame === 0) this.frame = this.win.requestAnimationFrame(this.process)
  }

  private readonly process = (): void => {
    this.frame = 0
    if (!this.running) return
    const started = performance.now()
    const deadline = started + FRAME_BUDGET_MS
    if (this.exclusionsDirty || this.paletteDirty) {
      this.exclusionsDirty = false
      this.refreshExclusions()
    }
    if (this.paletteDirty) {
      this.paletteDirty = false
      this.refreshPalette()
      this.applyPresentation()
    }
    let dirty = this.reclassify(deadline)
    for (const root of this.roots) {
      if (!this.admissible(root)) continue
      // A walk already under way may have passed the new subtree, so only a pending walk can absorb it.
      // Distinct siblings cannot contain one another. Streaming rows commonly
      // share a parent; avoid native ancestry queries for every pair of rows.
      const parent = root.parentNode
      if (
        root.isConnected &&
        !this.walkers.some(
          entry =>
            !entry.started && (entry.root === root || (entry.root.parentNode !== parent && entry.root.contains(root))),
        )
      ) {
        this.walkers = this.walkers.filter(
          entry =>
            entry.started || (entry.root !== root && entry.root.parentNode === parent) || !root.contains(entry.root),
        )
        this.walkers.push({ root, walker: this.walker(root), started: false })
      }
    }
    this.roots.clear()

    const decisions: Decision[] = []
    for (const element of this.singles) {
      if (this.reclassifications.length > 0 || performance.now() >= deadline) break
      this.singles.delete(element)
      if (element.isConnected && CANDIDATE_TAGS.has(element.tagName) && this.admissible(element)) {
        decisions.push(this.inspect(element))
      }
      if ((decisions.length & 63) === 0 && performance.now() > deadline) break
    }
    outer: while (this.reclassifications.length === 0 && this.walkers.length > 0 && performance.now() <= deadline) {
      const entry = this.walkers[0]
      if (!entry) break
      if (!entry.root.isConnected || !this.admissible(entry.root)) {
        this.walkers.shift()
        continue
      }
      if (!entry.started) {
        entry.started = true
        if (CANDIDATE_TAGS.has(entry.root.tagName) && this.admissible(entry.root))
          decisions.push(this.inspect(entry.root))
      }
      for (let node = entry.walker.nextNode(); node; node = entry.walker.nextNode()) {
        decisions.push(this.inspect(node as Element))
        if ((decisions.length & 63) === 0 && performance.now() > deadline) break outer
      }
      this.walkers.shift()
    }

    for (const decision of decisions) dirty = this.commit(decision) || dirty
    for (const element of this.requeue.splice(0)) this.singles.add(element)
    if (dirty) this.syncLenses()

    const elapsed = performance.now() - started
    this.stats.batches++
    this.stats.inspected += decisions.length
    this.stats.totalMs += elapsed
    this.stats.longestMs = Math.max(this.stats.longestMs, elapsed)
    if (dirty) this.changed()
    if (this.walkers.length > 0 || this.roots.size > 0 || this.singles.size > 0 || this.reclassifications.length > 0)
      this.schedule()
  }

  /** Whether an element outside a walk (a single) may be inspected. */
  private admissible(element: Element): boolean {
    if (element.closest(`[${ATTR_OWNED}],[${ATTR_IGNORE}],[contenteditable]`)) return false
    return this.exclude === '' || !element.closest(this.exclude)
  }

  private walker(root: Element): TreeWalker {
    const filter = (node: Node): number => {
      const element = node as Element
      const tag = element.tagName
      // Rendered Markdown never hosts chrome, but it does host code blocks: with glass
      // code blocks, only its <div>s are inspected, as singles.
      if (this.codeGlass() && element.hasAttribute(MARKDOWN_HINT_ATTRIBUTE)) {
        this.singles.add(element)
        for (const block of element.querySelectorAll('div')) this.singles.add(block)
        return NodeFilter.FILTER_REJECT
      }
      if (
        OPAQUE_TAGS.has(tag.toUpperCase()) ||
        element.hasAttribute(ATTR_OWNED) ||
        element.hasAttribute(ATTR_IGNORE) ||
        element.hasAttribute('contenteditable') ||
        element.hasAttribute(MARKDOWN_HINT_ATTRIBUTE) ||
        (this.exclude !== '' && element.matches(this.exclude))
      ) {
        return NodeFilter.FILTER_REJECT
      }
      return CANDIDATE_TAGS.has(tag) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    }
    return this.doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, { acceptNode: filter })
  }

  private inspect(element: Element): Decision {
    const signatures = this.signatures
    const current = this.tagged.get(element)
    if (!signatures) return { element, verdict: undefined, area: 0, untag: false }
    const style = this.win.getComputedStyle(element)
    if (current) {
      // A tagged element shows the glass value; it keeps its marks while it still does.
      const valid =
        current.kind === 'menu'
          ? style.backdropFilter !== 'none'
          : current.fill !== undefined &&
            style.backgroundColor === this.expectedFor(current.kind, current.fill, current.flat)
      if (valid) return { element, verdict: undefined, area: current.area, untag: false }
      this.requeue.push(element)
      return { element, verdict: undefined, area: 0, untag: true }
    }
    const background = style.backgroundColor
    const backdropFilter = style.backdropFilter
    if (this.menuFilterDirty && backdropFilter !== 'none' && !signatures.fills.has(background)) {
      signatures.menuFilter = this.probes.menuFilter()
      this.menuFilterDirty = false
    }
    if (!signatures.fills.has(background) && (backdropFilter === 'none' || backdropFilter !== signatures.menuFilter)) {
      return {
        element,
        verdict: undefined,
        area: 0,
        untag: false,
        echo: this.echoes.has(element) || this.isEcho(element, background),
      }
    }
    const rect = element.getBoundingClientRect()
    const viewport = Math.max(1, this.win.innerWidth * this.win.innerHeight)
    const sample: ElementSample = {
      background,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      backdropFilter,
      area: (rect.width * rect.height) / viewport,
      width: rect.width,
      managed: element.hasAttribute(ATTR_MATERIAL),
    }
    return { element, verdict: classify(sample, signatures), area: sample.area, untag: false }
  }

  /**
   * Whether an untagged element repaints the glass of the surface around it, as a
   * component part that inherits its parent's fill through a variable of its own.
   */
  private isEcho(element: Element, background: string): boolean {
    const color = parseColor(background)
    if (!color || color.a === 0 || color.a >= 1) return false
    const outer = element.parentElement?.closest(`[${ATTR_SURFACE}]:not([${ATTR_FLAT}])`)
    const entry = outer ? this.tagged.get(outer) : undefined
    if (!entry || entry.kind === 'backdrop' || entry.kind === 'menu' || entry.fill === undefined) return false
    return background === this.expectedFor(entry.kind, entry.fill, false)
  }

  private expectedFor(kind: SurfaceKind, fill: FillKey, flat: boolean): string {
    const key = `${kind}|${fill}|${flat}`
    let value = this.expected.get(key)
    if (value === undefined) {
      value = this.probes.tagged(kind, fill, flat)
      this.expected.set(key, value)
    }
    return value
  }

  /** @returns whether the surface set changed. */
  private commit(decision: Decision): boolean {
    const { element, verdict } = decision
    if (decision.untag) {
      this.untag(element)
      return true
    }
    if (decision.echo && !this.echoes.has(element)) {
      element.setAttribute(ATTR_ECHO, '')
      this.echoes.add(element)
      return false
    }
    if (!verdict || this.tagged.has(element) || !element.isConnected) return false
    let flat = false
    if (verdict.fill !== undefined && STACKING_KINDS.has(verdict.kind)) {
      // A code block's banner sits inside the block: one family, one layer of glass.
      const family = verdict.kind === 'code' ? `[${ATTR_SURFACE}="code"]` : `[${ATTR_FILL}="${verdict.fill}"]`
      const outer = element.parentElement?.closest(`${family}:not([${ATTR_FLAT}])`)
      flat = outer !== null && outer !== undefined && this.tagged.get(outer)?.kind !== 'backdrop'
    }
    element.setAttribute(ATTR_SURFACE, verdict.kind)
    if (verdict.fill !== undefined) element.setAttribute(ATTR_FILL, verdict.fill)
    if (flat) element.setAttribute(ATTR_FLAT, '')
    if (verdict.paint && !flat) element.setAttribute(ATTR_PAINT, '')
    if (verdict.float && !flat) element.setAttribute(ATTR_FLOAT, '')
    this.tagged.set(element, { kind: verdict.kind, fill: verdict.fill, flat, area: decision.area })
    // A nested surface may paint its parent's fill through a variable of its own
    // component, which the flat rule cannot clear; look again once styles apply.
    if (flat) this.requeue.push(element)
    return true
  }

  private untag(element: Element, sweepEchoes = true): void {
    for (const name of [ATTR_SURFACE, ATTR_FILL, ATTR_FLAT, ATTR_PAINT, ATTR_FLOAT]) element.removeAttribute(name)
    this.tagged.delete(element)
    if (!sweepEchoes) return
    // Parts that echoed this surface paint their own color again.
    for (const echo of this.echoes) {
      if (element.contains(echo)) {
        echo.removeAttribute(ATTR_ECHO)
        this.echoes.delete(echo)
      }
    }
  }

  private prune(): void {
    for (const echo of this.echoes) {
      if (!echo.isConnected) {
        echo.removeAttribute(ATTR_ECHO)
        this.echoes.delete(echo)
      }
    }
    let pruned = false
    for (const element of this.tagged.keys()) {
      if (!element.isConnected) {
        this.untag(element)
        pruned = true
      }
    }
    if (pruned) {
      this.syncLenses()
      this.changed()
    }
  }

  private syncLenses(): void {
    const targets: LensTarget[] = []
    for (const [element, entry] of this.tagged) {
      if (!entry.flat && element.isConnected) targets.push({ element, kind: entry.kind, area: entry.area })
    }
    this.lenses.sync(targets)
  }

  private notifyFrame = 0

  private changed(): void {
    if (this.disposed || !this.onChange || this.notifyFrame !== 0) return
    this.notifyFrame = this.win.requestAnimationFrame(() => {
      this.notifyFrame = 0
      this.onChange?.()
    })
  }
}
