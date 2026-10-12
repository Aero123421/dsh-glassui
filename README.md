# Glass UI for DSH

**A Liquid Glass–style material for DSH (DeepSeek Harness) Web.** Translucent, blurred and refracting glass for the sidebar, composer, dialogs, menus and toasts — over a wallpaper of your choice. It works alongside every other plugin and keeps working across DSH updates. Unofficial.

[日本語](README.ja.md)

![DSH Web with Glass UI, light palette](docs/images/chat-light.png)

<table>
  <tr>
    <td><img src="docs/images/chat-dark.png" alt="Dark palette"></td>
    <td><img src="docs/images/settings-light.png" alt="The Glass UI settings section"></td>
  </tr>
</table>

## Highlights

- **Follows DSH, not its markup.** Surfaces are found by the design tokens DSH paints them with (`--dsw-*`), never by class names, so a DSH update that rearranges its components does not break the theme.
- **Stays out of the way.** Other plugins' theme overrides always win, the plugin never uses `!important`, and turning it off removes every trace without a reload.
- **Fast.** No per-frame work while idle; DOM changes are scanned in time-sliced batches and rendered Markdown is skipped entirely.
- **Accessible.** Honors _reduce transparency_, _increase contrast_, _reduce motion_ and Windows high-contrast mode. Code blocks become a denser glass that keeps syntax colors legible — or stay solid, if you prefer.
- **Real refraction where the browser can do it.** In Chromium-based browsers the edges of the composer, menus and toasts bend the background like a lens. Elsewhere you get the same glass without the lens.
- **No network, no telemetry.** Wallpapers are drawn as small inline SVGs; nothing is fetched unless you choose a custom wallpaper URL.

## Install

Requires DSH `>=0.2.0-rc.2 <0.3.0`.

1. Copy the URL of `dsh-glassui-<version>.tgz` from the [latest release](https://github.com/Aero123421/dsh-glassui/releases/latest).
2. In DSH Web, open **Plugins → Add plugin**, paste the URL and install. Or from a terminal:

   ```sh
   dsh plugin --profile web add https://github.com/Aero123421/dsh-glassui/releases/download/v0.1.0/dsh-glassui-0.1.0.tgz
   ```

3. Restart DSH if it asks you to, then reload DSH Web. The glass is on by default; **Settings → Glass UI** has the controls.

To remove it, uninstall it from **Plugins** (or `dsh plugin --profile web remove dsh-glassui`).

## Settings

All settings apply live and are stored in your DSH profile, so they are also available on the Plugins page and in the configuration file.

| Setting                    | Default   |                                                                                                                                                                                |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Glass material             | on        | Master switch. Off restores DSH's own look immediately.                                                                                                                        |
| Transparency               | 35        | 0 is ultra clear, 100 fully tinted.                                                                                                                                            |
| Wallpaper                  | Automatic | Bay, Sunrise, Meadow, Graphite, none, or a custom image. _Automatic_ uses Bay in a browser and no wallpaper in the macOS desktop app, whose window already shows your desktop. |
| Custom wallpaper URL       | —         | An `https://` URL, a path on the DSH server, or a base64 image `data:` URL.                                                                                                    |
| Sidebar                    | Floating  | _Floating_ insets the sidebar as a rounded pane; _Docked_ keeps DSH's layout.                                                                                                  |
| Code blocks                | Glass     | _Glass_ is a denser tint that keeps code easy to read; _Solid_ keeps DSH's opaque code blocks.                                                                                 |
| Refraction                 | on        | Lens refraction along glass edges (Chromium-based browsers).                                                                                                                   |
| Pointer highlights         | on        | A soft light that follows the mouse across glass. Off on touch screens and with _reduce motion_.                                                                               |
| Leave these elements alone | —         | CSS selectors of elements the plugin must not style, e.g. `.my-plugin-panel`.                                                                                                  |

The settings page also shows a short diagnostic report (surfaces found, tokens missing, scan cost) with a copy button for bug reports.

## For plugin authors

Your plugin does not need to know about Glass UI. If it paints with DSH's tokens and elevations, its panels become glass like DSH's own. If you want control:

```html
<!-- Never touch this element or anything inside it. -->
<div data-glassui-ignore>…</div>

<!-- Ask for glass explicitly: regular, dense or smoke. -->
<div data-glassui-material="dense">…</div>
```

Token overrides applied through DSH's theme API (`ctx.theme.overrideTokens`) are inline values on `<body>` and always take precedence over this plugin; glass is mixed from whatever value is in effect, so your colors show through it.

## Browser support

| Browser                                         | Glass | Refraction |
| ----------------------------------------------- | ----- | ---------- |
| Chrome, Edge, Brave, Arc, Opera (Chromium 111+) | ✓     | ✓          |
| DSH desktop app                                 | ✓     | ✓          |
| Safari 16.4+                                    | ✓     | —          |
| Firefox 115+                                    | ✓     | —          |

Without `backdrop-filter`, surfaces fall back to nearly opaque fills so text stays readable.

## How it works

The Host half adds three rows to every DSH Web page: the settings, a static stylesheet and a tiny script that marks `<html>` before the first paint. The browser half then discovers surfaces by reading computed styles: each watched fill token is nudged by one 8-bit step so its color is unique, and an element whose background matches that color is the surface that token paints. The engine tags it with `data-glassui-*` attributes, and the stylesheet — scoped under `:root[data-glassui]` — turns tagged surfaces into glass by redefining the tokens on them with `color-mix()`.

Details, including the refraction filter and the precedence rules, are in [docs/architecture.md](docs/architecture.md). How compatibility with new DSH releases is checked is in [docs/compatibility.md](docs/compatibility.md).

## Development

```sh
npm ci
npm run check             # typecheck, lint, format, unit tests, build
npm run test:integration  # the built plugin on a DSH-like page in Chromium
npm run test:e2e          # the packed plugin in a real DSH from npm
npm run compat -- --install alpha
```

See [docs/development.md](docs/development.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Glass UI is an independent project, not affiliated with or endorsed by DeepSeek or Apple; see [NOTICE.md](NOTICE.md).
