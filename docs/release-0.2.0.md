# 0.2.0

Glass UI設定に、プラグイン本体の更新確認と導入操作を追加しました。ガラス効果をOFFにしても、英語・日本語・簡体字中国語で結果を確認できます。

- 更新前にスライダーなどの保存待ちと進行中の書き込みを完了します。保存拒否・別画面での設定変更があれば導入を止め、未保存のまま再起動を案内しません。
- 固定した正式ReleaseのSemVer、DSH対応範囲、checksum、archive内のpackage名・版・互換性を検証し、標準managerへ渡します。GitHub／tgzの導入経路とbundleのON/OFFを維持し、build scriptを自動承認しません。
- 切断・自己解除・再起動後は保存した操作IDで照合します。結果不明を成功に変換せず、導入版と実行版が一致するまで更新済みと表示しません。
- 壁紙・透明度・除外・font/themeと、他プラグインのstyleを維持します。更新状態は描画エンジンから独立し、system promptを変更しません。

検証：`npm run check`（unit 134件）、Chromium integration（45件）、実DSH 0.2.1-alpha.2の空profileへ配布tgzを導入したnative E2E（12件）、英語・日本語・中国語の更新UI、390px・reduced-motion・効果OFF・保存拒否・他pluginのfont style、compat、packが成功しました。Windows・macOS実機、実アカウント、公開前の0.2.0タグへの自己更新は未検証です。
