# .gitignore 監査レポート（2026-11-09 00:20）

- ローカルGitリポジトリ: **36件**
- グローバル core.excludesFile: `<home>/.config/git/ignore`
- `.gitignore` なし: **10件**

## 1. 重大（追跡されている秘匿系ファイル）

| リポジトリ | 追跡秘匿ファイル | 内容の秘匿値 |
|---|---|---|
| `.codex/.tmp/plugins` | `plugins/product-design/templates/prototype/.npmrc` | - |
| `chrome-devtools-mcp` | `.npmrc` | - |
| `llama.cpp` | `docs/development/llama-star/idea-arch.key`, `tools/ui/.env.example`, `tools/ui/.npmrc` | - |
| `references/opencode` | `packages/slack/.env.example` | - |

## 2. 警告（未追跡だがignoreされていない秘匿ファイル）

- なし

## 3. ビルド成果物が追跡されているリポジトリ

- `repos/onoderakeita/opencode`: 14件（例: `services/www/src/docs/content/build/client/effect.mdx`, `services/www/src/docs/content/build/client/index.mdx`, `services/www/src/docs/content/build/index.mdx`, `services/www/src/docs/content/build/plugins/cli.mdx`, `services/www/src/docs/content/build/plugins/effect.mdx`）
- `ドキュメント/作業用/ZenzaWatch`: 14件（例: `dist/CapTube.user.js`, `dist/HeatSync.user.js`, `dist/MaskedWatch.user.js`, `dist/MylistFilter.user.js`, `dist/MylistPocket.user.js`）
- `ドキュメント/作業用/opencode`: 14件（例: `services/www/src/docs/content/build/client/effect.mdx`, `services/www/src/docs/content/build/client/index.mdx`, `services/www/src/docs/content/build/index.mdx`, `services/www/src/docs/content/build/plugins/cli.mdx`, `services/www/src/docs/content/build/plugins/effect.mdx`）

## 4. 巨大ファイル（追跡・>1MiB）

- `.codex/.tmp/plugins`: `plugins/creative-production/mcp/server.bundle.mjs` (2137KiB), `plugins/canva/assets/composer-icon.png` (1055KiB)
- `chrome-devtools-mcp`: `src/third_party/lighthouse-devtools-mcp-bundle.js` (3482KiB), `tests/fixtures/example.heapsnapshot` (2313KiB), `tests/fixtures/heap-3.heapsnapshot` (1200KiB)
- `llama.cpp`: `models/ggml-vocab-gemma-4.gguf` (15406KiB), `models/ggml-vocab-command-r.gguf` (10619KiB), `models/ggml-vocab-llama-bpe.gguf` (7634KiB)
- `references/opencode`: `packages/console/app/src/asset/lander/opencode-comparison-min.mp4` (16512KiB), `packages/console/app/src/asset/lander/opencode-min.mp4` (10125KiB), `packages/opencode/test/image/fixtures/picture-5mb-base64.png` (3840KiB)
- `repos/onoderakeita/opencode`: `packages/console/app/src/asset/lander/opencode-comparison-min.mp4` (16512KiB), `packages/console/app/src/asset/lander/desktop-tabs-landscape.mp4` (14557KiB), `packages/console/app/src/asset/lander/opencode-min.mp4` (10125KiB)
- `tavily-mcp`: `assets/demo_new.gif` (4262KiB)
- `waydroid_script`: `assets/1.png` (1060KiB), `assets/6.png` (1053KiB)
- `ドキュメント/作業用/-/waydroid_script`: `assets/1.png` (1060KiB), `assets/6.png` (1053KiB)
- `ドキュメント/作業用/UserScripts`: `Switch Traditional Chinese and Simplified Chinese/cedict_ts.u8` (8664KiB), `Switch Traditional Chinese and Simplified Chinese/pinyinTree.json` (7819KiB), `Switch Traditional Chinese and Simplified Chinese/dict.txt` (4409KiB)
- `ドキュメント/作業用/ZenzaWatch`: `sample/765Pro!.html` (3102KiB)
- `ドキュメント/作業用/opencode`: `packages/console/app/src/asset/lander/opencode-comparison-min.mp4` (16512KiB), `packages/console/app/src/asset/lander/desktop-tabs-landscape.mp4` (14557KiB), `packages/console/app/src/asset/lander/opencode-min.mp4` (10125KiB)

## 5. .gitignoreがないリポジトリ

