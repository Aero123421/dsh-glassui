# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.5] - 2026-10-19

- ガラスがオンのとき、入力欄のプレースホルダーと、入力欄の下のラベル（権限モードとモデル名）の文字色をライトは `#4f5459`、ダークは `#c8ccd4` にし、入力欄の塗り下限だけを 0.74 に上げました。ライトとダーク、壁紙 Bay・白・灰 `#808080`・黒、透明度 0 と 35 の 16 条件で、DSH 0.2.1-rc.2 の画面上の文字ピクセルとその直下の背景が 4.5:1 以上です。ダークの `#c8ccd4` は入力した文字より暗いです。ほかの面の塗りは従来の下限のままです。ガラスをオフにすると DSH 本体の色に戻ります。同じ版の画面では、ライトのプレースホルダー `#adb2b8` が白の上で 2.13:1、ダークのキャプションが暗い入力欄 `(44, 44, 46)` の上で 3.76:1 です（以前の読みは 3.61:1）。このプラグインはそのガラスオフの表示は変えません。
- プレースホルダーの色は `[data-composer-placeholder]` に当てます。この属性は DSH 0.2.1-rc.2 にあります。alpha 版では未確認です。属性が無いときはこの色は当たらず、DSH の既定色のままです。ラベルは入力欄カード内の権限ボタンと、`data-model-id` を持つモデルボタンに当てます。
- 「透明度を下げる」では `--glassui-filter` を `none` にし、ぼかし半径を 0 にします。「コントラストを上げる」は従来どおり塗り下限 0.85 で、ぼかしは残します。
- README の検証済み Chromium を英語・日本語とも 141 / 143 / 149 / 154 / 156 に揃えました。
- 日本語の表示には dsh-japanese が必要です。このプラグインは辞書を登録するだけで、言語 `ja` は追加しません。

## [0.2.4] - 2026-10-18

- スライダーのつまみ・数値・専用プレビューをドラッグに即時追従させ、画面全体への適用は離したときに1回行います。キーボード操作は即時適用、保存の300ms debounceは維持します。ドラッグ中は屈折とポインターハイライトを一時停止して負荷を抑えます。
- 自己更新は検証済み tarball そのものを DSH の標準 manager で置き換え、現在のプラグインを先に削除しません。GitHub 導入も検証済みアーカイブへ固定し、設定と bundle の ON/OFF を維持します。旧版からは DSH を停止して CLI で更新してください。
- OS の透明度低減・高コントラスト指定を最終的な背景不透明度の下限へ適用し、コード・メニュー・明示 material にも反映します。
- data-state、aria-expanded、id などの属性を使う除外条件を動的変更に追従させます。
- 長い会話の既存ガラスを独立した面ごとに再判定し、コードブロックの処理をフレーム間に分割します。初期 probe の書込み・読取りをまとめます。
- 狭い設定欄では Glass UI の設定を広い領域に表示し、日本語とスライダーを読める幅に保ちます。
- DSH 0.2.1-rc.2 を E2E の固定版にし、next チャンネルの互換性・夜間 E2E を追加します。README の導入タグを現行版へ揃えます。

## [0.2.3] - 2026-10-15

PR #16 の変更です。自己更新失敗時の復元（#14）と peer 上限の `-0` 境界（#15）を直し、描画コストを削減します（#8・#9 関連）。旧ドラフト PR #13 の内容も含みます。

