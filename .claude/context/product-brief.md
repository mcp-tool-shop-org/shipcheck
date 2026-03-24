# Product Brief — @mcptoolshop/shipcheck

## What this is

A zero-dependency CLI that distributes and audits product standards for the MCP Tool Shop org. It defines what "done" means before anything ships: 31 gate items across 5 categories (Security, Errors, Docs, Hygiene, Identity), with hard gates A-D that block release.

## Thesis

Code alone is not a product. A product requires safety, structured errors, operator docs, shipping hygiene, and identity. Shipcheck encodes those requirements as auditable gates and distributes them as templates.

## Target user

- Repo maintainers in mcp-tool-shop-org who need to know if their repo is ready to ship
- CI pipelines that gate releases on hard gate compliance
- Orchestration systems (Role OS, multi-claude) that need a machine-readable quality signal

## Core value

One command tells you if you can ship. One exit code tells CI if it should block. No ambiguity, no negotiation, no "it feels done."

## Non-goals

- Shipcheck is not a linter. It does not analyze source code quality.
- Shipcheck is not a test runner. It does not execute your tests.
- Shipcheck is not a CI system. It produces a signal; CI consumes it.
- Shipcheck does not fix problems. It identifies gaps and exits with a truthful code.

## Anti-thesis — what this product must never become

1. **An advisory tool.** Shipcheck must never convert hard failures into suggestions. If a gate fails, exit 1. Period.
2. **A "friendly" experience that hides truth.** No softening gap reports to make operators feel better. No hiding unchecked items behind progress bars or percentages that round up.
3. **A configuration-heavy framework.** Zero dependencies is not an accident. The tool must remain trivially installable and auditable. No plugin systems, no config files, no extensibility hooks.
4. **A code quality tool.** Shipcheck gates product completeness, not code elegance. It must never grow lint rules, style checks, or complexity metrics.
5. **A network-dependent tool.** The core commands (init, audit) must remain fully offline. Only dogfood requires network, and only for freshness checks against a known endpoint.
6. **A friendly advisory lint.** Shipcheck must never blur the line between "the repo failed a gate" and "the checker couldn't run." These are different failure classes with different exit codes. Merging them destroys the trust signal.
7. **A tool that trades deterministic gate truth for nicer UX.** No progress bars that hide gaps. No percentage rounding that makes 96% look like 100%. No language that makes an enforcement result sound optional.
