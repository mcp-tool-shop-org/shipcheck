---
title: Error Contract
description: Structured error shape and exit codes.
sidebar:
  order: 3
---

The error contract defines how products communicate failures to users and machines.

## Tier 1 — Shape (mandatory everywhere)

Every user-facing error must emit this shape:

```typescript
interface StructuredError {
  code: string;       // e.g. "INPUT_TEXT_EMPTY"
  message: string;    // human-readable explanation
  hint: string;       // actionable guidance
  cause?: string;     // upstream error (if any)
  retryable?: boolean;
}
```

This is the minimum bar. Libraries, CLIs, MCP servers, desktop apps — all user-facing errors must have `code`, `message`, and `hint`.

## Tier 2 — Base type + exit codes (CLI/MCP/desktop)

For CLI tools, MCP servers, and desktop apps, add a typed error class with:

- Safe output mode (strips internal details before showing to user)
- Debug output mode (full details for developers)
- Exit codes:

| Exit code | Meaning |
|-----------|---------|
| 0 | OK |
| 1 | User error (bad input, missing config) |
| 2 | Runtime error (crash, backend failure) |
| 3 | Partial success (some items succeeded) |

## Error code namespaces

Codes use namespaced prefixes to group related failures:

| Prefix | Domain |
|--------|--------|
| `IO_` | File system, network I/O |
| `CONFIG_` | Configuration errors |
| `PERM_` | Permission denied |
| `DEP_` | Missing or incompatible dependencies |
| `RUNTIME_` | Unexpected runtime failures |
| `PARTIAL_` | Some items succeeded, some failed |
| `INPUT_` | User input validation |
| `STATE_` | Invalid state transitions |

Error codes are **stable once released** — never change the meaning of an existing code.

## Example implementation

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint: string,
    public cause?: string,
    public retryable = false,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toSafe() {
    return { code: this.code, message: this.message, hint: this.hint };
  }

  toDebug() {
    return { ...this.toSafe(), cause: this.cause, retryable: this.retryable };
  }
}
```
