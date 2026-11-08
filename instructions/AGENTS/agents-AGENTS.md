# Custom Rules for koppe workspace

- ユーザーのOS環境は Kubuntu 2026.04 です。Windows 向けの手順ではなく、Linux/Kubuntu 向けの手順を常に提供してください。

## ユーザー環境情報
- **PC環境**:
  - OS: Kubuntu 2026.04 LTS
  - CPU: AMD Ryzen 5 3600
  - RAM: DDR4 64GB
  - ストレージ: Samsung 970 EVO 1TB SSD, HDD 1TB, USB外付けポータブルSSD
  - GPU: ASUS GeForce GTX 1660 SUPER
  - マザーボード: ASUS PRIME B450-PLUS (ATX)
  - PCケース: G-GEAR ミドルタワーケース (69JD)
  - ブラウザ: Microsoft Edge Stable
- **スマートフォン環境**:
  - 機種: Galaxy S26 Ultra (16GB RAM / 1TB ストレージ, SIMフリー, SM-S948Q)
  - OS: Android 16
  - ブラウザ: Microsoft Edge Beta
  - 回線: 日本通信「合理的みんなのプラン」 (20GB)
- **自宅回線環境**:
  - 回線: ドコモ HOME 5G (ルーター: HR02)
- **その他ツール**:
  - ユーザスクリプトマネージャー: Violentmonkey

## エージェント行動指針 & 技術ナレッジ
- **GUIアプリの動作確認ポリシー**:
  - GUI起動やデスクトップ設定などの変更時は、ユーザーに動作確認を委ねず、エージェント自身で検証する。
    Xwayland(X11)アプリは `xwininfo -root -tree` / `xprop`、Waylandネイティブは `kdotool` 等で確認する。
    取得できない場合は理由を添えてユーザーに確認を依頼する。
- **Edge/Chromium 拡張機能のPWA化（タスクバー独立表示）**:
  - 拡張機能（`extension://` や `chrome-extension://`）を `--app` オプションで起動する際、KDE Plasma等のタスクバーでEdge本体とグループ化されるのを防ぐためには、実際のウィンドウクラス（`WM_CLASS`）に `.desktop` ファイルの `StartupWMClass` を一致させる必要がある。
  - 拡張機能の場合、クラス名は単なるIDではなく `[拡張機能ID]__index.html`（アンダースコア2つでメインHTMLファイルを繋いだもの）などになるため、必ず実際のウィンドウ情報を調査した上で `StartupWMClass` を指定すること。
