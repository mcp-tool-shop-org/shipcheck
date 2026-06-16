<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/shipcheck/readme.jpg" alt="Shipcheck" width="400">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Product standards for MCP Tool Shop.<br>
  Templates, contracts, and adoption guides that define what "done" means before anything ships.
</p>

---

## なぜか

「完了」は、以前はコードが正常に動作することを意味していました。しかし、それだけでは不十分です。製品とは、コード + 安全性 + エラー処理 + ドキュメント + アイデンティティ + リリースのための品質管理です。Shipcheck がその基準を定義します。

## ここに何が含まれているか

| 標準 | 対象範囲 |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 31の必須チェック項目 + 4つの任意チェック項目の、リリース前のチェックリスト |
| [Error Contract](contracts/error-contract.md) | コードレジストリを備えた、2階層構造のエラー基準 |
| [Security Baseline](templates/SECURITY.md) | レポートメール、対応期間、脅威範囲 |
| [Handbook](templates/HANDBOOK.md) | 複雑なツールのための運用現場マニュアル |
| [Scorecard](templates/SCORECARD.md) | 修正前/後のスコアリング |
| [Adoption Guide](ADOPTION.md) | Shipcheck を任意のレポジトリに 30 分以内に適用 |

## CLI の使用方法

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

`SHIPCHECK_JSON=1` を設定すると、色付きのテキストではなく、構造化された JSON 形式のエラー出力が得られます。

## クイックスタート

1. [導入.md](ADOPTION.md) を読む
2. レポジトリのルートディレクトリで `npx @mcptoolshop/shipcheck init` を実行する
3. `SHIP_GATE.md` で該当する項目にチェックを入れ、該当しない項目には `SKIP:` とマークする
4. `npx @mcptoolshop/shipcheck audit` を実行する。すべての必須チェック項目が合格すると、終了コード 0 が返される
5. チェックが完了したらリリースする

## 仕組み

**必須チェック項目 (A～D)** はリリースの妨げになる：

- **A. セキュリティ基準** — SECURITY.md、脅威モデル、機密情報の排除、テレメトリーの排除、デフォルトの安全な構成
- **B. エラー処理** — 構造化されたエラー形式（コード/メッセージ/ヒント/再試行可能）、安全な出力、適切なフォールバック
- **C. オペレーター向けドキュメント** — README、CHANGELOG、LICENSE、ツールのドキュメント
- **D. リリースのための品質管理** — 検証スクリプト、バージョンの一貫性、依存関係のスキャン、ロックファイル

**任意チェック項目 (E)** はリリースの妨げにはならないが、「全体」を定義する：

- **E. アイデンティティ** — ロゴ、翻訳、ランディングページ、レポジトリのメタデータ

**ゲート F — Dogfood の鮮度**（オプション、dogfood-labs が必要）：

- 新しく検証され、合格した dogfood レコードがあるかどうかを確認する
- 適用モードをサポート：`required` (必須)、`warn-only` (警告のみ)、`exempt` (免除)
- 設定可能な鮮度の期間（デフォルト：30日）

**ゲート G — AI ネイティブのフロントドア**（オプション、`@mcptoolshop/site-theme` >=2.0.0 が必要）：

- レポジトリの AI ネイティブなフロントドア (README / AGENTS.md / llms.txt) に記載されている内容が真実であるかどうかを確認する。これは、オペレーター向けドキュメント（C）およびアイデンティティ（E）ゲートに対する機械可読形式の補完情報となる
- ドキュメント化された主張を証拠チャンネルにルーティングし、リスク順に並べたスコアカードを返す `site-theme` の [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) 検証器 (`verify({ root })`) に委譲する
- 重大度ごとの件数（矛盾、裏付けがない、古い、不要な情報、品質管理、スタイル）とゲートの判定を表示。**矛盾、裏付けがない、または古い主張がある場合、失敗 (終了コード 1) となる**
- `site-theme` は **オプションのピア依存関係** である（必須の依存関係にすると、このゼロ依存 CLI に astro が組み込まれてしまう）。インストールされていない場合、ゲートは **正常にスキップされる**（終了コード 0）—監査がクラッシュすることはない

ゲートは、**何**が真実でなければならないかを規定し、**どのように**実装するかを規定するものではない。適用可能性タグ (`[all]`、`[npm]`、`[mcp]`、`[cli]`、`[desktop]`、`[vsix]`、`[container]`) を使用することで、項目が適用されないレポジトリでチェックボックスに不必要なチェックが入るのを防ぐことができる。

## エラー契約の概要

**レベル 1 — 形式（どこでも必須）：**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**レベル 2 — 基本型 + 終了コード（CLI/MCP/デスクトップ）：**

| 終了コード | 意味 |
|-----------|---------|
| 0 | OK |
| 1 | ユーザーエラー（無効な入力、設定の欠落） |
| 2 | 実行時エラー（クラッシュ、バックエンドの失敗） |
| 3 | 部分的な成功（一部の項目が成功した） |

エラーコードは、名前空間付きのプレフィックスを使用する：`IO_`、`CONFIG_`、`PERM_`、`DEP_`、`RUNTIME_`、`PARTIAL_`、`INPUT_`、`STATE_`。コードはリリース後に安定している。

## 信頼モデル

**アクセスされるデータ：**現在の作業ディレクトリにある `package.json`、`pyproject.toml`、および `SHIP_GATE.md` を読み取る。テンプレートファイル (`SHIP_GATE.md`、`SECURITY.md`、`CHANGELOG.md`、`SCORECARD.md`) を現在のディレクトリにのみ書き込む。
**ネットワークリクエストは行わない。**すべての操作は、ローカルファイルの読み取りと書き込みである。
**機密情報の処理は行わない。**資格情報を読み取ったり、保存したり、送信したりしない。
**テレメトリーは収集または送信されない。**

## 参照実装

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) は、Ship Gate に合格した最初のレポジトリであり、修正後に **46/50** のスコアを獲得した。

## スコアカード

| カテゴリ | スコア | 注記 |
|----------|-------|-------|
| A. セキュリティ | 6/8 | SECURITY.md、信頼モデル、機密情報/テレメトリーなし。MCP 項目はスキップ（MCP サーバーではない） |
| B. エラー処理 | 3/7 | 構造化されたエラー形式 + 終了コード + 生のエラーメッセージがない。MCP/デスクトップ/vscode はスキップ |
| C. オペレーター向けドキュメント | 4/7 | README、CHANGELOG、LICENSE、--help。ログ記録/MCP/複雑な処理はスキップ |
| D. リリースのための品質管理 | 6/9 | 検証スクリプト、バージョン=タグ、CI での npm audit、engines.node、ロックファイル。依存関係がない = 更新メカニズムがない |
| E. アイデンティティ | 4/4 | ロゴ、翻訳、ランディングページ、メタデータ |
| **Total** | **23/31** | 14 個の項目は正当化されてスキップ。`shipcheck audit` は 100% 合格する |

## ライセンス

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
