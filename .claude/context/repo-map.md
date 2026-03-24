# Repo Map — @mcptoolshop/shipcheck

## Stack

- Runtime: Node.js >= 18.0.0 (ESM only)
- Dependencies: zero (intentional)
- Test framework: Node.js built-in `node --test`
- Site: Astro (in site/ subdirectory, separate deps)

## Structure

```
bin/
  shipcheck.mjs          # Single-file CLI entry point (420 lines, all logic)
templates/
  SHIP_GATE.md           # 31-item gate template with placeholder injection
  SECURITY.md            # Security policy template with report-email placeholder
  CHANGELOG.md           # Keep-a-Changelog stub
  SCORECARD.md           # Pre/post remediation scoring template
contracts/
  error-contract.md      # Tier 1/2 error shape + exit code standard
test/
  shipcheck.test.mjs     # 39 test cases (Node built-in test runner)
site/                    # Astro landing page (separate package.json)
dogfood/                 # Dogfood scenario definitions
.github/workflows/
  ci.yml                 # Verify + self-dogfood (paths-gated)
  publish.yml            # npm publish on release
  pages.yml              # Landing page deploy
  repomesh-broadcast.yml # SBOM + provenance + ledger event on release
```

## Build commands

| Command | What it does |
|---------|-------------|
| `npm test` | `node --test test/*.test.mjs` |
| `npm run verify` | `node bin/shipcheck.mjs help && node bin/shipcheck.mjs init && echo '✓ verify passed'` |
| `npm pack --dry-run` | Verify package contents before publish |

## Key files and their invariants

| File | Invariant | Lines |
|------|-----------|-------|
| `bin/shipcheck.mjs:25-34` | `fail()` — structured error shape `{code, message, hint}` + exit code. Must never emit unstructured errors. |
| `bin/shipcheck.mjs:156-212` | `auditCommand()` — gate parsing. `- [x]` = checked, `- [ ]` = unchecked, `SKIP:` = skipped. Exit 0 if unchecked=0, exit 1 otherwise. Must never exit 0 with unchecked > 0. |
| `bin/shipcheck.mjs:250-279` | `evaluateDogfoodGate()` — pure function. Returns `{pass: bool, reason, detail}`. Must never return pass=true if record is missing, rejected, non-pass, or stale. |
| `bin/shipcheck.mjs:397-419` | Main dispatch. Switch on argv[2]. Unknown commands → exit 1 via fail(). Must never silently ignore unknown commands. |
| `templates/SHIP_GATE.md` | 31 items across 5 gates (A-E). 4 hard + 1 soft. Template must not lose items or change gate boundaries. |
| `contracts/error-contract.md` | Exit code semantics: 0=success, 1=user error, 2=runtime. Released codes are permanent. |

## Primary seam: Exit-code contract

This is the highest-risk seam. Every CI pipeline, every orchestration system, and every downstream tool in the org consumes shipcheck's exit codes as a trust signal. If exit-code semantics drift, the entire org quality gate collapses silently.

**Exit-code law:**
- Exit 0 = success (operation completed, no action required)
- Exit 1 = tool/runtime/integration failure (checker could not complete its job)
- Exit 2 = evaluated gate failure (repo was evaluated and failed)
- Exit 3 = reserved (must not exist without documentation + test)

**Contract sources:**
- `contracts/error-contract.md` — canonical exit code table
- `bin/shipcheck.mjs:25-34` — fail() function implementation
- `test/shipcheck.test.mjs` — exit code assertions across all commands
- README.md — exit code chart in "How it works" section

All four must stay synchronized. A change to any one without updating the others is a contract breach.

## Secondary seams

### 1. Audit gate parsing (L171-184)
The regex-free parser uses `trimmed.startsWith("- [x]")` and `trimmed.startsWith("- [ ]")`. Any change to markdown list format or checkbox syntax breaks gate counting. The SKIP: detection is substring-based (`trimmed.includes("SKIP:")`).

**Invariant:** A line starting with `- [ ]` that does not contain `SKIP:` is ALWAYS counted as unchecked. No exceptions.

### 2. Exit code contract (L25-34, L206-211, L355-363)
Three separate code paths emit exit codes: fail(), auditCommand(), dogfoodCommand(). All must agree on semantics: 0=success, 1=user/gate failure, 2=runtime failure.

**Invariant:** Exit 0 means the operation succeeded and no action is required. Exit 1 means the operation found a problem. Exit 2 means the tool itself failed.

### 3. Template integrity (templates/)
SHIP_GATE.md is the canonical gate definition. It contains the `<!-- repo type tags -->` injection point. If the template loses items, every future init produces an incomplete gate.

**Invariant:** SHIP_GATE.md must contain exactly 31 checkable items across gates A-E.

## Validation law

Shipcheck validates itself:
- `npm run verify` runs the CLI against itself
- CI self-dogfoods on every push to main
- Template injection is tested by init test suite
- No browser-based validation. All verification is terminal + exit code.
