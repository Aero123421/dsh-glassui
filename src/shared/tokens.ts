/**
 * The DSH theme tokens this plugin depends on. This file is the single list of
 * upstream names: the stylesheet, the engine and `scripts/compat.mjs` all read
 * it, and compat checks each name against a DSH release before it ships.
 *
 * Nothing here refers to DSH class names. If a later DSH release renames or
 * drops a token, the surfaces that use it are simply not found; nothing breaks.
 */

/** Fill tokens the engine watches, keyed by a short name used in DOM attributes. */
export const FILL_TOKENS = {
  input: '--dsw-specific-input-major',
  sidebar: '--dsw-specific-sidebar-fill',
  toast: '--dsw-alias-toast-bg',
  tooltip: '--dsw-alias-tooltip-bg',
  layer1: '--dsw-alias-bg-layer-1',
  layer2: '--dsw-alias-bg-layer-2',
  layer3: '--dsw-alias-bg-layer-3',
  floating: '--dsw-alias-button-floating-fill',
  elevated: '--dsw-alias-button-elevated-fill',
  overlay: '--dsw-alias-bg-overlay',
  base: '--dsw-alias-bg-base',
  code: '--dsw-alias-markdown-code-block',
  codeBanner: '--dsw-alias-markdown-code-block-banner',
} as const

export type FillKey = keyof typeof FILL_TOKENS

/** Watched fills in nudge priority order. */
export const FILL_KEYS = Object.keys(FILL_TOKENS) as readonly FillKey[]

/** Fills of code blocks: glass only while the code block setting asks for it. */
export const CODE_FILLS: ReadonlySet<FillKey> = new Set(['code', 'codeBanner'])

/**
 * Other background tokens. Watched fills are nudged away from their values so an
 * element painted with one of these is never mistaken for a watched surface.
 */
export const RESERVED_TOKENS = [
  '--dsw-alias-markdown-inline-code',
  '--dsw-alias-markdown-citation',
  '--dsw-alias-markdown-tag',
  '--dsw-alias-markdown-placeholder',
  '--dsw-specific-bubble',
  '--dsw-specific-selector',
  '--dsw-specific-tip',
  '--dsw-specific-login-input',
  '--dsw-specific-sidebar-nav-item-active',
  '--dsw-specific-sidebar-nav-item-hover',
  '--dsw-alias-bg-module-platform',
  '--dsw-alias-bg-multi-select',
  '--dsw-alias-bg-document-preview',
  '--dsw-alias-interactive-bg-hover-solid',
  '--dsw-alias-button-primary-dimmed',
] as const

/** Elevation tiers. DSH declares them on every element; the plugin re-declares them with glass rims. */
export const ELEVATION_TOKENS = {
  panel: '--dsw-elevation-panel',
  prominent: '--dsw-elevation-prominent',
  soft: '--dsw-elevation-soft',
} as const

export type ElevationTier = keyof typeof ELEVATION_TOKENS

/** The hairline stroke layer DSH composes into every elevation tier. */
export const ELEVATION_STROKE = '--dsw-elevation-stroke'

/**
 * A fully transparent, zero-sized shadow appended to each elevation tier. It draws
 * nothing; its color identifies the tier in an element's computed `box-shadow`.
 */
export const ELEVATION_SENTINELS: Readonly<Record<ElevationTier, string>> = {
  panel: 'rgb(1 0 61 / 0)',
  prominent: 'rgb(1 0 62 / 0)',
  soft: 'rgb(1 0 63 / 0)',
}

/** Menu material tokens. DSH menus, popovers and docks already blur through these. */
export const MENU_TOKENS = {
  fill: '--dsw-menu-surface-fill',
  filter: '--dsw-menu-backdrop-filter',
  overlayFill: '--dsw-specific-menu',
  groupHeader: '--dsw-alias-menu-group-header-fill',
} as const

/** Body attribute DSH sets while its dark palette is active. */
export const DARK_ATTRIBUTE = 'data-ds-dark-theme'

/** Root attribute DSH's desktop shell sets to the host platform (`darwin` in the macOS app). */
export const PLATFORM_ATTRIBUTE = 'data-platform'

/**
 * Optional performance hint: DSH marks rendered Markdown with this attribute. The
 * engine skips those subtrees because message text never hosts chrome (unless code
 * blocks, which live inside Markdown, are set to glass). If the
 * attribute disappears in a later release the engine scans a little more; results
 * do not change.
 */
export const MARKDOWN_HINT_ATTRIBUTE = 'data-markdown-variant'

/** Every upstream token name the plugin reads or writes, for compatibility checks. */
export const ALL_UPSTREAM_TOKENS: readonly string[] = [
  ...Object.values(FILL_TOKENS),
  ...RESERVED_TOKENS,
  ...Object.values(ELEVATION_TOKENS),
  ELEVATION_STROKE,
  ...Object.values(MENU_TOKENS),
]
