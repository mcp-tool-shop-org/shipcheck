# Ship Gate

> No repo is "done" until every applicable line is checked.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) — SKIP: standards repo with no runtime data; SECURITY.md covers scope
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output
- [x] `[all]` No telemetry by default — state it explicitly even if obvious

### Default safety posture

- [x] `[cli|mcp|desktop]` Dangerous actions (kill, delete, restart) require explicit `--allow-*` flag — SKIP: CLI only reads SHIP_GATE.md and writes templates; no destructive actions
- [x] `[cli|mcp|desktop]` File operations constrained to known directories — writes only to cwd (templates)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` — defines the error contract itself
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error · 3 partial success — audit exits 1 on gaps
- [x] `[cli]` No raw stack traces without `--debug`
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions
- [x] `[all]` CHANGELOG.md (Keep a Changelog format)
- [x] `[all]` LICENSE file present and repo states support status
- [x] `[cli]` `--help` output accurate for all commands and flags — init + audit documented
- [ ] `[cli|mcp|desktop]` SKIP: no configurable logging levels (CLI tool with simple output)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not complex enough to warrant HANDBOOK

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) — npm test
- [x] `[all]` Version in manifest matches git tag
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate)
- [x] `[all]` Automated dependency update mechanism exists
- [x] `[npm]` `npm pack --dry-run` includes: bin/, templates/, contracts/, README.md, LICENSE
- [x] `[npm]` `engines.node` set (>=18.0.0)
- [x] `[npm]` Lockfile committed
- [ ] `[pypi]` SKIP: not a Python project
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header
- [x] `[all]` Translations (polyglot-mcp, 8 languages)
- [x] `[org]` Landing page (@mcptoolshop/site-theme)
- [x] `[all]` GitHub repo metadata: description, homepage, topics
