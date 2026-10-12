# Contributing

Thanks for helping. Bug reports, compatibility reports for new DSH releases and
pull requests are all welcome.

## Reporting a problem

Open an issue with:

- the DSH version (`dsh --version`), the plugin version and the browser;
- what you expected and what happened, with a screenshot if it is visual;
- the diagnostic report from **Settings → Glass UI → Compatibility → Copy diagnostics**.

If another plugin is involved, name it — coexistence problems are treated as bugs.

## Making a change

1. Read [docs/architecture.md](docs/architecture.md) and the principles in
   [docs/development.md](docs/development.md). In short: no DSH class names, no
   writes outside the plugin's namespace, no `!important`, no runtime
   dependencies.
2. `npm ci`, then make the change with tests:
   - pure logic → `test/unit/`
   - engine behavior on a page → `test/integration/`
   - anything that depends on real DSH → `test/e2e/`
3. Run `npm run check` and `npm run test:integration`. Run `npm run test:e2e`
   when the change touches discovery, settings or the Host half.
4. Keep commits focused and messages in the imperative ("Add …", "Fix …").
   Update `CHANGELOG.md` under _Unreleased_ for user-visible changes.

New user-facing text needs English, Japanese and Simplified Chinese strings in
`src/client/settings/locales.ts`.

## Adding a DSH token

Add it to `src/shared/tokens.ts`, run `npm run compat -- --install <version>`
for the oldest and newest supported DSH, and add a case to the integration
fixture (`test/integration/fixture.mjs`) that paints with it.

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
