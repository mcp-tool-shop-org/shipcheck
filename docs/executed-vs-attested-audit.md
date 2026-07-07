# Protocol Verifier Audit — executed vs attested

**Date:** 2026-07-07 · **Trigger:** storyboard-os shipped six `@storyboard-os/*` packages to npm with no LICENSE (two with no README) past two "comprehensive" dogfood-swarms and a shipcheck audit reporting 96% pass. Root cause: SHIP_GATE **D5** was a checkbox ticked green at the repo root while every published package tarball was incomplete. The gate verified *that a box was checked*, not *that the tarball was whole*.

This document classifies every gate in the studio's release/quality protocols as **executed** or **attested**, ranks the attested ones by blast radius, records the conversions shipped, and names the residual attested gates for the director.

## The distinction

- **EXECUTED** — code reads the real artifact (tarball, file, registry, git, CI log) and exits non-zero on the real defect. Trustworthy.
- **ATTESTED** — a human or LLM ticks a box / writes "done (date)". **The bug.** Can be green while false.
- **HYBRID** — only tickable after a script runs, but the script is not enforced. Treated as attested until enforced.

**The engine of attestation:** `shipcheck audit` (`auditCommand`) is a pure markdown-checkbox counter — it reads `SHIP_GATE.md` and tallies `- [x]` vs `- [ ]`, and **never reads the repo**. So *every* SHIP_GATE line is ATTESTED unless a separate executed gate (F/G/H/I/J/K) covers it.

**The meta-trap (do not repeat):** shipcheck's own workflow-standards audit scored its gate **3/3 "exemplary" on EXTERNAL_VERIFIER** because "no LLM runs in the gate; the counter can't lie about the boxes." The counter can't lie about the boxes; the boxes lie about reality. A green audit is not evidence the audit is sound. The rubric that exists to catch weak verification certified attestation-trust as exemplary verification.

## Source 1 — SHIP_GATE (31 items, inherited by every repo)

Verified only by `shipcheck audit` (checkbox count) except where an executed gate is noted.

