/**
 * The static stylesheet. The Host embeds it in the boot HTML so the first paint
 * is already glass; the client half installs the same text when the boot rows
 * are missing. Everything that changes at runtime (tint, wallpaper, nudged token
 * values, refraction filters) lives in custom properties, attributes and the
 * engine's small dynamic sheet instead.
 *
 * Precedence, by design:
 * - Every rule is scoped under `:root[data-glassui]`, so removing that one
 *   attribute turns the whole sheet off.
 * - Token overrides use `:root[data-glassui] body` and its dark variant, excluding
 *   opt-out subtrees. Their specificity exceeds DSH's token rules, which top out
 *   at `html[data-platform='darwin'] body[data-ds-dark-theme]` (0,2,2), so they win
 *   regardless of stylesheet order.
 * - No rule uses `!important`. Token overrides other plugins apply through DSH's
 *   theme API are inline styles on `<body>` and therefore always win over this
 *   sheet: the plugin sits underneath every explicit customization.
 * - Rules for discovered surfaces match only the plugin's own attributes.
 */
import {
  ATTR_ECHO,
  ATTR_EXCLUDED,
  ATTR_FILL,
  ATTR_FLAT,
  ATTR_FLOAT,
  ATTR_HIGHLIGHTS,
  ATTR_LENS,
  ATTR_MATERIAL,
  ATTR_PAINT,
  ATTR_ROOT,
  ATTR_SIDEBAR,
  ATTR_SURFACE,
  ATTR_WALLPAPER,
  VAR_POINTER_X,
  VAR_POINTER_Y,
  VAR_TINT,
  VAR_WALLPAPER,
} from './dom.ts'
import {
  DARK_ATTRIBUTE,
  ELEVATION_SENTINELS,
  ELEVATION_STROKE,
  ELEVATION_TOKENS,
  FILL_KEYS,
  FILL_TOKENS,
  MENU_TOKENS,
  type FillKey,
} from './tokens.ts'
import { svgDataUrl } from './wallpapers.ts'

/**
 * Rim of the floating sidebar pane, drawn as an SVG background layer because
 * the pane is shaped with `clip-path`, which also clips box shadows. Both
 * strokes are centered on the clip edge, so their inner halves show: a thin
 * dark edge and a specular highlight brightest at the top-left and bottom-right.
 * @param top - highlight opacity at the top-left corner.
 * @param bottom - highlight opacity at the bottom-right corner.
 * @param edge - opacity of the dark edge.
 */
function paneRim(top: number, bottom: number, edge: number): string {
  const rect = "<rect width='100%' height='100%' rx='18' ry='18' fill='none'"
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>",
    "<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",
    `<stop offset='0' stop-color='white' stop-opacity='${top}'/>`,
    `<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(top * 20) / 100}'/>`,
    "<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",
    `<stop offset='1' stop-color='white' stop-opacity='${bottom}'/>`,
    '</linearGradient>',
    `${rect} stroke='black' stroke-opacity='${edge}' stroke-width='1'/>`,
    `${rect} stroke='url(#r)' stroke-width='3'/>`,
    '</svg>',
  ].join('')
  return `url("${svgDataUrl(svg)}")`
}

/** Root scope of every rule. */
export const ROOT = `:root[${ATTR_ROOT}]`
/** Token scope for the light palette, and for values shared by both palettes. */
export const BODY = `${ROOT} body`
/** Token scope for the dark palette. */
export const BODY_DARK = `${ROOT} body[${DARK_ATTRIBUTE}]`
/** Opt-out roots and their descendants keep upstream styles. */
export const INCLUDED = `:not([${ATTR_EXCLUDED}]):not([${ATTR_EXCLUDED}] *)`
/** Scope for rules on discovered surfaces. */
const S = `${BODY} [${ATTR_SURFACE}]${INCLUDED}`
const GLASS = `${S}:not([${ATTR_SURFACE}="backdrop"]):not([${ATTR_FLAT}])`

type Declarations = Readonly<Record<string, string | number>>