- `.cargo/advisory-db`（追跡1329件, remote=https://github.com/RustSec/advisory-db.git）
- `.codex/memories`（追跡7件, remote=なし）
- `.openclaw/workspace`（追跡8件, remote=https://github.com/onoderakeita/openclaw-workspace.git）
- `knowledge`（追跡10件, remote=https://github.com/onoderakeita/knowledge.git）
- `repos/onoderakeita/Pixiv_Ultimate_Filter`（追跡3件, remote=https://github.com/onoderakeita/Pixiv_Ultimate_Filter.git）
- `repos/onoderakeita/X-Twitter-Search-and-Timeline-Mute`（追跡1件, remote=https://github.com/onoderakeita/X-Twitter-Search-and-Timeline-Mute.git）
- `repos/onoderakeita/kaibunshoHokanko`（追跡36件, remote=https://github.com/onoderakeita/kaibunshoHokanko.git）
- `repos/onoderakeita/onetab`（追跡1件, remote=https://github.com/onoderakeita/-----onetab---.git）
- `repos/onoderakeita/pixivAndroidtool`（追跡0件, remote=https://github.com/onoderakeita/pixivAndroidtool.git）
- `repos/onoderakeita/rustscript`（追跡1件, remote=https://github.com/onoderakeita/-rustscript.git）

## 6. リポジトリ別 概要

| リポジトリ | .gitignore | 行数 | 追跡 | 追跡秘匿 | 追跡ビルド | 未ignore秘匿 |
|---|---|---|---|---|---|---|
| `.cargo/advisory-db` | **✗** | 0 | 1329 | 0 | 0 | 0 |
| `.codex/.tmp/plugins` | ✓ | 3 | 5386 | 1 | 0 | 0 |
| `.codex/memories` | **✗** | 0 | 7 | 0 | 0 | 0 |
| `.config/opencode` | ✓ | 22 | 104 | 0 | 0 | 0 |
| `.openclaw/workspace` | **✗** | 0 | 8 | 0 | 0 | 0 |
| `UxPlay` | ✓ | 2 | 89 | 0 | 0 | 0 |
| `chrome-devtools-mcp` | ✓ | 70 | 273 | 1 | 0 | 0 |
| `howdy-notifier` | ✓ | 1 | 4 | 0 | 0 | 0 |
| `knowledge` | **✗** | 0 | 10 | 0 | 0 | 0 |
| `llama.cpp` | ✓ | 102 | 3765 | 3 | 0 | 0 |
| `references/opencode` | ✓ | 30 | 5146 | 1 | 0 | 0 |
| `repos/onoderakeita/Pixiv_Ultimate_Filter` | **✗** | 0 | 3 | 0 | 0 | 0 |
| `repos/onoderakeita/X-Twitter-Search-and-Timeline-Mute` | **✗** | 0 | 1 | 0 | 0 | 0 |
| `repos/onoderakeita/kaibunshoHokanko` | **✗** | 0 | 36 | 0 | 0 | 0 |
| `repos/onoderakeita/onetab` | **✗** | 0 | 1 | 0 | 0 | 0 |
| `repos/onoderakeita/opencode` | ✓ | 36 | 9253 | 0 | 14 | 0 |
| `repos/onoderakeita/pixivAndroidtool` | **✗** | 0 | 0 | 0 | 0 | 0 |
| `repos/onoderakeita/rustscript` | **✗** | 0 | 1 | 0 | 0 | 0 |
| `repos/onoderakeita/workflows` | ✓ | 1 | 10 | 0 | 0 | 0 |
| `scrcpy` | ✓ | 10 | 357 | 0 | 0 | 0 |
| `tavily-mcp` | ✓ | 3 | 13 | 0 | 0 | 0 |
| `waydroid_script` | ✓ | 69 | 42 | 0 | 0 | 0 |
| `ドキュメント/作業用/-` | ✓ | 9 | 10 | 0 | 0 | 0 |
| `ドキュメント/作業用/-/waydroid_script` | ✓ | 69 | 42 | 0 | 0 | 0 |
| `ドキュメント/作業用/Policy_discussion_casualconversation` | ✓ | 6 | 49 | 0 | 0 | 0 |
| `ドキュメント/作業用/UserScripts` | ✓ | 6 | 101 | 0 | 0 | 0 |
| `ドキュメント/作業用/ZenzaWatch` | ✓ | 18 | 237 | 0 | 14 | 0 |
| `ドキュメント/作業用/jarvis/jarvis` | ✓ | 32 | 154 | 0 | 0 | 0 |
| `ドキュメント/作業用/openIllustration` | ✓ | 13 | 54 | 0 | 0 | 0 |
| `ドキュメント/作業用/opencode` | ✓ | 36 | 9254 | 0 | 14 | 0 |
| `ドキュメント/作業用/opencode_opencoderust/opencoderust/OpenCodeRust` | ✓ | 12 | 355 | 0 | 0 | 0 |
| `ドキュメント/作業用/openrustbooks` | ✓ | 22 | 66 | 0 | 0 | 0 |
| `ドキュメント/作業用/rustscript/system_all_update` | ✓ | 1 | 9 | 0 | 0 | 0 |
| `ドキュメント/作業用/rustscript/システム診断` | ✓ | 2 | 43 | 0 | 0 | 0 |
| `ドキュメント/作業用/rustscript/ストレージ掃除/KubuntuStrageCleanRustscript` | ✓ | 2 | 7 | 0 | 0 | 0 |
| `ドキュメント/作業用/userscript/userscript` | ✓ | 15 | 24 | 0 | 0 | 0 |
