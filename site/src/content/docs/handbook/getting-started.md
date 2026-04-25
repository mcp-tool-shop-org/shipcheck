---
title: Getting Started
description: Apply Shipcheck to any repo in under 30 minutes.
sidebar:
  order: 2
---

## Install

Install globally via npm:

```bash
npm install -g @mcptoolshop/shipcheck
```

Or run directly:

```bash
npx @mcptoolshop/shipcheck init
```

## Apply to a repo

The full adoption takes about 30 minutes per repo:

### 1. Initialize (2 min)

```bash
npx @mcptoolshop/shipcheck init
```

This auto-detects your repo type and copies the appropriate templates:

- `SHIP_GATE.md` — the checklist
- `SECURITY.md` — vulnerability reporting template
- `CHANGELOG.md` — change log template
- `SCORECARD.md` — scoring template

### 2. Fill security baseline (5 min)

- Fill in `SECURITY.md` with your contact email and response timeline
- Add a threat model section to your README

### 3. Implement error shape (10 min)

At minimum, all user-facing errors should have:

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character",
  "retryable": false
}
```

For CLI/MCP/desktop apps, add exit codes and a typed error class.

### 4. Update docs (5 min)

- Ensure README is current
- Add or update CHANGELOG
- Verify LICENSE exists
- Check `--help` output is accurate (for CLIs)

### 5. Shipping hygiene (5 min)

- Add a `verify` script (build + test)
- Confirm version matches tag
- Enable dependency scanning in CI

### 6. Review the gate (3 min)

Open `SHIP_GATE.md` and mark every line:

- `[x]` — done (with date)
- `SKIP: reason` — not applicable to this repo
- `[ ]` — still needs work

### 7. Audit

```bash
npx @mcptoolshop/shipcheck audit
```

Exits 0 when all hard gates pass. Exits 1 if gaps remain.

### 8. Dogfood check (optional)

If your org uses [testing-os](https://github.com/dogfood-lab/testing-os) for verification, you can also check Gate F:

```bash
npx @mcptoolshop/shipcheck dogfood --repo org/repo --surface cli
```

This verifies that a fresh, passing dogfood record exists. See the [Reference](/shipcheck/handbook/reference/) page for all flags and enforcement modes.
