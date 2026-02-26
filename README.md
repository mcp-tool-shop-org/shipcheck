<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

> A.k.a. "NPM Readiness Sheriff"

Given a local package folder, `mcp-shipcheck` produces a deterministic publish-readiness report: what will be included in the tarball, obvious foot-guns (missing types, broken exports, no LICENSE, etc.), and a concrete fix list.

It turns "release anxiety" into a machine-checkable artifact.

## Features

- **Audit**: Analyzes `package.json`, `tsconfig.json`, exports, and file existence to score readiness.
- **Pack Preview**: Runs `npm pack --json` to show exactly what files ship (and their sizes), without needing to unpack a tarball manually.
- **Explain Failures**: Provides human-readable context and fixes for specific error codes.

All tools are **read-only** (no auto-fixes), so they are safe for MCP hosts to call automatically.

## Tools

### `shipcheck.audit`
- **Input**: `{ path: string }` (Absolute or relative path to package)
- **Output**: JSON report containing a score (0-100), structured findings (fails, warnings, infos), and summary counts.

### `shipcheck.packPreview`
- **Input**: `{ path: string }`
- **Output**: JSON list of files that would be included in the release tarball, along with metadata.

### `shipcheck.explainFailure`
- **Input**: `{ code: string }` (e.g., `PKG.EXPORTS.MISSING`)
- **Output**: Detailed explanation of the error and suggested fixes.

## Installation & Usage

### Usage with MCP

This tool is designed to be used with an MCP client (like Claude Desktop or an IDE extension).

**Configuration (mcp-settings.json):**

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

### Building Locally

```bash
npm install
npm run build
```

## License

MIT
