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
  type FillKey,
} from '../../shared/tokens.ts'
import { classify, type Classification, type ElementSample, type Signatures } from './classify.ts'
import type { Environment } from './environment.ts'
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
  private readonly lenses: Lenses
  private readonly highlights: Highlights
  private readonly wallpaper: Wallpaper
  private ownSheet: HTMLStyleElement | undefined

  private signatures: Signatures | undefined
  private rawKey = ''
  private readonly expected = new Map<string, string>()
  private missing: FillKey[] = []
  private ambiguous: FillKey[] = []

  private readonly tagged = new Map<Element, Tagged>()
  private readonly echoes = new Set<Element>()
  private readonly roots = new Set<Element>()
  private readonly singles = new Set<Element>()
  /** Elements whose marks were just removed; they are classified again in the next frame. */
  private readonly requeue: Element[] = []
  private walkers: { root: Element; walker: TreeWalker; started: boolean }[] = []
  private frame = 0
  private paletteDirty = false
  private exclude = ''
  private invalidExclude = false
  private readonly stats: ScanStats = { batches: 0, inspected: 0, longestMs: 0, totalMs: 0 }

  private subtree: MutationObserver | undefined
  private bodyWatch: MutationObserver | undefined
  private rootWatch: MutationObserver | undefined
  private headWatch: MutationObserver | undefined
  private stopEnvironment: (() => void) | undefined

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
    this.lenses = new Lenses(this.doc, this.sheet)
    this.highlights = new Highlights(this.doc)
    this.wallpaper = new Wallpaper(this.doc)
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
    root.setAttribute(ATTR_SIDEBAR, settings.sidebar)
    if (previous?.tint !== settings.tint) {
      root.style.setProperty(VAR_TINT, String(settings.tint / 100))
      this.expected.clear()
      this.lenses.setBlur(this.blurPx())
    }
    if (previous?.exclude !== settings.exclude) this.updateExclude(true)
    if (previous?.codeBlocks !== settings.codeBlocks) this.updateCodeBlocks()
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
    root.setAttribute(ATTR_SIDEBAR, settings.sidebar)
    root.style.setProperty(VAR_TINT, String(settings.tint / 100))
    this.lenses.setBlur(this.blurPx())
    this.updateExclude(false)
    this.refreshPalette()
    this.applyPresentation()

    this.subtree = new this.win.MutationObserver(records => this.mutated(records))
    this.subtree.observe(this.doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
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
    this.headWatch.observe(this.doc.head, { childList: true, subtree: true, characterData: true })
    this.doc.addEventListener('load', this.loaded, true)
    this.stopEnvironment = this.env.onChange(() => {
      if (this.settings) this.apply(this.settings)
      this.paletteChanged()
    })
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
    this.stopEnvironment?.()
    this.stopEnvironment = undefined
    this.doc.removeEventListener('transitionend', this.settled, true)
    this.doc.removeEventListener('animationend', this.settled, true)
    this.roots.clear()
    this.singles.clear()
    this.walkers = []

    this.lenses.dispose()
    this.highlights.dispose()
    this.wallpaper.dispose()
    this.sheet.dispose()
    this.probes.dispose()
    this.ownSheet?.remove()
    this.ownSheet = undefined
    this.tagged.clear()
    this.echoes.clear()
    this.signatures = undefined
    this.rawKey = ''
    this.expected.clear()

    const root = this.doc.documentElement
    root.removeAttribute(ATTR_ROOT)
    root.removeAttribute(ATTR_SIDEBAR)
    root.style.removeProperty(VAR_TINT)
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
    const tint = (this.settings?.tint ?? 35) / 100
    return 6 + Math.max(tint, this.env.reducedTransparency() ? 1 : 0) * 22
  }

  private scheme(): 'light' | 'dark' {
    return this.doc.body.hasAttribute(DARK_ATTRIBUTE) ? 'dark' : 'light'
  }

  private applyPresentation(): void {
    const settings = this.settings
    if (!this.running || !settings) return
    const darwin = this.doc.documentElement.getAttribute(PLATFORM_ATTRIBUTE) === 'darwin'
    this.wallpaper.apply(settings, this.scheme(), darwin, !this.env.reducedMotion())
    this.highlights.setEnabled(
      settings.highlights && this.env.finePointer() && !this.env.reducedMotion() && !this.env.reducedTransparency(),
    )
    this.lenses.setEnabled(settings.refraction && this.env.refraction && !this.env.reducedTransparency())
    this.syncLenses()
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
    this.rawKey = ''
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
    if (next !== '') {
      for (const element of [...this.tagged.keys()]) if (element.closest(next)) this.untag(element)
    }
    this.roots.add(this.doc.body)
    this.schedule()
  }

  // ---- palette -----------------------------------------------------------

  private paletteChanged(): void {
    if (!this.running) return
    this.paletteDirty = true
    this.schedule()
  }

  /**
   * Read DSH's token values, nudge the watched fills apart, and derive the
   * signatures for the current palette.
   * @returns whether DSH's values changed since the last read.
   */
  private refreshPalette(): boolean {
    const raw = this.probes.raw()
    const watched = this.watchedFills()
    // With solid code blocks, the code fills are reserved like any other content fill.
    const reserved = [
      ...raw.reserved,
      ...FILL_KEYS.filter(fill => !watched.includes(fill)).map(fill => raw.watched.get(fill) ?? UNSET),
    ]
    const key = [...raw.watched.values(), ...raw.reserved, watched.length].join('|') + this.scheme()
    const changed = key !== this.rawKey
    this.rawKey = key
    const parsed = (value: string): Rgba | undefined => (value === UNSET ? undefined : parseColor(value))
    const nudged = nudgeApart(
      watched.map(fill => [fill, parsed(raw.watched.get(fill) ?? UNSET)] as const),
      reserved.map(parsed).filter((value): value is Rgba => value !== undefined),
    )
    this.sheet.setNudges(nudgeRules(nudged, this.scheme() === 'dark'))

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
      if (keys.length === 1 && only !== undefined) fills.set(value, only)
      else this.ambiguous.push(...keys)
    }
    this.signatures = { fills, elevation: this.probes.elevation(), menuFilter: this.probes.menuFilter() }
    this.expected.clear()
    return changed
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
      if (record.type === 'attributes') {
        if (record.target instanceof this.win.Element) this.singles.add(record.target)
        continue
      }
      for (const node of record.addedNodes) {
        if (node instanceof this.win.Element && !node.hasAttribute(ATTR_OWNED)) this.roots.add(node)
      }
      if (record.removedNodes.length > 0) removed = true
    }
    if (removed) this.prune()
    this.schedule()
  }

  private schedule(): void {
    if (this.running && this.frame === 0) this.frame = this.win.requestAnimationFrame(this.process)
  }

  private readonly process = (): void => {
    this.frame = 0
    if (!this.running) return
    const started = performance.now()
    if (this.paletteDirty) {
      this.paletteDirty = false
      const changed = this.refreshPalette()
      this.applyPresentation()
      if (changed) this.roots.add(this.doc.body)
      else for (const element of this.tagged.keys()) this.singles.add(element)
    }
    for (const root of this.roots) {
      // A walk already under way may have passed the new subtree, so only a pending walk can absorb it.
      if (root.isConnected && !this.walkers.some(entry => !entry.started && entry.root.contains(root))) {
        this.walkers = this.walkers.filter(entry => entry.started || !root.contains(entry.root))
        this.walkers.push({ root, walker: this.walker(root), started: false })
      }
    }
    this.roots.clear()

    const deadline = started + FRAME_BUDGET_MS
    const decisions: Decision[] = []
    for (const element of this.singles) {
      if (element.isConnected && CANDIDATE_TAGS.has(element.tagName) && this.admissible(element)) {
        decisions.push(this.inspect(element))
      }
    }
    this.singles.clear()
    outer: while (this.walkers.length > 0) {
      const entry = this.walkers[0]
      if (!entry) break
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

    let dirty = false
    for (const decision of decisions) dirty = this.commit(decision) || dirty
    for (const element of this.requeue.splice(0)) this.singles.add(element)
    if (dirty) this.syncLenses()

    const elapsed = performance.now() - started
    this.stats.batches++
    this.stats.inspected += decisions.length
    this.stats.totalMs += elapsed
    this.stats.longestMs = Math.max(this.stats.longestMs, elapsed)
    if (dirty) this.changed()
    if (this.walkers.length > 0 || this.roots.size > 0 || this.singles.size > 0) this.schedule()
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

  private untag(element: Element): void {
    for (const name of [ATTR_SURFACE, ATTR_FILL, ATTR_FLAT, ATTR_PAINT, ATTR_FLOAT]) element.removeAttribute(name)
    this.tagged.delete(element)
    // Parts that echoed this surface paint their own color again.
    for (const echo of this.echoes) {
      if (element.contains(echo)) {
        echo.removeAttribute(ATTR_ECHO)
        this.echoes.delete(echo)
      }
    }
  }

  private prune(): void {
    for (const echo of this.echoes) if (!echo.isConnected) this.echoes.delete(echo)
    let pruned = false
    for (const element of this.tagged.keys()) {
      if (!element.isConnected) {
        this.tagged.delete(element)
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
    if (!this.onChange || this.notifyFrame !== 0) return
    this.notifyFrame = this.win.requestAnimationFrame(() => {
      this.notifyFrame = 0
      this.onChange?.()
    })
  }
}