function rule(selector: string, declarations: Declarations): string {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}`
}

/** Parameters derived from the tint, shared by both palettes. */
const ROOT_PARAMETERS: Declarations = {
  [VAR_TINT]: 0.35,
  '--glassui-floor': 0,
  '--glassui-tt': `max(var(${VAR_TINT}), var(--glassui-floor))`,
  '--glassui-blur': 'calc(6px + var(--glassui-tt) * 22px)',
  '--glassui-filter': 'blur(var(--glassui-blur)) saturate(180%) brightness(1.04)',
  '--glassui-fill-a': 'calc(0.16 + var(--glassui-tt) * 0.62)',
  '--glassui-dense-a': 'calc(0.52 + var(--glassui-tt) * 0.42)',
  '--glassui-smoke-a': 'calc(0.5 + var(--glassui-tt) * 0.42)',
  // Code blocks stay dense enough for syntax colors to keep their contrast.
  '--glassui-code-a': 'calc(0.4 + var(--glassui-tt) * 0.4)',
  '--glassui-canvas-a': 'calc(0.4 + var(--glassui-tt) * 0.5)',
  '--glassui-inset': '8px',
  // Matches the rx of the pane rim drawn by paneRim().
  '--glassui-radius': '18px',
}

/** Light palette: glass colors, rim and shadow strengths, menu material. */
const LIGHT: Declarations = {
  '--glassui-glass-rgb': '255 255 255',
  '--glassui-smoke-rgb': '30 30 32',
  '--glassui-rim-hi': 0.9,
  '--glassui-rim-lo': 0.38,
  '--glassui-edge': 'rgb(0 0 0 / 0.08)',
  '--glassui-drop': 'rgb(0 0 0 / 0.14)',
  '--glassui-contact': 'rgb(0 0 0 / 0.2)',
  '--glassui-sheen': 0.2,
  '--glassui-light-a': 0.3,
  '--glassui-pane-rim': paneRim(0.95, 0.5, 0.1),
  [MENU_TOKENS.fill]: 'rgb(250 250 252 / calc(0.5 + var(--glassui-tt) * 0.42))',
  [MENU_TOKENS.overlayFill]: 'rgb(250 250 252 / calc(0.86 + var(--glassui-tt) * 0.12))',
  [MENU_TOKENS.groupHeader]: 'rgb(250 250 252 / calc(0.8 + var(--glassui-tt) * 0.18))',
}

/** Dark palette. */
const DARK: Declarations = {
  '--glassui-glass-rgb': '40 40 44',
  '--glassui-smoke-rgb': '44 44 48',
  '--glassui-rim-hi': 0.32,
  '--glassui-rim-lo': 0.12,
  '--glassui-edge': 'rgb(0 0 0 / 0.5)',
  '--glassui-drop': 'rgb(0 0 0 / 0.42)',
  '--glassui-contact': 'rgb(0 0 0 / 0.5)',
  '--glassui-sheen': 0.07,
  '--glassui-light-a': 0.16,
  '--glassui-pane-rim': paneRim(0.4, 0.18, 0.5),
  [MENU_TOKENS.fill]: 'rgb(44 44 48 / calc(0.46 + var(--glassui-tt) * 0.44))',
  [MENU_TOKENS.overlayFill]: 'rgb(44 44 48 / calc(0.86 + var(--glassui-tt) * 0.12))',
  [MENU_TOKENS.groupHeader]: 'rgb(44 44 48 / calc(0.8 + var(--glassui-tt) * 0.18))',
}

/** Values independent of the palette: the rim, the menu blur and the fill captures. */
const SHARED: Declarations = {
  '--glassui-rim': [
    'inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))',
    'inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))',
    '0 0 0 0.5px var(--glassui-edge)',
  ].join(', '),
  '--glassui-contained-rim': [
    'inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))',
    'inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))',
    'inset 0 0 0 0.5px var(--glassui-edge)',
  ].join(', '),
  [MENU_TOKENS.filter]: 'var(--glassui-filter)',
  // Each watched fill as <body> sees it, nudges and other plugins' overrides
  // included. Surfaces mix their glass from these; a surface cannot reference
  // the token it overrides.
  ...Object.fromEntries(FILL_KEYS.map(key => [`--glassui-src-${key}`, `var(${FILL_TOKENS[key]})`])),
}

function elevation(sentinel: string, near: string, far: string): string {
  return `var(${ELEVATION_STROKE}), var(--glassui-rim), ${near}, ${far}, 0 0 0 0 ${sentinel}`
}

/** Elevation re-declared per element, as DSH declares it, so component stroke rebinding keeps working. */
const ELEVATION: Declarations = {
  [ELEVATION_TOKENS.panel]: elevation(
    ELEVATION_SENTINELS.panel,
    '0 2px 6px -2px rgb(0 0 0 / 0.06)',
    '0 10px 28px -10px var(--glassui-drop)',
  ),
  [ELEVATION_TOKENS.prominent]: elevation(
    ELEVATION_SENTINELS.prominent,
    '0 3px 10px -3px rgb(0 0 0 / 0.08)',
    '0 18px 44px -14px var(--glassui-drop)',
  ),
  [ELEVATION_TOKENS.soft]: elevation(
    ELEVATION_SENTINELS.soft,
    '0 4px 16px -6px rgb(0 0 0 / 0.06)',
    '0 14px 36px -16px var(--glassui-drop)',
  ),
}

/**
 * Refracting surfaces have no ink overflow at the top or left. Chromium versions
 * disagree on whether that overflow offsets SVG backdrop filters.
 */
const CONTAINED_ELEVATION: Declarations = Object.fromEntries(
  (['panel', 'prominent', 'soft'] as const).map(tier => [
    ELEVATION_TOKENS[tier],
    [
      'var(--glassui-contained-rim)',
      '0 1px 2px -3px rgb(0 0 0 / 0.12)',
      '0 16px 22px -33px var(--glassui-contact)',
      `0 0 0 0 ${ELEVATION_SENTINELS[tier]}`,
    ].join(', '),
  ]),
)

const SHEEN = 'linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)'
const POINTER_LIGHT = `radial-gradient(240px circle at var(${VAR_POINTER_X}) var(${VAR_POINTER_Y}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`

/**
 * Registrations that keep per-surface values from being inherited: the pointer
 * position changes on every pointer move, and inheriting it would restyle every
 * descendant of the surface each time.
 */
const PROPERTIES = [
  `@property ${VAR_POINTER_X} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,
  `@property ${VAR_POINTER_Y} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,
  "@property --glassui-light { syntax: '*'; inherits: false; }",
  "@property --glassui-pane { syntax: '*'; inherits: false; }",
  "@property --glassui-pane-size { syntax: '*'; inherits: false; }",
].join('\n')

function surfaceRules(): string[] {
  const rules: string[] = [
    rule(`${S}[${ATTR_SURFACE}="sidebar"], ${S}[${ATTR_SURFACE}="composer"]`, {
      '--glassui-pct': 'calc(var(--glassui-fill-a) * 100%)',
    }),
    rule(`${S}[${ATTR_SURFACE}="panel"], ${S}[${ATTR_SURFACE}="menu"]`, {
      '--glassui-pct': 'calc(var(--glassui-dense-a) * 100%)',
    }),
    rule(`${S}[${ATTR_SURFACE}="smoke"]`, { '--glassui-pct': 'calc(var(--glassui-smoke-a) * 100%)' }),
    rule(`${S}[${ATTR_SURFACE}="code"]`, { '--glassui-pct': 'calc(var(--glassui-code-a) * 100%)' }),
    rule(`${S}[${ATTR_SURFACE}="backdrop"], ${S}[${ATTR_FLAT}]`, { '--glassui-pct': '0%' }),
    rule(GLASS, {
      // Safari ignores custom properties inside the prefixed property.
      '-webkit-backdrop-filter': 'blur(18px) saturate(180%)',
      'backdrop-filter': 'var(--glassui-filter)',
    }),
    // A part repainting its surface's glass would double it; the surface shows through instead.
    rule(`${BODY} [${ATTR_ECHO}]`, { 'background-color': 'transparent' }),
    // Code blocks have no elevation of their own; a rim gives the glass its edge.
    rule(`${GLASS}[${ATTR_SURFACE}="code"]`, { 'box-shadow': 'var(--glassui-rim)' }),
  ]
  const mix = (key: FillKey): string =>
    `color-mix(in srgb, var(--glassui-src-${key}) var(--glassui-pct, 100%), transparent)`
  for (const key of FILL_KEYS) rules.push(rule(`${S}[${ATTR_FILL}="${key}"]`, { [FILL_TOKENS[key]]: mix(key) }))
  // A code block's banner (the header with the language and buttons) lies on the
  // block's own fill. Inside a glass block it turns clear, so the block is one
  // even layer of glass instead of a denser strip at the top.
  rules.push(rule(`${S}[${ATTR_SURFACE}="code"][${ATTR_FILL}="code"]`, { [FILL_TOKENS.codeBanner]: 'transparent' }))
  rules.push(
    // Layers, top to bottom: pointer light, the floating pane's rim, the sheen.
    // Each layer is `none` unless its feature is on; sizes keep the floating
    // pane's layers inside its inset.
    rule(`${GLASS}[${ATTR_PAINT}]`, {
      // Browsers without @property (Firefox before 128) inherit these; reset them per surface.
      '--glassui-pane': 'none',
      '--glassui-pane-size': '100% 100%',
      'background-image': `var(--glassui-light, none), var(--glassui-pane, none), ${SHEEN}`,
      'background-size': 'auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)',
      'background-position': 'center',
      'background-repeat': 'no-repeat',
    }),
    rule(`${ROOT}[${ATTR_HIGHLIGHTS}] body [${ATTR_SURFACE}][${ATTR_PAINT}]`, { '--glassui-light': POINTER_LIGHT }),
    // The floating sidebar is shaped with clip-path rather than margins: DSH sizes
    // the sidebar's content in pixels to the column width, and a margin would cut
    // into it. The 8px inset falls inside the content's own padding.
    rule(`${ROOT}[${ATTR_SIDEBAR}="floating"] body [${ATTR_SURFACE}="sidebar"][${ATTR_FLOAT}]:not([${ATTR_FLAT}])`, {
      'clip-path': 'inset(var(--glassui-inset) round var(--glassui-radius))',
      '--glassui-pane': 'var(--glassui-pane-rim)',
      '--glassui-pane-size': 'calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))',
    }),
  )
  return rules
}

function materialRules(): string[] {
  const M = `${BODY} [${ATTR_MATERIAL}]${INCLUDED}`
  return [
    rule(`${M}:not([${ATTR_MATERIAL}="none"])`, {
      '-webkit-backdrop-filter': 'blur(18px) saturate(180%)',
      'backdrop-filter': 'var(--glassui-filter)',
      'box-shadow': 'var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)',
    }),
    rule(`${M}[${ATTR_MATERIAL}="regular"]`, {
      'background-color': 'rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))',
    }),
    rule(`${M}[${ATTR_MATERIAL}="dense"]`, {
      'background-color': 'rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))',
    }),
    rule(`${M}[${ATTR_MATERIAL}="smoke"]`, {
      'background-color': 'rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))',
    }),
  ]
}

function wallpaperRules(): string[] {
  return [
    rule(`${ROOT}[${ATTR_WALLPAPER}]`, {
      background: `var(${VAR_WALLPAPER}) center / cover no-repeat fixed`,
    }),
    rule(`${ROOT}[${ATTR_WALLPAPER}] body${INCLUDED}`, {
      'background-color':
        'color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)',
    }),
  ]
}

function accessibilityRules(): string {
  return [
    `@media (prefers-contrast: more) {\n${[
      rule(ROOT, { '--glassui-floor': 0.85 }),
      rule(BODY, { '--glassui-edge': 'rgb(0 0 0 / 0.45)' }),
      rule(BODY_DARK, { '--glassui-edge': 'rgb(255 255 255 / 0.35)' }),
    ].join('\n')}\n}`,
    `@media (prefers-reduced-transparency: reduce) {\n${rule(ROOT, { '--glassui-floor': 1 })}\n}`,
    // Without backdrop blur, translucent fills would put text over unblurred content.
    `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n${rule(ROOT, { '--glassui-floor': 0.9 })}\n}`,
  ].join('\n')
}

/**
 * Build the complete static stylesheet.
 * @returns CSS text, free of `</style` so it can be embedded in HTML.
 */
export function buildStylesheet(): string {
  const parts = [
    '/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */',
    PROPERTIES,
    // Screens only: printing keeps DSH's own look. Forced colors (Windows high contrast) is left alone entirely.
    '@media screen and (forced-colors: none) {',
    rule(ROOT, ROOT_PARAMETERS),
    rule(`${BODY}${INCLUDED}`, { ...LIGHT, ...SHARED }),
    rule(`${BODY_DARK}${INCLUDED}`, DARK),
    rule(`${BODY}${INCLUDED}, ${BODY} *${INCLUDED}`, ELEVATION),
    rule(`${S}[${ATTR_LENS}]`, {
      ...CONTAINED_ELEVATION,
      // Menus can use literal shadows rather than elevation tokens.
      'box-shadow': 'var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)',
    }),
    ...surfaceRules(),
    ...materialRules(),
    ...wallpaperRules(),
    accessibilityRules(),
    '}',
  ]
  return `${parts.join('\n')}\n`
}
