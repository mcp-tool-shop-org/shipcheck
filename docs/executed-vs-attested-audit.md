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
| D3 | Dependency scanning runs in CI | attested | Executable by parsing `.github/workflows` for a scan step — brittle | **residual (director decision)** |
| D4 | Automated dep-update mechanism | attested | Executable (dependabot.yml/renovate.json presence), but tension with org's CI-minutes rule | residual |
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
6. **provenance/OIDC actually configured** — supply-chain trust silently absent → **residual (director decision)**
7. **D3 dependency-scan actually runs** — silent vuln accumulation → **residual (director decision)**
8. D4 dep-update mechanism · C2 CHANGELOG · D1 verify-script · E1/E2/E4 identity presence — lower blast radius, presence-checkable → residual (low)

## Conversions shipped this PR

Gate I (`secrets`), Gate J (`manifest`), Gate K (`security-docs`) — each: zero-dep, pure injectable core, renderer, subcommand, exit 1 on real defect, wired into `verify`, exported for tests, and — non-negotiably — **a RED meta-test that mutates the protected thing and asserts the gate fires** (plant an AWS key → secrets RED; set version behind tag / strip engines / remove lockfile → manifest RED; empty SECURITY.md / strip the trust-model section → security-docs RED). Proven live on deliberately-broken fixtures, not just green on a good repo.

## Residual attested gates — named for the director

| Gate | Why not yet | Recommended shape |
|------|-------------|-------------------|
| **provenance/OIDC configured** | Two honest readings: (a) *static* — parse `release.yml` for `id-token: write` + `npm publish --provenance` (shipcheck's own release.yml is the reference); (b) *registry* — query npm for a published provenance attestation. (a) is zero-dep but proves *intent*, not *outcome*; (b) proves outcome but needs a network call. **Director: convert as static-parse, registry-query, or both?** | new `shipcheck provenance` (static) + optional `--registry` |
| **D3 dependency-scan runs in CI** | Executable by parsing `.github/workflows/*.yml` for a scan step (`npm audit` / `osv-scanner` / `snyk` / dependabot). Brittle across workflow styles; risk of false-negative. | new check in a `shipcheck ci` gate; needs a small allow-list of recognized scan steps |
| **A4 no telemetry by default** | A reliable generic detector (grep for analytics SDKs / outbound calls) is false-positive-prone; a bad detector trains maintainers to ignore it. | defer; per-repo assertion until a high-precision ruleset exists |
| **D4 automated dep-update mechanism** | `dependabot.yml`/`renovate.json` presence is trivially executable, but the org's `github-actions.md` rule says *don't add dependabot unless requested* — so "must exist" contradicts the CI-minutes policy. **Director: is D4 still a hard gate, or policy-relaxed?** | resolve the policy conflict before converting |
| C2 / D1 / C7 / E1 / E2 / E4 | Presence-checkable, low blast radius | batch into a future `shipcheck presence` gate if desired |

## The bar

After this PR, no repo can ship through a green shipcheck with: a credential in a published tarball, a package missing `engines`, an uncommitted lockfile, a manifest version behind its newest release tag, an empty/absent SECURITY.md, or a README with no trust model — **for any repo that runs the executed gates.** The gates not yet converted are named above, not silently trusted.
