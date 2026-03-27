---
title: Reference
description: Templates, scorecard, and CLI commands.
sidebar:
  order: 5
---

## CLI commands

### init

```bash
npx @mcptoolshop/shipcheck init
```

Auto-detects your repo type (npm, pypi, vsix, desktop, container) and copies the appropriate templates into your repo root:

- `SHIP_GATE.md` — the pre-release checklist
- `SECURITY.md` — vulnerability reporting template
- `CHANGELOG.md` — change log template
- `SCORECARD.md` — pre/post remediation scoring

### audit

```bash
npx @mcptoolshop/shipcheck audit
```

Reads `SHIP_GATE.md`, counts checked/unchecked/skipped items, and reports:

- Exit 0 if all hard gates pass
- Exit 1 if gaps remain

### dogfood

```bash
npx @mcptoolshop/shipcheck dogfood --repo org/repo --surface cli
```

Checks the dogfood-labs index for a fresh, verified, passing dogfood record. This is Gate F.

**Flags:**

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--repo` | yes | — | Target repo slug (e.g. `mcp-tool-shop-org/shipcheck`) |
| `--surface` | yes | — | Product surface (e.g. `cli`, `desktop`) |
| `--freshness-days` | no | 30 | Maximum age in days for the dogfood record |
| `--dogfood-repo` | no | `mcp-tool-shop-org/dogfood-labs` | Override the dogfood-labs repo |
| `--dogfood-ref` | no | `main` | Override the dogfood-labs branch |

**Enforcement modes** (set via per-repo policy files in dogfood-labs):

- `required` — Gate F blocks on failure (default)
- `warn-only` — Prints a warning but exits 0
- `exempt` — Skips the check entirely

### help

```bash
npx @mcptoolshop/shipcheck help
```

Prints usage information. Also available via `--help` or `-h`. Running with no arguments defaults to `help`.

### --version

```bash
npx @mcptoolshop/shipcheck --version
```

Prints the current version. Also available via `-V`.

## Environment variables

| Variable | Effect |
|----------|--------|
| `SHIPCHECK_JSON` | When set to any truthy value, error output is emitted as structured JSON instead of coloured text |

## Templates included

| Template | Purpose |
|----------|---------|
| `SHIP_GATE.md` | 31 hard + 4 soft pre-release checklist |
| `SECURITY.md` | Vulnerability report email, response timeline, threat scope |
| `CHANGELOG.md` | Structured change log (Keep a Changelog format) |
| `SCORECARD.md` | Pre/post remediation scoring by category |
| `HANDBOOK.md` | Operational field manual (for complex tools only) |

## Scorecard

The scorecard tracks maturity across the 5 gate categories:

| Category | Max score |
|----------|-----------|
| A. Security Baseline | varies by repo type |
| B. Error Handling | varies by repo type |
| C. Operator Docs | varies by repo type |
| D. Shipping Hygiene | varies by repo type |
| E. Identity (soft) | 4 |

Scores reflect actual gate results from `shipcheck audit`, not estimates. Items marked `SKIP` with justification are excluded from the denominator.

## Version minimum

Every repo that passes shipcheck must be at **v1.0.0 or higher**. Pre-1.0 repos get promoted to 1.0.0, not patch-bumped. Repos already at v1.x+ get a patch bump.

## Relationship to The Treatment

- **Shipcheck** = quality audit (does it meet standards?)
- **The Treatment** = polish + publish (badges, translations, coverage, landing page)
- Order: Shipcheck first, then The Treatment
