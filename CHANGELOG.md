# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.8] - 2026-07-07

### Added

Three more Ship Gate lines converted from human-checked boxes into **executed
checks** — code that reads the real artifact and exits 1 on the real defect,
following the Gate H template. Each ships with a RED meta-test that mutates the
protected thing and asserts the gate fires (a gate that only passes on a good
repo is not verified). All three are wired into `verify`.

- **Gate I — `shipcheck secrets`** (converts A3 "No secrets in source"). Scans
  every publishable package's **tarball surface** (the same `npm pack` file set as
  Gate H) for high-signal credentials — provider-prefixed API keys, tokens, and
  private-key blocks. Matches are **redacted** (a scanner that echoes a key into a
  public CI log is itself the leak); a `shipcheck-allow-secret` inline comment
  whitelists a documented example. Exits 1 if any credential would ship.
- **Gate J — `shipcheck manifest`** (converts D6, D7, D2). Executes three
  release-hygiene facts: every publishable package sets `engines.node` /
  `requires-python` (D6); a lockfile is committed (D7); the manifest version is not
  **behind** the newest released git tag (D2, with `--expect <version>` for strict
  release-time exact-match). D2 is the portable, inheritable form of the ad-hoc
  "verify tag matches package.json" step that today lives only in shipcheck's own
  `release.yml`; it skips cleanly when no git tags are present.
- **Gate K — `shipcheck security-docs`** (converts A1, A2). Verifies SECURITY.md
  exists (`./`, `.github/`, or `docs/`) with a real reporting contact — not an
  empty stub that ticks the box green — and that the README states a trust/threat
  model with a substantive body. Honest ceiling, disclosed not faked: it checks
  **presence + contact**, not whether the threat model is correct or complete
  (that needs a separate-family verifier — named as residual).
- **Gate L — `shipcheck ci`** (converts provenance/OIDC + D3). Reads
  `.github/workflows` and executes two facts: every `npm publish` workflow uses
  OIDC trusted publishing (`id-token: write`) **and** `--provenance` (the config /
  intent layer), and a recognized vulnerability scanner runs in CI or dependabot
  is configured (D3). `--registry <pkg>[@<ver>]` adds the **outcome** layer,
  confirming the published tarball actually carries a provenance attestation on
  npm — intent **and** outcome, two complementary layers rather than a choice
  between them.

### Fixed

- **`--json` now emits pure JSON** on every gate (`pack`, `front-door`, `secrets`,
  `manifest`, `security-docs`, `ci`) — the human-readable header line is suppressed
  in `--json` mode, so the entire stdout parses. Previously a header preceded the
  JSON, forcing consumers to hunt for the `{` line.

### Notes

- Every gate exposes a pure, injectable core (`runSecretsGate` / `runManifestGate`
  / `runSecurityDocsGate` / `runCiGate`, plus the sub-checks) so unit + RED
  meta-tests never shell out; real-artifact integration tests exercise the CLI end
  to end. ~55 new tests.
- **D4 (automated dependency-update mechanism) deliberately left attested.** The
  org's own `github-actions` rule says *don't add dependabot unless explicitly
  requested* — a hard executed gate that failed a repo for lacking an update bot
  would punish repos for following that policy. This checklist-vs-policy conflict
  is a decision, not a coding gap; recorded in `docs/executed-vs-attested-audit.md`.

## [1.0.7] - 2026-07-07

### Added
- **Gate H — publish surface**: `shipcheck pack` runs `npm pack --dry-run` on
  every publishable workspace package (npm `workspaces` or `pnpm-workspace.yaml`)
  and fails if any tarball is missing its README or LICENSE, if a `files[]` entry
  does not resolve, or if `package.json` has no `license` field. This **executes**
  the check that Ship Gate D5 previously only asserted — closing the monorepo
  blind spot where the root package is verified but the N *published* packages are
  not. It found six packages shipping without a LICENSE (and two without a README)
  that a green D5 checkbox had waved through. Wired into `verify` so shipcheck
  holds itself to the gate; `runPublishGate` / `discoverPublishablePackages`
  exported for programmatic use.

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
