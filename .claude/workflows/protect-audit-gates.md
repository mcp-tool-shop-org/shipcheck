# Workflow: Protect Audit Gates

## Use when

A proposed change touches any of these paths:
- `bin/shipcheck.mjs` — any modification to audit logic, exit codes, error handling, or command dispatch
- `templates/SHIP_GATE.md` — any modification to gate items, gate boundaries, or checkbox format
- `contracts/error-contract.md` — any modification to exit code semantics or error shape
- `test/shipcheck.test.mjs` — any modification that weakens or removes audit/exit-code test coverage

## Required chain

1. **Backend Engineer** — implements the change
2. **Test Engineer** — verifies exit codes, gate parsing, and error shape are preserved
3. **Critic Reviewer** — reviews against reject criteria below

This is the smallest valid chain. Do not add roles unless the change also touches product scope (add Product Strategist) or brand/docs (add Launch Copywriter).

## Required review checks

The Critic must verify ALL of the following against evidence (not impression):

- [ ] `fail()` function (L25-34) still emits `{code, message, hint}` on every error path
- [ ] `auditCommand()` (L156-212) still exits 0 only when unchecked === 0
- [ ] `auditCommand()` still exits 1 when unchecked > 0
- [ ] `evaluateDogfoodGate()` (L250-279) still returns pass=false for: missing record, missing surface, rejected, non-pass verdict, stale
- [ ] Unknown commands still exit 1 via `fail()` (L417-418)
- [ ] SHIP_GATE.md template still contains exactly 31 checkable items
- [ ] Exit code semantics unchanged: 0=success, 1=user/gate failure, 2=runtime failure
- [ ] No new dependency added to package.json
- [ ] `npm test` passes all 39+ test cases
- [ ] `npm run verify` exits 0

## Reject criteria — automatic reject

A change is **automatically rejected** if it:

1. **Weakens gate semantics.** Any change that allows `auditCommand()` to exit 0 when unchecked items remain. This includes rounding, thresholds, "close enough" logic, or percentage-based pass conditions.

2. **Blurs exit-code meaning.** Any change that makes exit 0 mean anything other than "operation succeeded, no action required." Any change that makes exit 1 mean anything other than "a problem was found." Any new exit code without updating the error contract.

3. **Hides audit failure specificity.** Any change that removes, truncates, or obscures the gap list without the operator's knowledge. Any change that replaces specific error codes (DOGFOOD_STALE, STATE_MISSING_GATE) with generic codes (ERROR, FAIL).

4. **Converts hard failure into advisory behavior.** Any change that makes a hard gate failure produce a warning instead of exit 1, without explicit law change approved by human. The warn-only mode in dogfood is the sole exception (it is policy-gated, not code-gated).

5. **Adds runtime dependencies.** Any non-zero entry in `dependencies` in package.json.

6. **Adds configuration that relaxes gates.** Any flag, env var, or config file that allows skipping hard gates A-D without SKIP: reason in SHIP_GATE.md.

7. **Changes SHIP_GATE.md item count** without corresponding updates to README, tests, and this workflow.

8. **Alters exit-code semantics, skip semantics, or dogfood fetch classification** without synchronized updates to docs, tests, and org decision records. These are contract surfaces — changing one without updating all consumers is a silent contract breach.

## Doctrine references

- Error contract: `contracts/error-contract.md`
- Gate template: `templates/SHIP_GATE.md`
- Exit code semantics: `bin/shipcheck.mjs:25-34` (fail function), README.md (exit code chart)
- Self-dogfood: `.github/workflows/ci.yml` (dogfood job)
- Lockdown doctrine: `role-os-rollout/DOCTRINE.md`
