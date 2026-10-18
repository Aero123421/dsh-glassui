/**
 * DOM names owned by the plugin. Every attribute, custom property and element
 * the plugin adds starts with `glassui`, so its footprint can be found (and
 * proven absent after shutdown) with one selector.
 */

/** On `<html>` while the material is active. */
export const ATTR_ROOT = 'data-glassui'
/** On `<html>`: `floating` or `docked`. */
export const ATTR_SIDEBAR = 'data-glassui-sidebar'
/** On `<html>` while a wallpaper is painted; its value names the wallpaper. */
export const ATTR_WALLPAPER = 'data-glassui-wallpaper'
/** The still wallpaper is cached in a compositor layer while the client runs. */
export const ATTR_STATIC_WALLPAPER = 'data-glassui-static-wallpaper'
/** On `<html>` while pointer highlights are on. */
export const ATTR_HIGHLIGHTS = 'data-glassui-highlights'
/** While a density slider is being dragged; refraction resumes after the final value. */
export const ATTR_ADJUSTING = 'data-glassui-adjusting'
/** On `<body>` for the instant the engine reads DSH's own token values. */
export const ATTR_RAW = 'data-glassui-raw'

/** On a discovered element: its {@link SurfaceKind}. */
export const ATTR_SURFACE = 'data-glassui-surface'
/** On a discovered element: the watched fill token it paints with. */
export const ATTR_FILL = 'data-glassui-fill'
/** On a discovered element nested in a surface of the same fill; it turns transparent instead of stacking glass. */
export const ATTR_FLAT = 'data-glassui-flat'
/**
 * On a descendant of a surface that repaints the surface's own glass color (a
 * component that passes its fill on to a part, such as a code block's header).
 * It turns clear, so the surface stays one layer of glass.
 */
export const ATTR_ECHO = 'data-glassui-echo'
/** On a discovered element that had no background image, so a highlight layer may be painted. */
export const ATTR_PAINT = 'data-glassui-paint'
/** On a discovered sidebar wide enough to float as an inset pane. */
export const ATTR_FLOAT = 'data-glassui-float'
/** On a surface chosen to refract: the id number of its SVG filter. Refracting surfaces get contained shadows. */
export const ATTR_LENS = 'data-glassui-lens'

/** Public opt-out: the element and its descendants are never touched. */
export const ATTR_IGNORE = 'data-glassui-ignore'
/** Internal marker on opt-out roots, used to stop inherited material and global elevation overrides. */
export const ATTR_EXCLUDED = 'data-glassui-excluded'
/** Public opt-in: `regular`, `dense` or `smoke` glass on an element of another plugin. */
export const ATTR_MATERIAL = 'data-glassui-material'
export const MATERIALS = ['regular', 'dense', 'smoke'] as const
export type Material = (typeof MATERIALS)[number]

/** Marks the plugin's own elements: the dynamic stylesheet, the SVG filters and the probes. */
export const ATTR_OWNED = 'data-glassui-owned'

/** Custom properties set on `<html>`. */
export const VAR_TINT = '--glassui-t'
export const VAR_INLINE_OPACITY = '--glassui-inline-opacity'
export const VAR_WALLPAPER = '--glassui-wallpaper'
/**
 * Custom properties set on a discovered surface while pointer highlights are on:
 * the pointer position in the surface's own coordinates. They are registered as
 * non-inherited, so updating them restyles that surface only.
 */
export const VAR_POINTER_X = '--glassui-lx'
export const VAR_POINTER_Y = '--glassui-ly'

/**
 * What a discovered element is.
 * - `sidebar`: the navigation column.
 * - `composer`: the message input card.
 * - `panel`: a floating panel, dialog, popover or floating button.
 * - `menu`: a menu or popover DSH already blurs; only refraction is added.
 * - `smoke`: dark glass for toasts and tooltips.
 * - `code`: a code block, as a denser glass that keeps code legible.
 * - `backdrop`: a large layout pane that turns transparent so the wallpaper shows through.
 */
export const SURFACE_KINDS = ['sidebar', 'composer', 'panel', 'menu', 'smoke', 'code', 'backdrop'] as const
export type SurfaceKind = (typeof SURFACE_KINDS)[number]

/** Selector matching every attribute the plugin may leave on DSH or plugin elements. */
export const FOOTPRINT_SELECTOR = [
  ATTR_ROOT,
  ATTR_SIDEBAR,
  ATTR_WALLPAPER,
  ATTR_STATIC_WALLPAPER,
  ATTR_HIGHLIGHTS,
  ATTR_ADJUSTING,
  ATTR_RAW,
  ATTR_SURFACE,
  ATTR_FILL,
  ATTR_FLAT,
  ATTR_ECHO,
  ATTR_PAINT,
  ATTR_FLOAT,
  ATTR_LENS,
  ATTR_EXCLUDED,
  ATTR_OWNED,
]
  .map(name => `[${name}]`)
  .join(',')