| ID | Claim | Class | Mechanism / why | Converted |
|----|-------|-------|-----------------|-----------|
| A1 | SECURITY.md exists | ~~attested~~ **executed** | `runSecurityDocsGate` → `checkSecurityMd`: present + non-empty + reporting contact | **Gate K (this PR)** |
| A2 | README threat-model paragraph | ~~attested~~ **executed** | `checkThreatModel`: trust/threat section present + non-empty body (presence, not quality) | **Gate K (this PR)** |
| A3 | No secrets in source | ~~attested~~ **executed** | `runSecretsGate`: scans every publishable tarball for high-signal credentials, redacted | **Gate I (this PR)** |
| A4 | No telemetry by default | attested | Semantic; no generic executed check without high false-positive rate | residual |
| A5 | Dangerous actions need `--allow-*` | attested | Semantic / behavioral | no |
| A6 | File ops constrained to known dirs | attested | Semantic | no |
| A7 | `[mcp]` Network egress off by default | attested | Semantic | no |
| A8 | `[mcp]` Stack traces never exposed | attested | Semantic/behavioral | no |
| B1 | Structured error shape | attested | Behavioral; needs running the tool with crafted input | no |
| B2 | `[cli]` Exit-code contract | attested | Behavioral; testable per-tool, not generic | no |
| B3–B7 | Error handling (stacks, mcp, desktop, vscode) | attested | Behavioral | no |
| C1 | README current | hybrid | Partially executed by **Gate G front-door** (contradicted/stale claims) | partial |
| C2 | CHANGELOG.md (Keep a Changelog) | attested | Presence is executable; low blast radius | residual (low) |
| C3 | LICENSE present + support status | hybrid | LICENSE-in-tarball executed by **Gate H**; "support status" prose attested | partial |
| C4 | `[cli]` `--help` accurate | attested | Semantic | no |
| C5 | Logging levels defined | attested | Semantic | no |
| C6 | `[mcp]` Tools documented | attested | Semantic | no |
| C7 | `[complex]` HANDBOOK.md | attested | Presence executable; niche | residual (low) |
| D1 | `verify` script exists | attested | Presence executable (package.json scripts.verify); low blast radius | residual (low) |
| D2 | Version matches git tag | ~~attested~~ **executed** | `checkVersionTag`: manifest version not behind newest semver tag; `--expect` strict | **Gate J (this PR)** |
| D3 | Dependency scanning runs in CI | ~~attested~~ **executed (two layers)** | Gate L `checkDependencyScan` = a scanner is *configured* (mechanism, necessary-not-sufficient); **Gate M `runDepsGate` = actual vulnerabilities across every tree + alerting enabled (outcome)** | **Gate L + Gate M** |
| D4 | Automated dep-update mechanism | attested (by decision) | Executable, but making it a hard gate contradicts the org's "no dependabot unless requested" rule — see decision below | **left attested (decision)** |
| — | Published via OIDC + `--provenance` | ~~n/a (not a SHIP_GATE line)~~ **executed** | `checkProvenanceConfig` (intent) + `checkProvenancePublished` (outcome, `--registry`) | **Gate L (this PR)** |
| D5 | `[npm]` `npm pack` includes README/LICENSE | **executed** | `runPublishGate` (`shipcheck pack`) | Gate H (v1.0.7) |
| D6 | `[npm]` `engines.node` / `[pypi]` `python_requires` | ~~attested~~ **executed** | `checkEngines`: per publishable package | **Gate J (this PR)** |
| D7 | `[npm]` Lockfile committed / `[pypi]` wheel+sdist | ~~attested~~ **executed (npm half)** | `checkLockfile`: lockfile at root; pypi wheel/sdist build not yet executed | **Gate J (this PR)** |
| D8 | `[vsix]` clean `.vsix` | attested | Needs `vsce`; niche | no |
| D9 | `[desktop]` Installer builds | attested | Heavy; niche | no |
| E1 | Logo in README | attested | Presence executable; soft gate | residual (low) |
| E2 | Translations (8 langs) | attested | Presence executable (README.*.md); soft gate | residual (low) |
| E3 | Landing page | hybrid | Adjacent to Gate G; soft gate | no |
| E4 | GitHub metadata | attested | Executable via `gh repo view --json`; soft gate | residual (low) |

## Source 2 — shipcheck's own subcommands

| Subcommand | Class | Note |
|------------|-------|------|
| `audit` (`auditCommand`) | **executed-of-attestation** | Faithfully counts boxes; the boxes attest reality. This is the engine of the bug — it is a real exit-code gate over the *wrong* input. |
| `dogfood` (Gate F) | **executed** | Fetches an independent dogfood-lab record (external verifier). Genuine. |
| `front-door` (Gate G) | **executed** | Delegates to site-theme's separate-package verifier. Genuine. |
| `pack` (Gate H) | **executed** | Reads tarball file lists via `npm pack`. The conversion template. |
| `secrets` (Gate I) | **executed** | New this PR. |
| `manifest` (Gate J) | **executed** | New this PR. |
| `security-docs` (Gate K) | **executed** | New this PR. |

## Source 3 — full-treatment (7 phases)

| Phase | Class | Note |
|-------|-------|------|
| 0 Shipcheck gate | hybrid | Real exit-code gate, but gates on `audit` (attestation count). Now stronger because A1/A2/A3/D2/D5/D6/D7 under it are executed. |
| 1 README + translations | attested | Human-authored; ja-degenerate check is real but post-deploy (Phase 7). |
| 2 Landing page | executed | `npm run build` verifies. |
| 3 Handbook | executed | `dist/` build artifacts checked. |
| 4 Metadata + coverage | attested | `gh repo edit` is an action; coverage badge attested. |
| 5 repo-knowledge DB | hybrid | `show <slug>` verify is executed-ish. |
| 6 Commit + deploy | action | — |
| 7 Post-deploy verify | mixed | "CI passes" executed (`gh run list`); "landing renders"/"ja degenerate" partly attested (eyeballed). |

