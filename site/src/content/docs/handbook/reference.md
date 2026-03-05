---
title: Reference
description: Templates, scorecard, and CLI commands.
sidebar:
  order: 4
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

## Templates included

| Template | Purpose |
|----------|---------|
| `SHIP_GATE.md` | 27 hard + 4 soft pre-release checklist |
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
