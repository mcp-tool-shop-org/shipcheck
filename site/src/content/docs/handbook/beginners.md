---
title: Beginners
description: New to Shipcheck? Start here for an overview of what it does and why it exists.
sidebar:
  order: 1
---

New to Shipcheck? This page explains what it is, why it exists, and how to get started without any prior context.

## What is Shipcheck?

Shipcheck is a product-standards tool for the MCP Tool Shop org. It provides a checklist (the Ship Gate) and a CLI that together define what "done" means before any repo is tagged or published.

The core idea: working code is necessary but not sufficient. A shippable product also needs a security baseline, structured error handling, up-to-date documentation, and clean packaging. Shipcheck makes those requirements explicit and auditable.

## Who is it for?

Shipcheck is designed for anyone contributing to an MCP Tool Shop repo, whether you are:

- Building a new tool and want to know the quality bar before you ship
- Maintaining an existing repo and need to bring it up to standard
- Reviewing someone else's work and need an objective checklist to evaluate

It works with npm packages, Python packages, VS Code extensions, MCP servers, CLI tools, desktop apps, and containerized services.

## Core concepts

**Ship Gate** — A markdown checklist (`SHIP_GATE.md`) with 35 items across 5 categories. Hard gates (A-D, 31 items) block release. The soft gate (E, 4 items) defines "whole" but does not block.

**Applicability tags** — Each checklist item is tagged with the repo types it applies to (`[all]`, `[npm]`, `[cli]`, `[mcp]`, etc.). Items that do not apply to your repo get marked `SKIP: reason` so you are never blocked by irrelevant requirements.

**Error contract** — A standard shape for user-facing errors. Every error must have a `code`, `message`, and `hint`. CLI tools also use standardized exit codes (0=ok, 1=user error, 2=runtime, 3=partial).

**Scorecard** — A scoring template that tracks your repo's maturity across the 5 gate categories. Scores reflect actual audit results, not estimates.

**Gate F (Dogfood)** — An optional gate that checks whether the repo has a recent, passing dogfood record in dogfood-labs.

## How to install

Shipcheck runs via npx, so there is nothing to install permanently:

```bash
npx @mcptoolshop/shipcheck init
```

Or install globally if you prefer:

```bash
npm install -g @mcptoolshop/shipcheck
```

Requires Node.js 18 or later. No other dependencies.

## Your first audit

Here is the typical workflow from zero to a passing audit:

### 1. Initialize templates

Run `init` in your repo root:

```bash
npx @mcptoolshop/shipcheck init
```

This auto-detects your repo type and creates four files: `SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, and `SCORECARD.md`. Existing `SECURITY.md` and `CHANGELOG.md` files are preserved.

### 2. Work through the checklist

Open `SHIP_GATE.md` and work through each section:

- **A. Security Baseline** — Fill in `SECURITY.md`, add a trust model to your README, confirm no secrets or telemetry.
- **B. Error Handling** — Ensure user-facing errors follow the structured shape (`code`, `message`, `hint`).
- **C. Operator Docs** — Verify README, CHANGELOG, LICENSE, and `--help` output are current.
- **D. Shipping Hygiene** — Add a `verify` script, confirm version matches tag, enable dependency scanning.
- **E. Identity** — Logo, translations, landing page, GitHub metadata (soft gate, does not block).

Mark completed items with `[x]` and a date. Mark items that do not apply with `SKIP: reason`.

### 3. Run the audit

```bash
npx @mcptoolshop/shipcheck audit
```

The audit reads your `SHIP_GATE.md`, counts checked, unchecked, and skipped items, and reports a pass rate. It exits 0 when all hard gates pass and exits 1 when gaps remain.

## Frequently asked questions

**How long does it take?**
About 30 minutes per repo for first adoption. Most of that time is spent on the security baseline and error shape — the rest is quick verification.

**Do I need to pass every item?**
Every item in gates A-D must be either checked or marked `SKIP: reason`. Gate E items are recommended but do not block shipping.

**What if my repo does not publish anywhere?**
Skip section D entirely with a note. The security and error handling sections still apply to anything that runs code.

**Can I add custom items?**
Yes. Add them in a `## F. Project-Specific` section at the bottom of your `SHIP_GATE.md`. Do not modify sections A-E as those are the org standard.

**What is the difference between Shipcheck and The Treatment?**
Shipcheck is the quality audit (does it meet standards?). The Treatment is the polish and publish pass (badges, translations, landing page). Order: Shipcheck first, then The Treatment.

## Next steps

- **[Getting Started](/shipcheck/handbook/getting-started/)** — Step-by-step adoption walkthrough with time estimates
- **[Ship Gate](/shipcheck/handbook/ship-gate/)** — Detailed breakdown of all 35 checklist items
- **[Error Contract](/shipcheck/handbook/error-contract/)** — The structured error shape with reference implementations
- **[Reference](/shipcheck/handbook/reference/)** — All CLI commands, templates, and environment variables
