# Brand Rules — @mcptoolshop/shipcheck

## Tone

Direct. Factual. No hedging. Shipcheck tells you what passed, what failed, and what to do next. It does not apologize, encourage, or soften.

## Domain language

| Term | Meaning | Never say instead |
|------|---------|-------------------|
| gate | A category of requirements (A-E) | "check", "phase", "level" |
| hard gate | Gates A-D. Must pass to ship. | "recommended gate", "important gate" |
| soft gate | Gate E. Should be done but doesn't block. | "optional gate" (it's not optional, it's soft) |
| checked | Item marked `[x]` in SHIP_GATE.md | "completed", "done" |
| unchecked | Item marked `[ ]` without SKIP: | "pending", "todo", "remaining" |
| skipped | Item marked `[ ]` with SKIP: reason | "not applicable", "N/A" |
| pass rate | checked / (checked + unchecked) * 100 | "completion rate", "progress" |
| gap | An unchecked item | "issue", "problem", "finding" |
| truthful failure | Exit code reflects actual state | "honest error" |

## Forbidden metaphors

- No "journey" language. Shipcheck is not a process you go through. It's a gate you pass or fail.
- No "health" language. Repos are not healthy or unhealthy. They pass or fail gates.
- No "score" except in SCORECARD.md context. The audit reports pass rate, not a score.
- No "best practices." Shipcheck defines required practices, not suggestions.
- No "recommendations." Gaps are requirements, not recommendations.

## Truth constraints

1. **Pass rate must be mathematically correct.** `checked / (checked + unchecked) * 100`, rounded to integer. No rounding up to make it look better.
2. **Gap list must be complete.** Never truncate without indicating how many more exist.
3. **Exit codes must match semantics.** If the README says exit 1 means gaps remain, exit 1 must mean gaps remain. No silent swallowing.
4. **Template item count must be exact.** README says 31 items. SHIP_GATE.md must have 31 checkable items. If the count changes, both must update.

## Enforcement language bans

These patterns are explicitly banned in all shipcheck output, docs, and error messages:

1. **Advisory softening for hard failures.** Never say "consider fixing" or "you may want to address" when a hard gate fails. The gate failed. Say so.
2. **Vague reassurance.** Never say "you're almost there" or "just a few more items." Report the count. The operator decides how they feel.
3. **Optional-sounding enforcement.** Never say "this is recommended" or "ideally you should" for hard gate items. Hard gates are required, not recommended.
4. **"Probably okay" hedging.** Never say "this should be fine" or "likely passing" when the contract says fail. If the contract says fail, the output says fail.
5. **Checker-failure disguised as repo-failure.** Never say "gate failed" when the checker itself couldn't run (e.g., network fetch failed). These are different failure classes and must use different language and exit codes.

## Contamination risks

- **"Friendlier CLI" drift.** Shipcheck must not adopt progress bars, emoji celebrations, or encouraging language when gates pass. `All hard gates pass. Ship it.` is the correct output. Not `Great job! All gates passed!`
- **"Configurable strictness" drift.** No flags to relax hard gates. If A-D are hard, they're hard everywhere. The only escape valve is SKIP: with a reason.
- **"Plugin system" drift.** No custom gates, no user-defined checks, no extensibility. The standard is the standard.

## Interaction law

- CLI output uses ANSI colors sparingly: green=pass, yellow=warning/gap, red=fail, dim=skip/hint, cyan=info, bold=headers.
- Error output goes to stderr. Normal output goes to stdout.
- JSON mode (SHIPCHECK_JSON env var) emits structured errors to stderr only.
- Help text is plain, factual, and complete. No marketing language in --help.
