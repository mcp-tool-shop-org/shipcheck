<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Why

"Done" used to mean the code works. That's not enough. A product is code + safety + error handling + docs + identity + shipping hygiene. Shipcheck defines the bar.

## What's in here

| Standard | What it covers |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 27 hard-gate + 4 soft-gate pre-release checklist |
| [Error Contract](contracts/error-contract.md) | 2-tier structured error standard with code registry |
| [Security Baseline](templates/SECURITY.md) | Report email, response timeline, threat scope |
| [Handbook](templates/HANDBOOK.md) | Operational field manual for complex tools |
| [Scorecard](templates/SCORECARD.md) | Pre/post remediation scoring |
| [Adoption Guide](ADOPTION.md) | Apply shipcheck to any repo in <30 minutes |

## Quick start

1. Read [ADOPTION.md](ADOPTION.md)
2. Copy `templates/SHIP_GATE.md` into your repo root
3. Check off applicable items, mark non-applicable with `SKIP:`
4. Ship when all hard gates pass

## How it works

**Hard gates** (A-D) block release:

- **A. Security Baseline** — SECURITY.md, threat model, no secrets, no telemetry, default safety posture
- **B. Error Handling** — structured error shape (code/message/hint/retryable), safe output, graceful degradation
- **C. Operator Docs** — README, CHANGELOG, LICENSE, tool documentation
- **D. Shipping Hygiene** — verify script, version alignment, dependency scanning, lockfile

**Soft gate** (E) doesn't block but defines "whole":

- **E. Identity** — logo, translations, landing page, repo metadata

The gate says **what** must be true, not **how** to implement it. Applicability tags (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) prevent checkbox shame on repos where items don't apply.

## Error contract at a glance

**Tier 1 — Shape (mandatory everywhere):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Tier 2 — Base type + exit codes (CLI/MCP/desktop):**

| Exit code | Meaning |
|-----------|---------|
| 0 | OK |
| 1 | User error (bad input, missing config) |
| 2 | Runtime error (crash, backend failure) |
| 3 | Partial success (some items succeeded) |

Error codes use namespaced prefixes: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Codes are stable once released.

## Trust model

**Data touched:** reads `package.json`, `pyproject.toml`, and `SHIP_GATE.md` in the current working directory. Writes template files (`SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, `SCORECARD.md`) to the current directory only.
**No network requests.** All operations are local file reads and writes.
**No secrets handling.** Does not read, store, or transmit credentials.
**No telemetry** collected or sent.

## Reference implementation

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) was the first repo to pass Ship Gate — scoring **46/50** after remediation.

## Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 6/8 | SECURITY.md, trust model, no secrets/telemetry. MCP items skipped (not an MCP server) |
| B. Error Handling | 3/7 | Structured error shape + exit codes + no raw stacks. MCP/desktop/vscode skipped |
| C. Operator Docs | 4/7 | README, CHANGELOG, LICENSE, --help. Logging/MCP/complex skipped |
| D. Shipping Hygiene | 6/9 | verify script, version=tag, npm audit in CI, engines.node, lockfile. Zero deps = no update mechanism |
| E. Identity | 4/4 | Logo, translations, landing page, metadata |
| **Total** | **23/31** | 14 items skipped with justification · `shipcheck audit` passes 100% |

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
