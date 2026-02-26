<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A.k.a. 「NPM 連携準備担当」

`mcp-shipcheck` は、ローカルのパッケージフォルダに対して、決定的な公開準備レポートを生成します。レポートには、tarball に含まれるファイル、明らかな問題点（型定義の欠落、エクスポートの不備、LICENSE ファイルの不在など）、および具体的な修正リストが含まれます。

これにより、「リリースへの不安」を、機械で検証可能な成果物に変換します。

## 機能

- **監査 (Audit)**: `package.json`、`tsconfig.json`、エクスポート、およびファイルの存在を分析し、準備状況を評価します。
- **パッケージ内容プレビュー (Pack Preview)**: `npm pack --json` を実行し、どのファイルがパッケージに含まれるか（およびそのサイズ）、を手動で tarball を展開せずに確認できます。
- **エラーの説明 (Explain Failures)**: 特定のエラーコードに対して、人間が理解しやすい説明と修正方法を提供します。

すべてのツールは**読み取り専用**であり（自動修正機能はありません）、そのため、MCP ホストが自動的に実行しても安全です。

## ツール

### `shipcheck.audit`
- **入力**: `{ path: string }` (パッケージへの絶対パスまたは相対パス)
- **出力**: スコア (0-100)、構造化された結果 (エラー、警告、情報)、および集計結果を含む JSON レポート。

### `shipcheck.packPreview`
- **入力**: `{ path: string }`
- **出力**: リリース tarball に含まれるファイルのリスト（およびメタデータ）を JSON 形式で出力します。

### `shipcheck.explainFailure`
- **入力**: `{ code: string }` (例: `PKG.EXPORTS.MISSING`)
- **出力**: エラーの詳細な説明と、推奨される修正方法。

## インストールと使用方法

### MCP との連携

このツールは、MCP クライアント（Claude Desktop や IDE 拡張機能など）と組み合わせて使用するように設計されています。

**設定 (mcp-settings.json):**

```json
{
  "mcpServers": {
    "shipcheck": {
      "command": "node",
      "args": ["/path/to/mcp-shipcheck/build/index.js"]
    }
  }
}
```

### ローカルでのビルド

```bash
npm install
npm run build
```

## ライセンス

MIT