## Source 4 — dogfood-swarm (10 phases)

Agent-driven audits are **attested by agent judgment**; the gates between them are executed. Protocol v2's *test-first gate*, *mechanical completeness gates (ast-grep)*, and the codified **"prove the gate goes RED"** rule are executed disciplines and are the correct model — this PR applies that rule to shipcheck's own gates. Severity triage remains attested. Phase 10 = full-treatment. Recommendation already in the feedback memory: add a `shipcheck pack`/`secrets` artifact-reality lens to Phase 10.

## Ranked backlog (attested → convert, worst first)

Blast radius = *ships a broken/dangerous artifact silently.*

1. **A3 no secrets in tarball** — credential leak, catastrophic + silent → **shipped: Gate I**
2. **D2 version matches tag** — mislabeled/duplicate release (testing-os v1.3.0 shipped this box FALSE) → **shipped: Gate J**
3. **D6 engines set** — installs on incompatible runtime, cryptic failure → **shipped: Gate J**
4. **D7 lockfile committed** — non-reproducible installs, supply-chain drift → **shipped: Gate J**
5. **A1/A2 SECURITY/threat-model present-and-nonempty** — ships a repo claiming a security posture it doesn't document → **shipped: Gate K**
6. **provenance/OIDC actually configured** — supply-chain trust silently absent → **shipped: Gate L** (both layers — see below)
7. **D3 dependency-scan actually runs** — silent vuln accumulation → **shipped: Gate L (config) + Gate M (real vulns + alerting)**
8. D4 dep-update mechanism — superseded by Gate M (the outcome, not the bot) · C2 CHANGELOG · D1 verify-script · E1/E2/E4 identity presence — lower blast radius, presence-checkable → residual (low)

## Conversions shipped this PR

Gates I (`secrets`), J (`manifest`), K (`security-docs`), L (`ci`), M (`deps`) — each: zero-dep, pure injectable core, renderer, subcommand, exit 1 on real defect, wired into `verify`, exported for tests, and — non-negotiably — **a RED meta-test that mutates the protected thing and asserts the gate fires** (plant an AWS key → secrets RED; set version behind tag / strip engines / remove lockfile → manifest RED; empty SECURITY.md / strip the trust-model section → security-docs RED; un-hardened publish workflow / no scanner → ci RED; a subtree with a high vuln / disabled alerting → deps RED). Proven live on deliberately-broken fixtures **and on shipcheck's own repo**, not just green on a good repo.

**On provenance — there is no intent-vs-outcome choice.** An earlier draft framed provenance as "static workflow parse (proves intent) *or* npm-registry query (proves outcome)" and punted the pick. That was a false dichotomy. Gate L does **both**: `checkProvenanceConfig` reads the publish workflows (intent — always on, zero-network, catches misconfiguration before you publish) and `checkProvenancePublished` (`--registry`) confirms the tarball carries a provenance attestation on npm (outcome — opt-in so `verify`/CI stays network-free). Two layers, complementary.

**Also fixed here:** `--json` emitted a human header line before the JSON on every gate — the entire mission is that "consistent with the existing (broken) behavior" is how defects survive, so this was fixed, not preserved. `--json` is now pure JSON everywhere.

