# Security policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/Aero123421/dsh-glassui/security/advisories/new)
rather than in a public issue. Include the plugin and DSH versions, the browser,
and steps to reproduce. You can expect an acknowledgement within a week.

## Scope and design

Glass UI runs inside DSH Web with the same privileges as any DSH plugin. It is
designed to keep that footprint small:

- **User-requested update access.** Update checks and installs contact the fixed
  GitHub repository and approved asset redirects, with time and size limits.
  Package identity, compatibility and SHA-256 are checked before handing an
  install to DSH. Wallpapers are inline SVG; a custom image URL is loaded by
  the browser as CSS. There is no telemetry.
- **No code from settings.** Settings are validated on both halves. A custom
  wallpaper URL must be `https:`/`http:`, a same-origin path, or a base64
  _raster_ image `data:` URL (SVG is rejected because it can reference other
  resources), and may not contain characters that could end a CSS `url()`.
  Values embedded in the boot script are JSON with `<` escaped.
- **No DOM injection beyond its namespace.** The plugin writes only
  `data-glassui-*` attributes, `--glassui-*` custom properties, design tokens on
  the elements it styles, and its own `<style>`/`<svg>` elements. It never sets
  `innerHTML` on DSH content.
- **No install scripts and no runtime dependencies.** The release tarball
  contains only the built files; its `package.json` has no `scripts`.

Each release carries `SHA256SUMS` and a GitHub build provenance attestation:

```sh
sha256sum -c SHA256SUMS --ignore-missing
gh attestation verify dsh-glassui-<version>.tgz --repo Aero123421/dsh-glassui
```
