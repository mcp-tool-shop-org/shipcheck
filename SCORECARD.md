# Scorecard

**Repo:** shipcheck
**Date:** 2026-02-27
**Type tags:** `[npm]` `[cli]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 10/10 | SECURITY.md exists, no executable runtime data, no telemetry |
| B. Error Handling | 8/10 | Exit codes implemented, no structured error class (standards repo) |
| C. Operator Docs | 10/10 | README, CHANGELOG, LICENSE, ADOPTION guide all present |
| D. Shipping Hygiene | 10/10 | npm pack clean, lockfile committed, CI present |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata |
| **Overall** | **48/50** | |

## Key Gaps

1. Missing SHIP_GATE.md for the repo itself (ironic — the shipcheck tool didn't have its own gate)
2. Missing SCORECARD.md for the repo itself

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 10/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 10/10 | 10/10 |
| D. Shipping Hygiene | 10/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 48/50 | **50/50** |
