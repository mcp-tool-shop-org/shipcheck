# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-02-27

### Overview

**First stable release.** Product standards for MCP Tool Shop, extracted from the mcp-voice-soundboard remediation.

### Added

- **Ship Gate** — 27 hard-gate + 4 soft-gate pre-release checklist with applicability tags
- **Error Contract** — 2-tier structured error standard (shape mandatory everywhere, base type for CLI/MCP/desktop)
- **Error Code Registry** — namespaced prefixes, stable once released, each maps to exit code + default hint
- **Security Baseline** template — report email, response timeline, threat scope
- **Handbook** template — operational field manual skeleton for complex tools
- **Scorecard** template — pre/post remediation scoring
- **ADOPTION.md** — apply shipcheck to any repo in <30 minutes

### Reference implementation

- [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) — first repo to pass Ship Gate (46/50)
