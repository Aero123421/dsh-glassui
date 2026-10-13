# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.1] - 2026-10-13

- インラインコードの背景を明暗テーマに馴染ませ、独立した不透明度設定（既定72）と文章プレビューを追加。英語・日本語・簡体字中国語、設定保存、コントラスト指定、除外とテーマ上書きに対応します。
- 透明度の全入力値をその場で反映しながら、同じ操作で不要なメニュー描画値・屈折サイズの同期読み取りを削減。新しく開くメニューの検出と屈折のぼかし更新は維持します。
- 静止壁紙を専用描画レイヤーで再利用し、透明度変更ごとのSVG再描画を削減。従来と同じ色・cover配置を保ち、DPR2・回転・印刷・解除を検証します。
- ストリーミング中の除外領域探索を差分化。任意のCSS除外セレクターは従来どおり全体評価し、ポインター位置の計測をDOM書き込みより先にまとめます。
- 壁紙選択一覧の再描画と診断JSONの生成を必要なときに絞り、カスタム壁紙キャッシュに上限を設けます。描画品質・壁紙の動き・保存の300ms debounceは維持します。
- 性能測定と検証範囲は `docs/release-0.2.1.md` に記録。実機iPad/Android、実GPU負荷、電力・温度と長時間利用は未検証です。

## [0.2.0] - 2026-10-13

- Glass UI設定に独立したプラグイン更新欄を追加。英語・日本語・簡体字中国語で、確認・検証・導入・再起動待ち・結果不明を表示します。
- 更新前にdebounce中と進行中の設定保存を完了し、保存拒否や他画面の設定変更では導入を止めます。効果OFFでも更新欄を読めます。
- 固定ReleaseのSemVer・DSH対応範囲・checksum・archive内manifestを検証し、標準managerにbundleのON/OFFと操作IDを渡します。GitHubとtgzの導入経路を維持します。
- 切断と自己解除の後も操作記録を照合します。導入版と実行版が一致するまで成功と表示せず、build scriptを自動承認しません。壁紙・除外・font/theme・他pluginのstyleを維持します。

## [0.1.2] - 2026-10-13

Includes the fixes prepared for v0.1.1, whose release checks failed before publication.

### Fixed

- Keep the sidebar, panels and composer glass while dragging layout boundaries. Refresh existing surfaces in one frame and retain plain blur until resized refraction filters settle.
- Reclassify surfaces and refraction eligibility when viewport changes alter responsive geometry, and when late stylesheets change a component without changing theme tokens.
- Preserve original theme fills, shadows and menu blur in excluded subtrees, including opt-outs nested inside glass surfaces.
- Leave watched fills unmodified when inline theme overrides make their final computed color indistinguishable from a reserved content fill, and report the collision in diagnostics.
- Refresh the menu-filter signature when tint changes so newly opened or re-enabled menus are discovered reliably.

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

[Unreleased]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.0...v0.1.2
[0.1.0]: https://github.com/Aero123421/dsh-glassui/releases/tag/v0.1.0

<!-- 0.2.0 validation: npm run check (134 unit tests), Chromium integration (45),
DSH 0.2.1-alpha.2 native E2E (12), targeted English/Japanese/Chinese update UI,
compat and pack passed. Hardware Windows/macOS and the unpublished v0.2.0 tag
update remain unverified. -->
