# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.6] - 2026-06-16

### Added
- **Gate G — AI-native front door**: `shipcheck front-door` verifies a repo's
  README / AGENTS.md / llms.txt by consuming the `front-door` verifier shipped in
  `@mcptoolshop/site-theme` (>=2.0.0). Maps the verifier's risk-ordered scorecard
  (contradicted > unbacked > stale > bloat > hygiene > style) into a shipcheck
  dimension, prints a counts-by-severity summary + gate verdict, and exits 1 when
  the front-door gate fails (`scorecard.gate.pass === false`).
- `@mcptoolshop/site-theme` as an **optional peer dependency** (a hard dependency
  would pull astro/vite/sharp — ~280 packages — into this zero-dep CLI). When it is
  not installed the gate SKIPS gracefully (exit 0) and never crashes the audit.
- Tests for `summarizeFrontDoor` (scorecard mapping) and `runFrontDoorGate`
  (pass / fail / skip paths via an injected loader, plus CLI E2E).

## [1.0.5] - 2026-03-25

### Added
- `--version` / `-V` CLI flag (reads from package.json)
- 4 version consistency tests

## [1.0.1] - 2026-02-27

### Added
- Trust model paragraph in README (Ship Gate A2)
- Structured error shape in CLI — `fail()` with code/message/hint (Ship Gate B1)
- Proper exit codes: 0 ok, 1 user error, 2 runtime error (Ship Gate B2)
- `verify` script in package.json (Ship Gate D1)
- CI workflow with npm audit (Ship Gate D3)
- CHANGELOG.md included in npm tarball (Ship Gate D5)
- package-lock.json committed (Ship Gate D7)
- SHIP_GATE.md filled with actual audit results (23/31 checked, 14 skipped, 100% pass)

### Changed
- Scorecard in README reflects actual `shipcheck audit` results, not estimates

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
