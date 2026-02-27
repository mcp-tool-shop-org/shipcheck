<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/shipcheck/readme.png" alt="Shipcheck" width="400">
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

## なぜ

以前は、「完了」とはコードが動作することを意味していました。しかし、それだけでは不十分です。製品とは、コードに加えて、安全性、エラー処理、ドキュメント、アイデンティティ、そして適切なリリース体制を意味します。Shipcheckは、その基準を定義します。

## 内容

| 標準 | 対象範囲 |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 厳格なチェック項目27個 + 柔軟なチェック項目4個を含む、リリース前のチェックリスト |
| [Error Contract](contracts/error-contract.md) | コード登録機能付きの、2段階構造のエラー基準 |
| [Security Baseline](templates/SECURITY.md) | レポートメール、対応までの時間、リスク範囲 |
| [Handbook](templates/HANDBOOK.md) | 複雑なツール向けの運用マニュアル |
| [Scorecard](templates/SCORECARD.md) | 修正前後の評価 |
| [Adoption Guide](ADOPTION.md) | Shipcheckを、30分以内に任意のレポジトリに適用 |

## クイックスタート

1. [ADOPTION.md](ADOPTION.md) を読んでください。
2. `templates/SHIP_GATE.md` をレポジトリのルートディレクトリにコピーします。
3. 該当する項目にチェックを入れ、該当しない項目には `SKIP:` と記述します。
4. すべての厳格なチェック項目が完了したら、リリースします。

## 仕組み

**厳格なチェック項目** (A～D) は、リリースをブロックします。

- **A. セキュリティ基準** — SECURITY.md、脅威モデル、機密情報の非保持、テレメトリーの非使用、デフォルトの安全対策
- **B. エラー処理** — 構造化されたエラー形式 (コード/メッセージ/ヒント/再試行可能)、安全な出力、エラー発生時の適切な対応
- **C. 運用者向けドキュメント** — README、CHANGELOG、LICENSE、ツールのドキュメント
- **D. リリース体制** — スクリプトの検証、バージョンの一致、依存関係のスキャン、ロックファイルの確認

**柔軟なチェック項目** (E) は、リリースをブロックしませんが、「全体像」を定義します。

- **E. アイデンティティ** — ロゴ、翻訳、ランディングページ、レポジトリのメタデータ

チェック項目は、**何を**満たすべきかを定義するものであり、**どのように**実装するかを定義するものではありません。適用範囲を示すタグ (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) は、該当する項目がないレポジトリでの不必要なチェックを避けるために使用されます。

## エラー基準の概要

**Tier 1 — 形状 (必須):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Tier 2 — 基本タイプ + エラーコード (CLI/MCP/デスクトップ):**

| エラーコード | 意味 |
|-----------|---------|
| 0 | OK |
| 1 | ユーザーエラー (不正な入力、設定の欠如) |
| 2 | 実行時エラー (クラッシュ、バックエンドの障害) |
| 3 | 部分的な成功 (一部の項目が成功) |

エラーコードは、名前空間付きのプレフィックスを使用します: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. コードは、リリース後に安定します。

## 参考実装

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) は、Ship Gateを最初に通過したレポジトリであり、修正後に **46/50** のスコアを獲得しました。

## 評価項目

| カテゴリ | スコア | 備考 |
|----------|-------|-------|
| A. セキュリティ | 10/10 | SECURITY.md、実行可能なコードなし、データ収集なし |
| B. エラー処理 | 該当なし | 標準レポジトリ — エラーに関するコードなし |
| C. 運用者向けドキュメント | 10/10 | README、CHANGELOG、ADOPTION、すべてのテンプレートがドキュメント化されています |
| D. リリース体制 | 8/10 | 検証/テストするコードなし、すべての標準がバージョン管理されています |
| E. アイデンティティ | 10/10 | ロゴ、翻訳、ランディングページ、メタデータ |
| **Total** | **38/40** | B は除外 (該当なし) |

## ライセンス

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
