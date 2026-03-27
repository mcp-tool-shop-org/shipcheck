---
title: Ship Gate
description: The 35-item checklist that defines "done."
sidebar:
  order: 3
---

The Ship Gate is a 35-item pre-release checklist organized into 5 categories (31 hard-gate items in A-D, plus 4 soft-gate items in E). Hard gates (A-D) block release. The soft gate (E) doesn't block but defines what "whole" looks like.

## A. Security Baseline (8 items)

The security gate ensures every product has a clear security posture:

- `SECURITY.md` exists with report email and response timeline
- Threat model in README (what it reads, writes, touches, doesn't touch)
- No secrets committed or hardcoded
- No telemetry without disclosure
- Default safety posture (dangerous actions require `--allow-*` flags)
- Constrained file operations (for tools that write files)
- No network egress without disclosure (for MCP servers)
- No stack traces in user-facing output (for MCP servers)

## B. Error Handling (7 items)

Every user-facing error must have a structured shape:

- Error shape: `code`, `message`, `hint`, `cause?`, `retryable?`
- Exit codes for CLI apps (0=ok, 1=user, 2=runtime, 3=partial)
- No raw stack traces in production output
- Graceful degradation on backend failures
- Error codes use namespaced prefixes (`IO_`, `CONFIG_`, `PERM_`, etc.)

## C. Operator Docs (7 items)

Documentation gates ensure operators can use the product:

- README is current and accurate
- CHANGELOG exists with recent entries
- LICENSE file exists
- `--help` output is accurate (for CLIs)
- Logging levels documented
- Tool documentation (for MCP servers)
- HANDBOOK exists (for complex tools only)

## D. Shipping Hygiene (9 items)

The shipping gate ensures clean, reproducible builds:

- Verify script exists (build + test)
- Version matches git tag
- Dependency scanning in CI
- Dependency update mechanism
- Clean packaging per ecosystem (npm, PyPI, etc.)

## E. Identity (4 items — soft gate)

Identity items define "whole" but don't block release:

- Logo
- Translations
- Landing page
- GitHub metadata (description, topics, links)

## Applicability tags

Each item has a tag indicating which repo types it applies to:

| Tag | Applies to |
|-----|-----------|
| `[all]` | Every repo |
| `[npm]` | npm packages |
| `[pypi]` | Python packages |
| `[vsix]` | VS Code extensions |
| `[desktop]` | Desktop apps |
| `[container]` | Docker images |
| `[mcp]` | MCP servers |
| `[cli]` | Command-line tools |
| `[complex]` | Complex tools with operational surface |
| `[org]` | Repos in the mcp-tool-shop-org GitHub org |

Items tagged with a type that doesn't match your repo should be marked `SKIP: not a [type]`.
