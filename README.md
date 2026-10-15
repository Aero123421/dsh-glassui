# Glass UI for DSH

**A Liquid Glass–style material for DSH (DeepSeek Harness) Web.** Translucent, blurred and refracting glass for the sidebar, composer, dialogs, menus and toasts — over a wallpaper of your choice. An unofficial plugin, independent of DeepSeek and Apple.

[日本語](README.ja.md)

![DSH Web with Glass UI, light palette](docs/images/chat-light.png)

<table>
  <tr>
    <td><img src="docs/images/chat-dark.png" alt="Dark palette"></td>
    <td><img src="docs/images/settings-light.png" alt="The Glass UI settings section"></td>
  </tr>
</table>

## Highlights

- **Follows DSH, not its markup.** Surfaces are found by the design tokens DSH paints them with (`--dsw-*`), never by class names, Compatibility checks and tests against real DSH detect changes to those tokens and APIs.
- **Stays out of the way.** Theme overrides on `<body>` take precedence. You can exclude individual elements, or turn glass off without reloading.
- **Fast.** No per-frame work while idle; DOM changes are scanned in time-sliced batches and rendered Markdown is skipped entirely.
- **Accessible.** Honors _reduce transparency_, _increase contrast_, _reduce motion_ and Windows high-contrast mode. Code blocks become a denser glass that keeps syntax colors legible — or stay solid, if you prefer.
- **Real refraction where the browser can do it.** In Chromium-based browsers the edges of the composer, menus and toasts bend the background like a lens. Elsewhere you get the same glass without the lens.
- **Eleven wallpapers, four of them alive.** Ribbons and soft color fields in light and dark variants; the _Live_ ones drift slowly, redrawing the page only 12 times a second and holding still with _reduce motion_.
- **Local wallpapers, no telemetry.** Wallpapers are small inline SVGs. The Host contacts the fixed GitHub release service only when you request an update check or install.

## Install

Requires DSH `>=0.2.0-rc.2 <0.3.0-0`. DSH admits prereleases in that range, including 0.2.1-alpha.3 and later 0.2.x prereleases, and excludes 0.3.0 prereleases. An empty peer range, a wildcard (`*`, `x`, `>=0`), a range missing either end (`<0.3.0-0`, `<=0.2.9`, `<0.2.2`), or a range that leaves the running line (`>=0.0.0 <0.3.0-0`, `<99`, `^0`, or `<0.3.0` on 0.2) is treated as compatibility-unknown. Tested with 0.2.0-rc.2, 0.2.1-alpha.2, and 0.2.1-alpha.3.

1. In DSH Web, open **Plugins → Add plugin** and enter `github:Aero123421/dsh-glassui#v0.2.2`.
2. Or install from a terminal:

   ```sh
   dsh plugin --profile web add github:Aero123421/dsh-glassui#v0.2.2
   ```

3. Restart DSH if it asks you to, then reload DSH Web. The glass is on by default; **Settings → Glass UI** has the controls.

