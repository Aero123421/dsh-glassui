# Architecture

Glass UI changes how DSH Web looks without changing what DSH renders. It never patches DSH's components, never depends on their class names, and never writes anything outside its own `data-glassui-*` / `--glassui-*` namespace. This document explains how that works and why each piece is shaped the way it is.

## Overview

```text
Host half (Node, dist/index.js)                Browser half (dist/client.js)
───────────────────────────────                ───────────────────────────────────────────────
Config schema (live, stored in the profile)    GlassController  ← DSH settings form (configForms)
webserver/index-inject                         │  effective settings, debounced writes
  ├─ global  __DSH_GLASSUI__ = settings        ▼
  ├─ style   static stylesheet                 GlassEngine
  └─ script  marks <html> before first paint     ├─ Probes      exact computed token values
                                                 ├─ classify()  computed style → surface kind
                                                 ├─ DynamicSheet  nudges + lens rules
                                                 ├─ Lenses      SVG refraction filters
                                                 ├─ Highlights  pointer light
                                                 └─ Wallpaper
                                               Settings section (slot "settings.section")
```

The two halves share `src/shared/` (settings, tokens, colors, wallpapers, the stylesheet).

## Boot: glass on the first paint

DSH lets a Host plugin contribute rows to every Web page render through the `webserver/index-inject` event. Glass UI adds:

1. **`global`** — `window.__DSH_GLASSUI__ = { version, settings }`, read by the browser half before DSH's settings form is ready.
2. **`style`** — the static stylesheet ([`src/shared/stylesheet.ts`](../src/shared/stylesheet.ts)). It is inert unless `<html>` carries `data-glassui`.
3. **`script` (body)** — a few lines that set `data-glassui`, the sidebar style, the tint and the wallpaper on `<html>`. It runs right after DSH's own theme boot script, so the palette attribute is already on `<body>`.

With the material off, only the `global` row is emitted. Rows are rebuilt on each render from the live settings, so a change reaches the next page load without a restart. The script never throws, skips Windows high-contrast mode, and every value it embeds is JSON with `<` escaped.

## The token contract

DSH's theme is a set of CSS custom properties (`--dsw-*`) declared on `<body>` (light) and `body[data-ds-dark-theme]` (dark). Components paint with them: the sidebar with `--dsw-specific-sidebar-fill`, the composer with `--dsw-specific-input-major`, dialogs with `--dsw-alias-bg-layer-*` plus an elevation shadow (`--dsw-elevation-panel`), menus with the menu material tokens, and so on.

[`src/shared/tokens.ts`](../src/shared/tokens.ts) is the single list of upstream names the plugin depends on:

| Group                        | Use                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Watched fills (13)           | Identify surfaces; redefined on each surface as glass. The two code-block fills are watched only while code blocks are set to glass. |
| Reserved fills (15)          | Inline code, bubbles, selections…; watched fills are kept distinct from them so these never become glass.                            |
| Elevation tiers (3) + stroke | Re-declared with a glass rim and a transparent _sentinel_ shadow that identifies the tier.                                           |
| Menu material (4)            | DSH menus already blur; the plugin adjusts their fill and filter.                                                                    |

`scripts/compat.mjs` checks each name against a DSH release (see [compatibility.md](compatibility.md)).

## Discovery

The engine needs to know which element is the sidebar, which is a dialog, and so on — without class names. It asks the browser.

### 1. Make each fill recognizable

Several tokens often share a value (in the light palette the base, layer and input fills are all white). The engine reads every watched and reserved token's exact computed value through hidden **probe** elements, then moves each watched fill by one to three steps of a single 8-bit channel until every value is unique ([`nudgeApart`](../src/shared/color.ts)). `rgb(255 255 255)` becomes `rgb(255 255 254)`, `rgb(255 255 253)`, … — invisible, but exact. The nudged values go into the engine's dynamic stylesheet, scoped to the current palette.

While it reads, the engine sets `data-glassui-raw` on `<body>`, which suspends the nudges for that instant, so it always sees DSH's own values (plus any inline overrides from other plugins).

### 2. Read, classify, mark

