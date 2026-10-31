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

Requires DSH `>=0.2.0-rc.2 <0.3.0-0`. DSH admits prereleases in that range, including 0.2.1-alpha.3 and later 0.2.x prereleases, and excludes 0.3.0 prereleases. An empty peer range, a wildcard (`*`, `x`, `>=0`), a range missing either end (`<0.3.0-0`, `<=0.2.9`, `<0.2.2`), or a range that leaves the running line (`>=0.0.0 <0.3.0-0`, `<99`, `^0`, or `<0.3.0` on 0.2) is treated as compatibility-unknown. Browser-tested with 0.2.0-rc.2 and 0.2.1-rc.2; token and API contracts also checked on 0.2.1-alpha.5. For later coverage, see [compatibility](https://github.com/Aero123421/dsh-glassui/blob/main/docs/compatibility.md).

1. In DSH Web, open **Plugins → Add plugin** and enter `github:Aero123421/dsh-glassui#v0.2.7`.
2. Or install from a terminal:

   ```sh
   dsh plugin --profile web add github:Aero123421/dsh-glassui#v0.2.7
   ```

3. Restart DSH if it asks you to, then reload DSH Web. The glass is on by default; **Settings → Glass UI** has the controls.

This plugin registers English, Japanese and Chinese dictionaries and does not add languages. DSH 0.2.2-alpha.2 includes 日本語 in its language menu; select it to use the bundled Japanese dictionary. On older DSH releases that only list 中文 and English, install [dsh-japanese](https://github.com/Aero123421/dsh-japanese) to add 日本語. zh-CN uses the Chinese dictionary bundled here.

The [release tarball](https://github.com/Aero123421/dsh-glassui/releases/latest) can also be installed by its URL. Both distributions include the compiled plugin.

To remove it, uninstall it from **Plugins** (or `dsh plugin --profile web remove dsh-glassui`).

## Settings

Settings are applied and stored in your DSH profile, so they are also available on the Plugins page and in the configuration file.

| Setting                    | Default   |                                                                                                                                                                                                                                              |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glass material             | on        | Master switch. Off restores DSH's own look immediately.                                                                                                                                                                                      |
| Transparency               | 35        | 0 is ultra clear, 100 fully tinted.                                                                                                                                                                                                          |
| Wallpaper                  | Automatic | Bay, Sunrise, Meadow, Graphite, Lagoon, Dusk, Dune, the moving Tide, Aurora, Bloom and Prism, none, or a custom image. _Automatic_ uses Bay in a browser and no wallpaper in the macOS desktop app, whose window already shows your desktop. |
| Custom wallpaper URL       | —         | An `http://` or `https://` URL, a path on the DSH server, or a base64 image `data:` URL.                                                                                                                                                     |
| Sidebar                    | Floating  | _Floating_ insets the sidebar as a rounded pane; _Docked_ keeps DSH's layout.                                                                                                                                                                |
| Code blocks                | Glass     | _Glass_ is a denser tint that keeps code easy to read; _Solid_ keeps DSH's opaque code blocks.                                                                                                                                               |
| Inline-code opacity        | 72        | Independent background opacity (0–100) with a live text preview; 60–85 is recommended. Contrast preferences can raise the effective opacity.                                                                                                 |
| Refraction                 | on        | Lens refraction along glass edges (Chromium-based browsers). Off with _reduce transparency_.                                                                                                                                                 |
| Pointer highlights         | on        | A soft light that follows the mouse across glass. Off on touch screens and with _reduce motion_ or _reduce transparency_.                                                                                                                    |
| Leave these elements alone | —         | CSS selectors of elements the plugin must not style, e.g. `.my-plugin-panel`.                                                                                                                                                                |

Sliders preview immediately in their own sample while you drag. Release to apply the value across the page; keyboard edits apply immediately. This keeps dragging responsive without rebuilding every glass surface for each input.

The settings page also shows a short diagnostic report (surfaces found, tokens missing, scan cost) with a copy button for bug reports.

### Wallpapers

![The built-in wallpapers, light above dark](docs/images/wallpapers.png)

_Live_ wallpapers move a few large layers on the compositor; nothing runs on the main thread while they play. They step a dozen times a second, which is smooth at their slow pace and lets the browser redraw the glass above them at a fifth of the display's refresh rate. With _reduce motion_ they show their first frame.

## Plugin updates

Settings → Glass UI shows the running version and **Check plugin update**. Checking and installing are separate actions. Before installing, pending settings writes are saved; refused writes and settings changed in another window stop the update.

The Host checks a fixed GitHub stable release, DSH peer ranges, bounded downloads, SHA-256 and the archive manifest. It hands that exact verified tarball to DSH’s plugin manager, without removing the current plugin first. Settings and bundle ON/OFF are kept. Updates from both GitHub and release-tarball installations are pinned to the verified archive in the profile’s `.dsh-glassui-updates/` directory. Keep an archive while the profile references it. Development paths and read-only profiles use the linked manual update.

An operation ID reconciles a lost response without installing again. The UI checks installed and running versions before reporting success, or asks for a Host restart when needed. A manager refusal leaves the current installation in place; use the manual update instructions rather than removing it.

**Updating from v0.2.3 or earlier:** stop DSH, run the install command above for v0.2.7, then start DSH and reload Web. This avoids the old updater’s remove-then-install path. Old recovery journals remain readable while the plugin is installed; if an old update already left the plugin absent, install it through Plugins or the CLI.

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

| Browser                                                                          | Glass | Refraction |
| -------------------------------------------------------------------------------- | ----- | ---------- |
| Chrome, Edge, Brave, Arc, Opera (Chromium 111+, tested with 141/143/149/154/156) | ✓     | ✓          |
| DSH desktop app                                                                  | ✓     | ✓          |
| Safari 16.4+                                                                     | ✓     | —          |
| Firefox 115+                                                                     | ✓     | —          |

Without `backdrop-filter`, surfaces fall back to nearly opaque fills so text stays readable.

While glass is on, the composer placeholder and the labels under the input (the permission mode, such as Workspace Write, and the model name) use plugin colors. Light uses `#4f5459` for both. In dark, the placeholder is `#b0b4ba` and the labels, including the model name, are `#d4d8de`. `#d4d8de` is darker than typed text (`#f3f4f6`) and at least as light as DSH's secondary gray `#cfd3d6`. `#b0b4ba` is also darker than that typed text. The light composer fill is at least 0.74. The dark composer uses the normal fill, with no 0.74 floor. On a white wallpaper the dark model name and labels are 2.17:1 at tint 0 and 4.59:1 at tint 35, so tint 0 is under 4.5:1. In dark, the placeholder against typed text is 1.99:1, below 0.2.4's 3.55:1, which keeps the placeholder's contrast against the background. Turning glass off restores DSH's own colors. On DSH 0.2.1-rc.2 the restored light placeholder (`#adb2b8`) is 2.13:1 on white, and the dark caption on the dark input is 3.76:1 (an earlier reading of that caption was 3.61:1). This plugin leaves that glass-off rendering as DSH draws it. The model button's effort label and the 1017 badge keep DSH's colors. Readings of that effort label on DSH 0.2.1-rc.2, three times with a spread of 0.00, are under 3:1 in all eight light conditions: black at tint 0 is 1.50:1, black at tint 35 is 1.66:1, white at tint 0 is 2.13:1, white at tint 35 is 2.13:1, gray `#808080` at tint 0 is 1.82:1, gray `#808080` at tint 35 is 1.91:1, Bay at tint 0 is 1.88:1, and Bay at tint 35 is 1.95:1. In dark, under 3:1 is four conditions: white at tint 0 (1.19:1), white at tint 35 (1.77:1), gray `#808080` at tint 0 (2.17:1), and Bay at tint 0 (2.37:1). Gray `#808080` at tint 35 is 3.06:1, Bay at tint 35 is 3.29:1, black at tint 0 is 5.23:1, and black at tint 35 is 4.83:1. These match 0.2.4 except light black at tint 0, which is 1.50:1 instead of 1.82:1. If a later DSH release no longer matches these composer selectors, the plugin colors do not apply and DSH's own colors remain.

With pnpm 12, adding or updating a plugin can fail with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` when the profile lockfile contains a dependency that was published less than 24 hours earlier. pnpm then empties that profile's `node_modules`, and DSH does not put it back, so **every plugin in the same profile stops loading**. This is not a defect in this plugin; it can happen no matter which plugin you add or update.

- Add and update plugins with pnpm 10.
- To repair a broken profile, run `dsh plugin --profile web install` with pnpm 10.
- pnpm 11 stops with `ERR_PNPM_UNEXPECTED_STORE`, and it does not empty `node_modules`.

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
