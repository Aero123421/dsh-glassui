# Development

## Requirements

- Node.js 22.19 or newer (TypeScript sources run directly through Node's type stripping in the unit tests)
- npm 10+
- For integration and E2E tests: Chromium for Playwright (`npx playwright install chromium`)
- For E2E tests: [pnpm](https://pnpm.io) on `PATH` — DSH's plugin manager installs plugins with it

```sh
npm ci
npm run check
```

## Layout

| Path                 | Contents                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/host/`          | Host half: settings schema and boot rows. Bundled to `dist/index.js` (Node ESM).                                                                                                  |
| `src/client/`        | Browser half: controller, settings page and the engine. Bundled to `dist/client.js` in DSH's lazy module format.                                                                  |
| `src/client/engine/` | Discovery (`engine.ts`, `classify.ts`, `probes.ts`), dynamic CSS (`sheet.ts`), refraction (`lens.ts`, `lens-map.ts`, `png-url.ts`, `ink.ts`), highlights, wallpaper, environment. |
| `src/shared/`        | Shared by both halves: settings, token list, colors, wallpapers, the static stylesheet, DOM names.                                                                                |
| `test/unit/`         | Pure logic, run on Node (`node --test`).                                                                                                                                          |
| `test/integration/`  | The built plugin on a DSH-like fixture page in Chromium, plus the Host half.                                                                                                      |
| `test/e2e/`          | The packed plugin installed into a real DSH from npm, with a mock model.                                                                                                          |
| `scripts/`           | Build, pack, compatibility check, documentation screenshots, `perf-profile.mjs`.                                                                                                  |

## Scripts

| Command                                                  |                                                                                                                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                                          | `dist/index.js` and `dist/client.js`.                                                                                                                                                                    |
| `npm run typecheck` / `lint` / `format` / `format:check` | TypeScript (strict), ESLint (type-aware), Prettier.                                                                                                                                                      |
| `npm test`                                               | Unit tests.                                                                                                                                                                                              |
| `npm run test:integration`                               | Builds, then runs the Chromium integration tests.                                                                                                                                                        |
| `npm run test:e2e`                                       | Builds, packs, installs DSH (cached in `.cache/e2e/`) and the plugin into an isolated world, and drives DSH Web. `DSH_VERSION=alpha` tests another release; screenshots and logs go to `artifacts/e2e/`. |
| `npm run compat -- --install <version>`                  | Static compatibility check against a DSH release.                                                                                                                                                        |
| `npm run pack`                                           | Release tarball and `SHA256SUMS` in `artifacts/`.                                                                                                                                                        |
| `npm run screenshots`                                    | Regenerates `docs/images/` from a real DSH.                                                                                                                                                              |
| `npm run check`                                          | Everything CI runs before the browser tests.                                                                                                                                                             |

Set `GLASSUI_CHROMIUM=/path/to/chrome` to use a specific browser in integration and E2E tests.

## Trying a change in DSH

```sh
npm run pack
dsh plugin --profile web add ./artifacts/dsh-glassui-0.1.0.tgz
```

After changing only `src/client/`, rebuilding and copying `dist/client.js` over the installed copy (`$DSH_HOME/profiles/web/node_modules/dsh-glassui/dist/`) and reloading the page is enough. Changes to `src/host/` or `src/shared/stylesheet.ts` need a DSH restart, because the Host half renders the boot rows.

In the browser console, `__DSH_GLASSUI_DEBUG__.diagnostics()` shows what the engine found.

## Principles

- **No class names, no DOM structure.** Anything the plugin needs from DSH goes through `src/shared/tokens.ts` or a documented platform contract, and is checked by `scripts/compat.mjs`.
- **Own namespace only.** Attributes `data-glassui-*`, properties `--glassui-*`, elements `[data-glassui-owned]`. `GlassEngine.stop()` must leave the page exactly as DSH rendered it; the tests compare against a page without the plugin.
- **Under, not over.** No `!important`; explicit customizations (inline token overrides, other plugins' styles) win.
- **Reads before writes, under a budget.** Engine work is batched per animation frame.
- **No runtime dependencies or install scripts.** Host network access is limited to user-requested checks and installs from the fixed GitHub release source.

## Releasing

1. Update `version` in `package.json`, its lockfile and `CHANGELOG.md`, then run `npm run build` and commit `dist/` so GitHub installs contain the compiled plugin.
2. If DSH released a new version, run `DSH_VERSION=<version> npm run test:e2e` and adjust `peerDependencies` and `glassui.e2e.dsh`.
3. Merge, then push a tag `v<version>`. The release workflow verifies, runs the E2E suite, packs the tarball and publishes a GitHub Release with `SHA256SUMS` and a build provenance attestation. Nothing is published to npm.

## Plugin update ownership

The Host verifies release metadata, peer ranges, bounded downloads, SHA-256 and the archive manifest, then passes the verified local archive to the public `installBundle` API. It never removes the installed bundle to update it. The profile remains pinned to that archive, including updates that started from a GitHub spec. DSH owns package writes, rollback, HMR and restart-required outcomes. If a manager refuses replacement, keep the current installation and offer a manual update.

The Client settles debounced and in-flight settings writes before admission; the Host checks that snapshot again before invocation. The operation UUID is persisted before installation. Lost responses remain unknown until installed and running versions can be verified. Old v0.2.3 recovery journals remain readable for migration, but their restore code can only run while this plugin is installed. An absent plugin must be installed using Plugins or the CLI.

Pointer slider edits stay local to the native control and preview sample until release, blur or cancellation commits the final value. Keyboard edits commit immediately. During adjustment, SVG refraction and pointer highlights pause; the final blur and lens are restored on release. This avoids inherited page-wide custom-property changes for every pointer input. Save debounce remains 300 ms.

Each reclassification batch keeps its old marks until reads and writes can be completed together. Chrome is refreshed together in the first batch. Independent code-block families are grouped into batches of about 64 elements under the frame budget, retaining each block with its banner and echoes. Discovery resumes when these batches settle. Palette reads pre-create probes before reading styles. Exclusion selectors observe state attributes, ignoring the engine’s own marks.

Use `GLASSUI_E2E_ARTIFACT_DIR` to store screenshots/logs outside the checkout. E2E tests cover the real settings page and old-to-new updates through the actual manager, including settings preservation, a disabled bundle, refused installation and restart. Release retrieval in the update test is test data; archive validation and pnpm installation are real.
