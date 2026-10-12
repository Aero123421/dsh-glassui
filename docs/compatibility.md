# Compatibility

Glass UI is built to keep working when DSH changes. This page describes what it depends on, how each DSH release is checked, and what happens when something it depends on changes.

## Supported DSH versions

`peerDependencies["@deepseek-ai/dsh"]` is the supported range — currently `>=0.2.0-rc.2 <0.3.0`. DSH refuses to install a plugin outside that range (it offers an explicit, per-version exemption instead). The range is widened only after the E2E suite has passed on the new release.

| DSH                   | Status                                                                          |
| --------------------- | ------------------------------------------------------------------------------- |
| 0.2.1-alpha.2         | Tested on every pull request (pinned in `package.json` → `glassui.e2e.dsh`).    |
| 0.2.0-rc.2 (`latest`) | Tested nightly.                                                                 |
| newest `alpha`        | Tested nightly; failures open the question of a new release, they do not block. |

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
npm run compat -- --install 0.2.1-alpha.3 --json
```

`scripts/compat.mjs` scans the installed `@deepseek-ai/*` packages for every token definition and contract above and exits non-zero when a required one is missing. The E2E suite then exercises the real thing:

```sh
DSH_VERSION=alpha npm run test:e2e
```

Both run nightly in GitHub Actions against the pinned version, `latest` and `alpha`.

## When DSH changes

| Change in DSH                                             | Effect                                                                                                      | What to do                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Components restructured, classes renamed                  | None.                                                                                                       | —                                                                     |
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
