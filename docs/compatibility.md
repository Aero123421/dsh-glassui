# Compatibility

Glass UI is built to keep working when DSH changes. This page describes what it depends on, how each DSH release is checked, and what happens when something it depends on changes.

## Supported DSH versions

`peerDependencies["@deepseek-ai/dsh"]` is the supported range — currently `>=0.2.0-rc.2 <0.3.0-0`. At boot, DSH skips a plugin when a `@deepseek-ai/dsh` or `@deepseek-ai/dsh-*` peer range does not admit the running version. That comparison includes prereleases, so this range admits 0.2.1-alpha.3 and later 0.2.x prereleases (0.2.2-alpha.1, 0.2.9-rc.1, and so on). It does not admit 0.3.0, or a 0.3.0 prerelease such as `0.3.0-alpha.1`. The same check rejects an empty range, a wildcard (`*`, `x`, `>=0`), and any range that lacks a lower or upper bound on an alternative or that reaches outside the running line. On 0.2 that line starts at this plugin's floor `0.2.0-rc.2` and ends before `0.3.0-0`, so `<0.3.0-0`, `<=0.2.9`, `<0.2.2`, `>=0.0.0 <0.3.0-0`, `<99`, `^0`, and `<0.3.0` (which still admits `0.3.0-0`) are compatibility-unknown. The published `>=0.2.0-rc.2 <0.3.0-0` stays inside that line. Other 0.x lines run from `0.<minor>.0-0` to the next minor. On 1.x and later the line runs from `<major>.0.0-0` to the next major. DSH refuses to install a plugin outside the range and offers an explicit, per-version exemption instead. The range is widened only after the E2E suite has passed on the new release. node-semver's default mode (without `includePrerelease`) still does not treat `0.2.1-alpha.3` as inside this range, because the prerelease comparators are on 0.2.0 and 0.3.0. DSH's boot check is the one that admits it.

| DSH                     | Status                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.2.1-rc.2 (`next`)     | Pinned in `package.json` → `glassui.e2e.dsh`; browser E2E on every pull request and release.                                                                     |
| 0.2.1-alpha.5 (`alpha`) | Token and contract checks on every pull request; nightly browser E2E.                                                                                            |
| 0.2.0-rc.2 (`latest`)   | Token checks and browser E2E on every pull request and release. This version offers manual plugin updates because its bundle list omits the installation source. |
| newest `alpha` / `next` | Token and contract checks on every pull request; nightly browser E2E does not block.                                                                             |

The dist-tag resolutions above were checked on 2026-10-18. A dist-tag can move independently of a Glass UI release.

## What the plugin depends on

Everything is listed in code, not just here:

- **Theme tokens** — [`src/shared/tokens.ts`](../src/shared/tokens.ts) (`ALL_UPSTREAM_TOKENS`) and the `var(--dsw-*)` references in the settings page styles.
- **Platform contracts** — the `webserver/index-inject` Host event and its `global` / `style` / `script` rows; the client module loader (`window.__ModuleLoader__`); the `configForms`, `slots` and `locale` client services and the `settings.section` slot; the `data-ds-dark-theme` palette attribute; and the client packages named in `package.json` → `dsh.client.inject`.
- **Optional hints** — `data-platform` (the macOS app, for the automatic wallpaper) and `data-markdown-variant` (skipping rendered Markdown while scanning). Without them the plugin still works; it only scans a little more or paints a wallpaper in the macOS app.

It deliberately does **not** depend on DSH class names, DOM structure, component internals, or private APIs.

## Checking a release

```sh
npm run compat -- --install alpha            # install @deepseek-ai/dsh@alpha into a temp dir and check it
npm run compat -- --dsh path/to/a/dsh/install
npm run compat -- --install 0.2.1-rc.2 --json
```

`scripts/compat.mjs` scans the installed `@deepseek-ai/*` packages for every token definition and contract above and exits non-zero when a required one is missing. The E2E suite then exercises the real thing:

```sh
DSH_VERSION=alpha npm run test:e2e
```

Pull requests run the token and contract check against 0.2.0-rc.2, 0.2.1-rc.2, and the `alpha` and `next` dist-tags. That check also requires the plugin's DSH peer range to admit the installed runtime, using the same prerelease rule as boot. Nightly browser E2E runs the pinned version, `latest`, `alpha`, and `next`; a failure on a dist-tag does not block.

## When DSH changes

| Change in DSH                                             | Effect                                                                                                      | What to do                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Components restructured, classes renamed                  | The token and API contracts still need to be checked.                                                       | —                                                                     |
| New components painted with existing tokens               | They become glass automatically.                                                                            | —                                                                     |
| A watched token renamed or removed                        | Surfaces painted with it keep DSH's look; the settings page lists the token as missing. Nothing breaks.     | Update `tokens.ts`, release.                                          |
| A watched token's value changes                           | None; values are read at runtime.                                                                           | —                                                                     |
| Two watched tokens set to the same value by another theme | The engine cannot tell those surfaces apart; they keep DSH's look and are listed as ambiguous.              | —                                                                     |
| The boot event or row format changes                      | The first paint is plain; the browser half installs the stylesheet itself once it loads.                    | Update `src/host/boot.ts`.                                            |
| The settings slot or form service changes                 | The material still works with the last saved settings; the settings section or live editing is unavailable. | Update `src/client/index.tsx`.                                        |
| Chromium changes how SVG backdrop filters are placed      | `lens.test.mjs` fails in CI; refraction may look misaligned.                                                | Update `src/client/engine/ink.ts`, or turn refraction off by default. |

## Coexisting with other plugins

- Theme overrides through DSH's theme API (`ctx.theme.overrideTokens`) are inline on `<body>` and always win; glass is mixed from whatever value is in effect.
- Another plugin's elements that paint with DSH's tokens and elevations become glass like DSH's own. A plugin can opt out with `data-glassui-ignore` or opt in explicitly with `data-glassui-material="regular" | "dense" | "smoke"`.
- Users can exclude any element with the _Leave these elements alone_ setting (CSS selectors).
- The plugin writes only `data-glassui-*` attributes, `--glassui-*` custom properties and its own elements (`[data-glassui-owned]`), plus the `--dsw-*` tokens on the surfaces it styles. It does not register services, routes or commands.