- DSH 0.2.1-alpha.3 で HMR が有効なとき、導入済みパッケージへの `installBundle` は `already-installed` で失敗し、profile は変わりません。自己更新は、その拒否のあとだけ公式のプラグイン更新と同じ順で `removeBundle` してから入れ直し、ON/OFF を維持します。HMR がない 0.2.1-alpha.2 では、これまでどおり上書き導入して再起動待ちになります。`removeBundle` が例外を投げたとき、または失敗を返したのにパッケージが実際には無いときは、一覧で確認してから削除前の spec を入れ直します。残っている場合は新しい版を入れません。`stop-profile` の上書き導入が例外で落ちたときも失敗として返します。新しい版が `failed`、`cancelled`、`overridden` で、パッケージが無いときも同じ復元をします。復元の request id は `installBundle` の前に操作記録へ保存し、再起動後の照合はその id を使います。戻した版の version が一覧と一致したときだけ `restored` です。一覧に失敗したときや版が違うときは `restored` にしません。復元が `restart-required` のときは再起動待ち（`restore-pending`）のままです。復元が `cancelled` のときは取消のままです。
- `@deepseek-ai/dsh` の peer 範囲を `>=0.2.0-rc.2 <0.3.0-0` にしました。DSH の起動時チェックは prerelease を含むため、0.2.1-alpha.3 とそれ以降の 0.2.x prerelease は対象のまま、`0.3.0-alpha.1` のような 0.3.0 の prerelease は範囲外です。通常の node-semver（prerelease を含めない比較）では、これまでどおり `0.2.1-alpha.3` はこの範囲に入りません。空文字、`*`、`x`、`>=0` は互換性不明です。各 OR 枝には下限と上限の両方が必要で、範囲全体が実行中の系列の内側に収まっている必要があります。0.2 系では `0.2.0-rc.2` より前と `0.3.0-0` 以降を含む範囲（`<0.3.0-0`、`<=0.2.9`、`<0.2.2`、`>=0.0.0 <0.3.0-0`、`<99`、`^0`、`<0.3.0`）は互換性不明です。公開中の `>=0.2.0-rc.2 <0.3.0-0` はこの下限なので対象のままです。
- 屈折マップは同じ RGBA のまま、canvas の `toDataURL` ではなく PNG を直接作ります。ポインターハイライトは矩形が変わらない移動では再計測せず、スクロール、リサイズ、文字の変化、属性の変化、要素のサイズ変化、フォントと画像の読み込み、表面または祖先のアニメーションでは計測し直します。文字データとすべての属性を監視し、変更前の属性値は取りません。最初のサイズ通知が計測時の枠と違うときは位置を捨てます。`document.fonts` が無い文書ではフォントイベントだけを外します。設定画面の診断は値が変わったときだけ再描画します。ぼかし半径、地図の解像度、12ステップ/秒の壁紙、屈折の有無の判定は変えていません。
- 自己更新でパッケージ一覧が一時的に失敗したときは、数回読み直してから不在かどうかを決めます。読み直しがすべて失敗したときは、不在として復元しません。照合で前の版を自動で入れ直すのは、操作記録がこの更新の削除（`removedByUpdate` がその操作 id）を示し、その後に適用や削除の記録がなく、`restart-required` が確定していないときだけです。同じプロセスでは復元を同時に1回だけ行います。プロセスをまたぐ復元は、所有者と期限を書いた排他ロックファイルで1回にします。期限が切れた、読めない、または未来すぎるロックは、退避する直前に inode が同じファイルであることを確かめてから取り直します。別のファイルを退避したときは元に戻します。解放は自分のロックだけです。タイマーが動くあいだは期限を延長します。`installBundle` がメインスレッドを止めても、別スレッドが期限を延長します。プロセスが終わると延長は止まり、期限が切れます。導入の直前に、その操作の request id を操作記録へ残します。古い request id より新しい開始を残します。その記録が残っていて `waitForInstall` が結果を返さないあいだは、自動では入れず「前の版を入れ直す」を出します。手動で入れる前にも一覧を確認し、入っているか一覧に失敗したときは入れません。同じ request id の結果が分かったとき、または一覧で導入済みを見たときに、その記録を消します。試行回数はロックを持ったまま読み、大きい方を残して書き戻します。未完了の導入記録は、より新しい request id に置き換え、結果が分かるまで消しません。`installBundle` の直前に一覧でもう一度不在を確認し、入っているか一覧に失敗したときは入れません。元の導入結果が無く、生きているロックもないとき、または一覧で導入済みを見たあとに不在になったときは、自動では戻さず「前の版を入れ直す」を出します。このプロセスが一度も一覧で見ていない導入と削除は、この更新の削除と記録上は区別できないので、そのときは1回だけ自動で戻します。読めない操作記録は、退避する直前にもう一度読んで壊れていることを確かめ、時刻と無作為な値を付けた名前へ避けます。更新ディレクトリ自体が読めないときは、その回は自動で入れず、設定から入れ直せます。退避した `.stale` と `.release` はロックの寿命より古いものだけ消し、期限の切れていない `.restore.lock` は消しません。期限が切れたロックは、もう一度読んでまだ切れているときだけ消します。別プロセスで導入中の可能性があるとき、回数か間隔の上限に達したときは自動では入れ直しません。それ以外で前の版があるときは、設定画面に「前の版を入れ直す」を出し、`restore-failed` とは表示しません。上限に達したときも、そのボタンからロックと一覧と導入元の確認をして入れ直せます。記録から読んだ導入元は、今の許可条件でもう一度確認します。戻った版が一覧と一致したときだけ `restored` です。
- 互換チェックを pull request の CI で、固定版に加えて npm の `alpha` dist-tag に対しても実行します。

## [0.2.2] - 2026-10-13

- インラインコードの背景を明暗テーマに馴染ませ、独立した不透明度設定（既定72）と文章プレビューを追加。英語・日本語・簡体字中国語、設定保存、コントラスト指定、除外とテーマ上書きに対応します。
- 透明度の全入力値をその場で反映しながら、同じ操作で不要なメニュー描画値・屈折サイズの同期読み取りを削減。新しく開くメニューの検出と屈折のぼかし更新は維持します。
- 静止壁紙を専用描画レイヤーで再利用し、透明度変更ごとのSVG再描画を削減。従来と同じ色・cover配置を保ち、DPR2・回転・印刷・解除を検証します。
- ストリーミング中の除外領域探索を差分化。任意のCSS除外セレクターは従来どおり全体評価し、ポインター位置の計測をDOM書き込みより先にまとめます。
- 壁紙選択一覧の再描画と診断JSONの生成を必要なときに絞り、カスタム壁紙キャッシュに上限を設けます。描画品質・壁紙の動き・保存の300ms debounceは維持します。
- 性能測定と検証範囲は `docs/release-0.2.2.md` に記録。実機iPad/Android、実GPU負荷、電力・温度と長時間利用は未検証です。

## [0.2.1] - 2026-10-13

### Fixed

- Keep TypeScript 6.0.3 within typescript-eslint's supported range and Node.js 22 types aligned with the oldest supported runtime. Dependabot excludes incompatible upgrades so clean installs and release checks remain reproducible.
- Compare the Host's reported runtime version with the package manifest in integration tests so patch releases verify the current build.

### Changed

- Update Playwright to 1.64.0 and React types to 19.3.0.

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

[Unreleased]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.5...HEAD
[0.2.5]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Aero123421/dsh-glassui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Aero123421/dsh-glassui/compare/v0.1.0...v0.1.2
[0.1.0]: https://github.com/Aero123421/dsh-glassui/releases/tag/v0.1.0

<!-- 0.2.0 validation: npm run check (134 unit tests), Chromium integration (45),
DSH 0.2.1-alpha.2 native E2E (12), targeted English/Japanese/Chinese update UI,
compat and pack passed. Hardware Windows/macOS and the unpublished v0.2.0 tag
update remain unverified. -->