For each candidate element (block-level tags only; text, media, `<pre>`/`<code>` and tables are skipped, and inside rendered Markdown only `<div>`s, where code blocks live, are looked at), the engine reads its computed `background-color`, `box-shadow`, `backdrop-filter` and size, and [`classify()`](../src/client/engine/classify.ts) — a pure function — decides:

| Kind       | Rule                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar`  | Paints with the sidebar fill. Floats as a pane when ≥160 px wide and plain.                                                                                                     |
| `composer` | Paints with the input fill.                                                                                                                                                     |
| `panel`    | A layer, floating, elevated, overlay or base fill **and** a panel or prominent elevation (read from the sentinel color).                                                        |
| `menu`     | Its `backdrop-filter` equals DSH's menu material.                                                                                                                               |
| `smoke`    | Toast or tooltip fill.                                                                                                                                                          |
| `code`     | A code block or its banner. A denser glass without sheen or pointer light, so code stays easy to read.                                                                          |
| `backdrop` | A sidebar- or input-filled pane covering more than half the viewport, or a base-filled one covering a quarter without elevation. It becomes transparent so the wallpaper shows. |

The verdict is written as attributes (`data-glassui-surface`, `-fill`, `-paint`, `-float`). A surface nested in another surface of the same fill is marked `data-glassui-flat` and turns transparent instead of stacking glass.

Some components pass their fill on to a part through a variable of their own — DSH's code block paints its header with the block's fill this way. Such a part inherits the surface's glass color and would add a second layer. The engine recognizes a descendant whose background is exactly its surface's glass color, marks it `data-glassui-echo`, and clears its background, so every surface stays one layer of glass.

### 3. Keep it correct

- A `MutationObserver` on `<body>` queues changed subtrees after child-list, class, inline-style and opt-out changes. Changes to the plugin’s own pointer properties are ignored.
- Palette changes — the dark attribute, inline styles on `<body>`, any stylesheet added to `<head>` by DSH or another plugin — trigger a fresh read of the token values; if they changed, everything is re-classified.
- `transitionend` / `animationend` re-check the element concerned.
- Work runs in `requestAnimationFrame` with a target budget of 8 ms per frame, checked between batches of reads. Palette refreshes, browser style recalculation and writes can exceed that target.

Tagged elements are verified cheaply: each kind has an expected computed background (read once from a probe), so a tagged element that still shows it keeps its marks without further work.

## Rendering

All visual work is done by CSS.

### Precedence

Every rule is scoped under `:root[data-glassui]`, so removing that one attribute switches the whole sheet off. Token overrides use `:root[data-glassui] body` (specificity 0,2,1) and `… body[data-ds-dark-theme]` (0,3,1). DSH's most specific token rule is `html[data-platform='darwin'] body[data-ds-dark-theme]` (0,2,2), so the plugin wins regardless of stylesheet order — but **inline** values on `<body>`, which is how DSH applies other plugins' `ctx.theme.overrideTokens`, always win over it. No rule uses `!important`.

### Glass

On `<body>`, the stylesheet captures each watched fill as it is in effect (`--glassui-src-input: var(--dsw-specific-input-major)`, nudges and overrides included). On each surface it then redefines the token itself:

```css
:root[data-glassui] body [data-glassui-surface][data-glassui-fill='input'] {
  --dsw-specific-input-major: color-mix(in srgb, var(--glassui-src-input) var(--glassui-pct), transparent);
}
```

so DSH's own component styles paint a translucent version of the color they would have painted, and the element's descendants inherit it. A `backdrop-filter` (blur, saturation, a touch of brightness) and DSH's elevation tokens — re-declared with a specular rim and softer shadows — complete the material. The tint setting drives `--glassui-t`, from which every opacity and the blur radius are derived.

### Floating sidebar

The sidebar column is shaped with `clip-path: inset(8px round 18px)` rather than margins: DSH sizes the sidebar's content in pixels to the column width, and a margin would cut into it. Because `clip-path` also clips box shadows, the pane's rim is an SVG background layer.

### Pointer highlights

The pointer position is written, in the surface's own coordinates, onto the surfaces under the pointer only. The two custom properties are registered with `@property … { inherits: false }`, so a pointer move restyles those few elements and never their subtrees.

### Wallpaper

The built-in wallpapers ([`wallpapers.ts`](../src/shared/wallpapers.ts)) are deterministic SVG in two styles — layered ribbons and soft color fields — embedded as `data:` URLs, so nothing is downloaded. The canvas behind DSH becomes partly transparent so the wallpaper shows through panes that turned transparent.

A wallpaper is a stack of full-frame layers with the same 16:10 view box. A still preset is drawn as one image. An animated preset (Tide, Aurora, Bloom, Prism) keeps its base as the `<html>` background and adds its moving layers in one element of the plugin's own:

- The element is a child of `<html>` placed before `<body>`, `position: fixed; z-index: -1`, so it paints above the page background and below everything DSH draws — including the translucent canvas — whatever stacking contexts DSH sets up inside `<body>`.
- Each moving layer is a whole image, drawn with an overscan margin of 15% on every side, and moved by a Web Animations `transform` animation. Transform animations run on the compositor; nothing runs on the main thread while the wallpaper plays.
- Every animation uses `steps()` with 12 steps per second and a whole number of seconds per leg, so all layers change on the same clock. Chromium draws a frame only when a value changes: the glass above an animated wallpaper is re-blurred 12 times a second instead of 60–120. `test/integration/wallpaper.test.mjs` measures this.
- The first frame equals the still picture, which the Host's boot rows paint before the browser half loads and which `prefers-reduced-motion` keeps showing.

The layer element is owned (`data-glassui-owned`), so shutdown removes it like the plugin's other elements.

## Refraction

In Chromium, `backdrop-filter` accepts an SVG filter. Each refracting surface (at most 12 — the composer first, then toasts, menus and panels — and none larger than 35% of the viewport) gets one:

```text
SourceGraphic (the backdrop) → feGaussianBlur ─┐
feFlood (neutral) ┐                            ├→ feDisplacementMap → output
feImage (map)  ───┴→ feMerge ──────────────────┘
```

The displacement map ([`lens-map.ts`](../src/client/engine/lens-map.ts)) is a rounded-rectangle signed-distance field: inside a bezel along the edge, each pixel samples the backdrop from further inside the shape, the way the rim of a lens does, fading out with depth. Maps are cached by geometry and rebuilt after a size change settles; while the size changes, the surface keeps the plain blur.

**Chromium differences.** Chromium 141 offsets an SVG backdrop filter by the element's ink overflow. Chromium 143 and 149 use its border box. Refracting surfaces therefore use inset rims and contained shadows with zero overflow at the top and left. Custom outer shadows or focus rings keep the normal blur until removed. No browser-version table or positional correction is needed.

`test/integration/lens.test.mjs` pins this behavior with a probe filter, so a Chromium change shows up in CI.

Firefox accepts the `url()` syntax but draws nothing, and Safari does not support it; the engine detects Chromium (User-Agent Client Hints, or the user agent string outside secure contexts) and only then enables refraction.

## Settings

The Host declares the settings with DSH's schema library; every field is `volatile`, so edits apply without a restart and DSH shows them on the Plugins page. The browser half follows DSH's settings form (`configForms`) through [`GlassController`](../src/client/controller.ts), which applies edits to the engine immediately and writes them back after 300 ms of quiet (dragging the slider writes once). A refused write is rolled back; a connection that cannot store settings keeps edits for the page.

## Shutdown

`GlassEngine.stop()` disconnects every observer and listener, removes the dynamic stylesheet, the probes and the SVG filters, removes the root attributes and custom properties, and sweeps every `data-glassui-*` attribute (surfaces, echoes, lenses) it may have left on DSH or plugin elements (the public opt-in/opt-out attributes are left alone). The integration and E2E tests assert that the page is then identical to a page without the plugin.

## Accessibility

| Preference                     | Effect                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `prefers-reduced-transparency` | Fills become fully tinted; no refraction or highlights. |
| `prefers-contrast: more`       | Fills at least 85% opaque, stronger edges.              |
| `prefers-reduced-motion`       | No pointer highlights.                                  |
| `forced-colors: active`        | The plugin stays off entirely.                          |
| No `backdrop-filter` support   | Fills at least 90% opaque.                              |

Code blocks are a denser glass (at least 54% opaque at the default tint) without sheen or pointer light, and can be kept solid. Inline code, message bubbles and the other reserved fills keep their exact colors.