**On dependency scanning — the mechanism-check was itself theater.** The first pass "converted" D3 with Gate L's `checkDependencyScan`, which verifies a scanner is *configured in a workflow*. That passes green on shipcheck — whose real posture was: **vulnerability alerting disabled, and a `site/` subtree carrying 7 high-severity vulnerabilities that the root-only `npm audit` never saw.** A configured scanner that audits only the monorepo root is the D5 blind spot one level up. **Gate M (`shipcheck deps`)** is the outcome: it runs `npm audit` in *every* lockfile'd tree and fails on real vulnerabilities at/above `--level`, and it checks whether Dependabot alerting is even enabled. Running it on shipcheck itself immediately flagged both problems. This is the difference between "a scanner exists" and "there are no known vulnerabilities."

This also resolves the D4 tension for real (not by softening wording): the org rule restricts the auto-update-PR *bot* (CI minutes). It does **not** restrict vulnerability *alerts*, which are free. The correct posture is **alerts ON** (Gate M checks this) + **no open high/critical** (Gate M checks this) + auto-update-bot optional. Gate M enforces the security floor without mandating the noisy bot — the contradiction dissolves because alerting ≠ auto-updating.

**What running the new gate found on shipcheck itself:** 7 high vulns in `site/` (6 fixed with safe patches this PR; 1 Astro SSRF needs a breaking Starlight-incompatible major bump — tracked residual, and `site/` is `private`/not shipped), and Dependabot alerting **disabled** (owner must enable — a settings change outside advisor permission). The tool now indicts its own repo instead of certifying it green.

## Residual attested gates — the decisions, made

The remaining attested gates are decisions, and they've been made here rather than deferred:

| Gate | Decision | Reasoning |
|------|----------|-----------|
| **D4 automated dep-update mechanism** | **Superseded by Gate M — not converted as a bot-presence check.** | The org rule restricts the auto-update *bot* (CI minutes), not the security *outcome*. Gate M enforces the real thing (no known vulns ≥ level + alerting enabled) without mandating the bot, so gating on "a bot exists" is the wrong shape. The security floor D4 was reaching for is now executed by Gate M. Recommend downgrading the SHIP_GATE D4 line from hard to soft — the auto-PR bot genuinely is optional; the *outcome* is not. |
| **A4 no telemetry by default** | Left attested. | A generic detector (grep for analytics SDKs / outbound calls) is false-positive-prone, and a noisy gate trains maintainers to ignore it — the opposite of the goal. Convert only when a high-precision ruleset exists; a bad executed gate is worse than an honest attestation. |
| C2 / D1 / C7 / E1 / E2 / E4 | Left attested (low priority). | Presence-checkable, low blast radius. A future `shipcheck presence` gate could batch these; not worth a gate each today. |

## Operational residuals surfaced by running Gate M on shipcheck

Not gate-design residuals — real defects the new gate found in shipcheck itself, kept honest here rather than hidden:

| Item | State | Owner action |
|------|-------|--------------|
| `site/` Astro SSRF (GHSA-2pvr-wf23-7pc7) | 6 of 7 highs fixed this PR (safe patches, build verified); this 1 needs an Astro major that breaks the Starlight build. `site/` is `private`/not shipped to npm. | Migrate `site/` to a Starlight-compatible Astro major (the known site-theme astro-pin dance), or accept as build-time-only. Gate M flags it on every full `shipcheck deps` run. |
| Dependabot alerting **disabled** on the repo | Confirmed off (HTTP 404) — the reason vulns accrued unnoticed. | `gh api -X PUT repos/mcp-tool-shop-org/shipcheck/vulnerability-alerts` (owner action — a persistent org-repo settings change, outside advisor auto-permission). Free; not the restricted auto-PR bot. |

## The bar

After this PR, no repo can ship through a green shipcheck with: a credential in a published tarball, a package missing `engines`, an uncommitted lockfile, a manifest version behind its newest release tag, an empty/absent SECURITY.md, a README with no trust model, an `npm publish` path without OIDC+provenance, a CI with no dependency scanner configured, **a shipped dependency with a known high/critical vulnerability, or (with a token present) vulnerability alerting switched off** — for any repo that runs the executed gates. The gates left attested are decisions with reasons, not silent trust.
