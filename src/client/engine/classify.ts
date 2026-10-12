/**
 * Surface classification: a pure function from what an element looks like to
 * what it is. Inputs are computed styles, never class names, so the decision
 * follows DSH's token contract instead of its markup.
 */
import type { SurfaceKind } from '../../shared/dom.ts'
import type { ElevationTier, FillKey } from '../../shared/tokens.ts'

/** Computed facts about one element. */
export interface ElementSample {
  /** Computed `background-color`. */
  background: string
  /** Computed `background-image`. */
  backgroundImage: string
  /** Computed `box-shadow`. */
  boxShadow: string
  /** Computed `backdrop-filter`. */
  backdropFilter: string
  /** Border-box area as a fraction of the viewport area. */
  area: number
  /** Border-box width in CSS pixels. */
  width: number
  /** The element's owner styles it through the public material attribute. */
  managed: boolean
}

/** What the engine knows about the current palette. */
export interface Signatures {
  /** Computed color of each watched fill whose value is unique, keyed by that color. */
  fills: ReadonlyMap<string, FillKey>
  /** Computed color of each elevation sentinel. */
  elevation: Readonly<Record<ElevationTier, string>>
  /** Computed `backdrop-filter` produced by DSH's menu material token. */
  menuFilter: string
}

/** The verdict for one element. */
export interface Classification {
  kind: SurfaceKind
  /** Watched fill the element paints with, when there is one. */
  fill: FillKey | undefined
  /** No background image of its own, so a highlight layer may be painted. */
  paint: boolean
  /** A sidebar wide enough, and plain enough, to float as an inset pane. */
  float: boolean
}

/** Fills used by floating panels, dialogs and buttons. */
const PANEL_FILLS: ReadonlySet<FillKey> = new Set([
  'layer1',
  'layer2',
  'layer3',
  'floating',
  'elevated',
  'overlay',
  'base',
])

/** Above this share of the viewport a surface is a layout pane: it is made transparent instead of glass. */
export const PANE_AREA = 0.5
/** A base-filled element at least this large is a layout pane. */
export const BACKDROP_AREA = 0.25
/** Narrower sidebars are icon rails and keep their docked geometry. */
export const MIN_FLOAT_WIDTH = 160

/**
 * Which elevation tier, if any, the computed shadow carries.
 * @param boxShadow - computed `box-shadow`.
 * @param elevation - computed sentinel colors.
 * @returns the tier.
 */
export function elevationOf(
  boxShadow: string,
  elevation: Readonly<Record<ElevationTier, string>>,
): ElevationTier | undefined {
  if (boxShadow === 'none') return undefined
  for (const tier of ['prominent', 'panel', 'soft'] as const) {
    if (elevation[tier] !== '' && boxShadow.includes(elevation[tier])) return tier
  }
  return undefined
}

function surface(kind: SurfaceKind, fill: FillKey | undefined, sample: ElementSample, float = false): Classification {
  return { kind, fill, paint: kind !== 'backdrop' && sample.backgroundImage === 'none', float }
}

/**
 * Decide what an element is.
 * @param sample - computed facts about the element.
 * @param signatures - the current palette's signatures.
 * @returns the classification, or undefined when the element is not a surface.
 */
export function classify(sample: ElementSample, signatures: Signatures): Classification | undefined {
  if (sample.managed) return undefined
  const fill = signatures.fills.get(sample.background)
  const tier = elevationOf(sample.boxShadow, signatures.elevation)
  const pane = sample.area > PANE_AREA

  if (sample.backdropFilter !== 'none' && sample.backdropFilter === signatures.menuFilter) {
    return pane ? undefined : surface('menu', undefined, sample)
  }
  switch (fill) {
    case 'sidebar':
      if (pane) return surface('backdrop', fill, sample)
      return surface(
        'sidebar',
        fill,
        sample,
        sample.width >= MIN_FLOAT_WIDTH && sample.boxShadow === 'none' && sample.backgroundImage === 'none',
      )
    case 'input':
      return surface(pane ? 'backdrop' : 'composer', fill, sample)
    case 'toast':
    case 'tooltip':
      return pane ? undefined : surface('smoke', fill, sample)
    case undefined:
      return undefined
    default:
      break
  }
  if (PANEL_FILLS.has(fill) && (tier === 'panel' || tier === 'prominent')) {
    return pane ? undefined : surface('panel', fill, sample)
  }
  if (fill === 'base' && tier === undefined && sample.area >= BACKDROP_AREA) return surface('backdrop', fill, sample)
  return undefined
}