The [release tarball](https://github.com/Aero123421/dsh-glassui/releases/latest) can also be installed by its URL. Both distributions include the compiled plugin.

To remove it, uninstall it from **Plugins** (or `dsh plugin --profile web remove dsh-glassui`).

## Settings

All settings apply live and are stored in your DSH profile, so they are also available on the Plugins page and in the configuration file.

| Setting                    | Default   |                                                                                                                                                                                                                                              |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glass material             | on        | Master switch. Off restores DSH's own look immediately.                                                                                                                                                                                      |
| Transparency               | 35        | 0 is ultra clear, 100 fully tinted.                                                                                                                                                                                                          |
| Wallpaper                  | Automatic | Bay, Sunrise, Meadow, Graphite, Lagoon, Dusk, Dune, the moving Tide, Aurora, Bloom and Prism, none, or a custom image. _Automatic_ uses Bay in a browser and no wallpaper in the macOS desktop app, whose window already shows your desktop. |
| Custom wallpaper URL       | —         | An `http://` or `https://` URL, a path on the DSH server, or a base64 image `data:` URL.                                                                                                                                                     |
| Sidebar                    | Floating  | _Floating_ insets the sidebar as a rounded pane; _Docked_ keeps DSH's layout.                                                                                                                                                                |
| Code blocks                | Glass     | _Glass_ is a denser tint that keeps code easy to read; _Solid_ keeps DSH's opaque code blocks.                                                                                                                                               |
| Inline-code opacity        | 72        | Independent background opacity (0–100) with a live text preview; 60–85 is recommended. Contrast preferences can raise the effective opacity.                                                                                                 |
| Refraction                 | on        | Lens refraction along glass edges (Chromium-based browsers).                                                                                                                                                                                 |
| Pointer highlights         | on        | A soft light that follows the mouse across glass. Off on touch screens and with _reduce motion_.                                                                                                                                             |
| Leave these elements alone | —         | CSS selectors of elements the plugin must not style, e.g. `.my-plugin-panel`.                                                                                                                                                                |

The settings page also shows a short diagnostic report (surfaces found, tokens missing, scan cost) with a copy button for bug reports.

### Wallpapers

![The built-in wallpapers, light above dark](docs/images/wallpapers.png)

_Live_ wallpapers move a few large layers on the compositor; nothing runs on the main thread while they play. They step a dozen times a second, which is smooth at their slow pace and lets the browser redraw the glass above them at a fifth of the display's refresh rate. With _reduce motion_ they show their first frame.

## Plugin updates

Settings → Glass UI shows the running version and **Check plugin update**. Checking and installing are separate actions. The updater flushes pending settings writes before installation and stops on refused saves or settings changed in another window. It keeps wallpaper, tint, exclusions and the bundle’s enabled state. Checking does not recreate the glass engine, and works with the material off.

The Host checks a fixed GitHub stable release, DSH peer ranges, bounded downloads, SHA-256 and the archive’s package identity/version before delegating to DSH’s manager. GitHub installations advance to an explicit release tag; release tarballs remain tarballs in the profile’s `.dsh-glassui-updates/` directory. Custom development paths, missing managers and read-only profiles use the linked manual update. Pins are never changed to a floating latest spec; build scripts are not automatically approved.

On DSH 0.2.1-alpha.3 with HMR, `installBundle` of an already installed package fails with `already-installed` and does not change the profile. The updater then uses the same order as **Plugins → Update**: remove this plugin, then install the release, keeping the previous on/off state. Without HMR, including 0.2.1-alpha.2, removal of a running plugin is refused (`stop-profile`) and the updater installs over the current package, which waits for a restart. If the new install does not finish after a removal, the result stays unknown. A later check puts the previous version back only when the update record shows that this update removed it and nothing later applied or removed it. Removing the plugin yourself does not cause an automatic reinstall; Settings offers **Reinstall previous version**. A finished restart-required update is not installed again. Automatic reinstall does not start while another install may still be running, and it stops after repeated attempts. Two restores at the same time install the previous version once. If this plugin has already seen the package installed and it is later missing, Settings offers the reinstall instead of doing it automatically. A record that cannot be read is set aside; the reinstall button and the Releases link remain available.

A saved operation ID reconciles a lost response without resending installation. Unknown results remain unknown. The UI confirms both installed and running versions before reporting success, and asks you to restart after current work when needed. Keep staged tarballs while the profile references them.

## For plugin authors

Your plugin does not need to know about Glass UI. Panels using the watched DSH tokens and elevations can be discovered automatically. If you want control:

```html
<!-- Never touch this element or anything inside it. -->
<div data-glassui-ignore>…</div>

<!-- Ask for glass explicitly: regular, dense or smoke. -->
<div data-glassui-material="dense">…</div>
```

Token overrides applied through DSH's theme API (`ctx.theme.overrideTokens`) are inline values on `<body>` and always take precedence over this plugin; glass is mixed from whatever value is in effect, so your colors show through it.

## Browser support

| Browser                                                                  | Glass | Refraction |
| ------------------------------------------------------------------------ | ----- | ---------- |
| Chrome, Edge, Brave, Arc, Opera (Chromium 111+, tested with 141/143/149) | ✓     | ✓          |
| DSH desktop app                                                          | ✓     | ✓          |
| Safari 16.4+                                                             | ✓     | —          |
| Firefox 115+                                                             | ✓     | —          |

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
