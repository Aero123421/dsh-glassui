# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.1] - 2026-10-13

### Fixed

- Keep the sidebar, panels and composer glass while dragging layout boundaries. Refresh existing surfaces in one frame and retain plain blur until resized refraction filters settle.
- Reclassify surfaces and refraction eligibility when viewport changes alter responsive geometry, and when late stylesheets change a component without changing theme tokens.
- Preserve original theme fills, shadows and menu blur in excluded subtrees, including opt-outs nested inside glass surfaces.
- Leave watched fills unmodified when inline theme overrides make their final computed color indistinguishable from a reserved content fill, and report the collision in diagnostics.

## [0.1.0] - 2026-10-12

### Added

- Glass material for DSH Web's sidebar, composer, dialogs and panels, menus,
  toasts and tooltips, discovered from DSH's design tokens rather than its
  markup.
- Floating sidebar pane, specular rims, contained shadows and a
  transparency (tint) setting.
- Lens refraction along glass edges in Chromium-based browsers.
- Pointer highlights on glass.
- Code blocks as a denser glass, with a setting to keep them solid. Parts that
  repaint their surface's glass (such as a code block's header) are cleared so
  every surface stays one layer.
- Eleven built-in wallpapers with light and dark variants: Bay, Sunrise,
  Meadow, Graphite, Lagoon, Dusk and Dune, and the animated Tide, Aurora,
  Bloom and Prism, which move on the compositor at 12 steps per second and
  hold still with reduced motion. Custom wallpaper URLs.
- **Settings → Glass UI** section with live preview, persistence through DSH's
  settings, diagnostics and English, Japanese and Simplified Chinese text.
- `data-glassui-ignore` and `data-glassui-material` attributes for other
  plugins, and an exclusion setting for users.
- Support for reduced transparency, increased contrast, reduced motion and
  forced colors.
- Compatibility check (`npm run compat`) and an E2E suite against real DSH.

### Fixed

- Serialize settings writes, retain early edits while loading or read-only, and ignore completions after disposal.
- Resume glass after forced colors and update blur for increased contrast.
- Apply live opt-outs, clean detached surfaces and code header marks, and bound queued scan work.
- Keep refraction aligned across Chromium 141, 143 and 149; use normal blur for outer shadows and focus rings.
- Keep large settings dialogs glass instead of treating them as layout panes.
- Keyboard navigation for wallpaper and layout choices, settings layout in narrow dialogs, and clipboard fallback on HTTP connections.
- Omit custom image URLs from diagnostics and enforce the same URL length limit on both halves.
- Include compiled files for GitHub installs and test them in CI.

Supports DSH `>=0.2.0-rc.2 <0.3.0`.

[Unreleased]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Aero123421/dsh-glassui/releases/tag/v0.1.0
