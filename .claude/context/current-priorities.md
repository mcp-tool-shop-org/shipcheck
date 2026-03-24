# Current Priorities — @mcptoolshop/shipcheck

## Active work

- Role OS lockdown (this audit). First repo in org rollout.

## Next up

- None scheduled beyond lockdown.

## Blocked

- Nothing currently blocked.

## Completed recently

- v1.0.4 published (current)
- Self-dogfooding in CI operational
- Repomesh broadcast workflow live
- Landing page deployed
- 8-language translation set complete

## Banned detours

1. **No CLI framework migration.** The single-file CLI with manual argv parsing is correct for this tool's scope. No yargs, commander, or meow.
2. **No TypeScript migration.** The 420-line single-file CLI does not benefit from type annotations. If it grows past ~600 lines, reconsider, but not before.
3. **No plugin/extensibility system.** The standard is the standard. Custom gates belong in downstream tools, not in shipcheck itself.
4. **No interactive mode.** Shipcheck is a batch tool. No prompts, no wizards, no TUI. stdin is not read.
5. **No config file support.** No .shipcheckrc, no shipcheck.config.js. Zero-config is a feature.

## Must-preserve invariants

These cannot be traded away without explicit human approval:

1. **Zero dependencies.** `npm install` installs nothing. This is intentional and non-negotiable.
2. **Exit code contract.** 0=success, 1=user/gate failure, 2=runtime failure. Every consumer in the org depends on this.
3. **Structured error shape.** `{code, message, hint}` on every failure path. No raw stack traces, no unstructured stderr.
4. **31-item gate template.** SHIP_GATE.md contains exactly 31 checkable items. Any change to item count requires template + README + test updates.
5. **Offline core.** init and audit must work with zero network access. Only dogfood touches the network.
6. **CWD-only writes.** Shipcheck never writes outside the current working directory. No home dir, no temp dir, no global state.
7. **Truthful exit codes.** If unchecked > 0, exit 1. No exceptions. No "close enough" logic.
8. **Machine-consumable determinism.** CI-facing output and exit behavior must be deterministic and machine-parseable. Same input always produces same exit code. SHIPCHECK_JSON mode must emit valid JSON on every error path. No human-only output formats in CI-facing codepaths.

## Validation law

- `npm test` runs 39 test cases covering all commands, exit codes, and type detection
- `npm run verify` smoke-tests the CLI against itself
- CI self-dogfoods on every push to main
- All validation is terminal-based. No browser, no visual verification.
