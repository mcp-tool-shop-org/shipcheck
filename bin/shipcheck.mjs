#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, existsSync, copyFileSync, statSync } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const CWD = process.cwd();
const PKG = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8"));

const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(msg) { console.log(msg); }
function ok(msg) { log(`${GREEN}✓${RESET} ${msg}`); }
function skip(msg) { log(`${DIM}  skip${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}!${RESET} ${msg}`); }

// Structured error shape (Tier 1) + exit codes (Tier 2)
function fail(code, message, hint, exitCode = 1) {
  const error = { code, message, hint };
  if (process.env.SHIPCHECK_JSON) {
    console.error(JSON.stringify(error));
  } else {
    console.error(`${YELLOW}Error [${code}]:${RESET} ${message}`);
    console.error(`${DIM}Hint: ${hint}${RESET}`);
  }
  process.exit(exitCode);
}

// --- Detect repo type ---

function detectTypes() {
  const tags = new Set(["all"]);

  if (existsSync(join(CWD, "package.json"))) {
    const pkg = JSON.parse(readFileSync(join(CWD, "package.json"), "utf8"));
    tags.add("npm");
    // Check if it's an MCP server
    const desc = (pkg.description || "").toLowerCase();
    const keywords = (pkg.keywords || []).map(k => k.toLowerCase());
    if (desc.includes("mcp") || keywords.includes("mcp") || keywords.includes("model-context-protocol")) {
      tags.add("mcp");
    }
    // Check for CLI bin
    if (pkg.bin) {
      tags.add("cli");
    }
  }

  if (existsSync(join(CWD, "pyproject.toml")) || existsSync(join(CWD, "setup.py"))) {
    tags.add("pypi");
  }

  if (existsSync(join(CWD, "Dockerfile")) || existsSync(join(CWD, "docker-compose.yml"))) {
    tags.add("container");
  }

  // VS Code extension
  const vsceFiles = [".vscodeignore", "vsc-extension-quickstart.md"];
  if (vsceFiles.some(f => existsSync(join(CWD, f)))) {
    tags.add("vsix");
  }
  if (existsSync(join(CWD, "package.json"))) {
    try {
      const pkg = JSON.parse(readFileSync(join(CWD, "package.json"), "utf8"));
      if (pkg.engines?.vscode) tags.add("vsix");
    } catch {}
  }

  // Desktop app signals
  const desktopSignals = ["tauri.conf.json", "electron-builder.yml", "forge.config.js"];
  if (desktopSignals.some(f => existsSync(join(CWD, f)))) {
    tags.add("desktop");
  }
  // .NET desktop (MAUI, WinUI)
  try {
    for (const f of readdirSync(CWD).filter(f => f.endsWith(".csproj"))) {
      const content = readFileSync(join(CWD, f), "utf8");
      if (content.includes("Maui") || content.includes("WinUI")) {
        tags.add("desktop");
      }
    }
  } catch {}

  return [...tags];
}

// --- Commands ---

function initCommand() {
  log(`\n${BOLD}shipcheck init${RESET}\n`);

  const types = detectTypes();
  log(`${CYAN}Detected tags:${RESET} ${types.map(t => `[${t}]`).join(" ")}\n`);

  const files = [
    { src: "templates/SHIP_GATE.md", dest: "SHIP_GATE.md" },
    { src: "templates/SECURITY.md", dest: "SECURITY.md", skipIf: "SECURITY.md" },
    { src: "templates/CHANGELOG.md", dest: "CHANGELOG.md", skipIf: "CHANGELOG.md" },
    { src: "templates/SCORECARD.md", dest: "SCORECARD.md" },
  ];

  for (const { src, dest, skipIf } of files) {
    const destPath = join(CWD, dest);
    if (skipIf && existsSync(destPath)) {
      skip(`${dest} already exists`);
      continue;
    }
    const srcPath = join(PKG_ROOT, src);
    if (!existsSync(srcPath)) {
      fail("IO_TEMPLATE_MISSING", `Template not found: ${src}`, "Reinstall @mcptoolshop/shipcheck", 2);
    }

    let content = readFileSync(srcPath, "utf8");

    // Inject detected tags into SHIP_GATE header
    if (dest === "SHIP_GATE.md") {
      content = content.replace(
        /<!-- repo type tags -->/,
        types.map(t => `\`[${t}]\``).join(" ")
      );
    }

    // Fill SECURITY.md placeholders
    if (dest === "SECURITY.md") {
      // Try to read author email from package.json
      try {
        const pkg = JSON.parse(readFileSync(join(CWD, "package.json"), "utf8"));
        if (pkg.bugs?.url) {
          content = content.replace(
            /<!-- report-email -->/g,
            pkg.bugs.url
          );
        }
      } catch {}
    }

    writeFileSync(destPath, content, "utf8");
    ok(dest);
  }

  log(`\n${BOLD}Next steps:${RESET}`);
  log(`  1. Open ${CYAN}SHIP_GATE.md${RESET} and check off applicable items`);
  log(`  2. Mark non-applicable items with ${DIM}SKIP: reason${RESET}`);
  log(`  3. Ship when all hard gates (A-D) pass`);
  log(`\n  Read ${CYAN}ADOPTION.md${RESET} for the full walkthrough:`);
  log(`  ${DIM}https://github.com/mcp-tool-shop-org/shipcheck/blob/main/ADOPTION.md${RESET}\n`);
}

function auditCommand() {
  log(`\n${BOLD}shipcheck audit${RESET}\n`);

  if (!existsSync(join(CWD, "SHIP_GATE.md"))) {
    fail("STATE_MISSING_GATE", "No SHIP_GATE.md found", "Run 'shipcheck init' first");
  }

  const content = readFileSync(join(CWD, "SHIP_GATE.md"), "utf8");
  const lines = content.split("\n");

  let checked = 0;
  let unchecked = 0;
  let skipped = 0;
  const gaps = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
      checked++;
    } else if (trimmed.startsWith("- [ ]")) {
      if (trimmed.includes("SKIP:")) {
        skipped++;
      } else {
        unchecked++;
        // Extract the item text
        const text = trimmed.replace(/^- \[ \] /, "").substring(0, 80);
        gaps.push(text);
      }
    }
  }

  const total = checked + unchecked + skipped;
  const passRate = total > 0 ? Math.round((checked / (checked + unchecked)) * 100) : 0;

  log(`${GREEN}Checked:${RESET}   ${checked}`);
  log(`${YELLOW}Unchecked:${RESET} ${unchecked}`);
  log(`${DIM}Skipped:${RESET}   ${skipped}`);
  log(`${BOLD}Pass rate:${RESET} ${passRate}%\n`);

  if (gaps.length > 0) {
    log(`${YELLOW}${BOLD}Remaining gaps:${RESET}`);
    for (const gap of gaps.slice(0, 10)) {
      log(`  ${YELLOW}○${RESET} ${gap}`);
    }
    if (gaps.length > 10) {
      log(`  ${DIM}...and ${gaps.length - 10} more${RESET}`);
    }
    log("");
  }

  if (unchecked === 0) {
    log(`${GREEN}${BOLD}All hard gates pass. Ship it.${RESET}\n`);
  } else {
    log(`${YELLOW}${unchecked} item(s) still need attention.${RESET}\n`);
    process.exit(1);
  }
}

// --- Gate F: Dogfood freshness ---

const DEFAULT_DOGFOOD_REPO = "dogfood-lab/testing-os";
const DEFAULT_DOGFOOD_REF = "main";
const DEFAULT_FRESHNESS_DAYS = 30;

async function fetchEnforcementMode(dogfoodRepo, dogfoodRef, repo) {
  // Extract org/name from repo slug to build policy path
  const policyPath = `policies/repos/${repo}.yaml`;
  const url = `https://raw.githubusercontent.com/${dogfoodRepo}/${dogfoodRef}/${policyPath}`;
  const res = await fetch(url);
  if (!res.ok) {
    // No policy file = default to required
    return { mode: "required", reason: null, review_after: null };
  }
  const text = await res.text();
  // Simple extraction — no YAML parser needed
  const modeMatch = text.match(/enforcement:\s*\n\s+mode:\s*(\S+)/);
  const mode = modeMatch ? modeMatch[1] : "required";
  const reasonMatch = text.match(/enforcement:[\s\S]*?reason:\s*(.+)/);
  const reason = reasonMatch ? reasonMatch[1].trim() : null;
  const reviewMatch = text.match(/enforcement:[\s\S]*?review_after:\s*(\S+)/);
  const review_after = reviewMatch ? reviewMatch[1] : null;
  return { mode, reason: reason === "null" ? null : reason, review_after: review_after === "null" ? null : review_after };
}

async function fetchDogfoodIndex(dogfoodRepo, dogfoodRef) {
  const url = `https://raw.githubusercontent.com/${dogfoodRepo}/${dogfoodRef}/indexes/latest-by-repo.json`;
  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false, error: `DOGFOOD_INDEX_FETCH_FAILED`, detail: `${res.status} from ${url}` };
  }
  const index = await res.json();
  return { ok: true, index };
}

function evaluateDogfoodGate(index, repo, surface, freshnessDays) {
  const repoEntry = index[repo];
  if (!repoEntry) {
    return { pass: false, reason: "DOGFOOD_NO_RECORD", detail: `No dogfood record found for ${repo}` };
  }

  const surfaceEntry = repoEntry[surface];
  if (!surfaceEntry) {
    const available = Object.keys(repoEntry).join(", ");
    return { pass: false, reason: "DOGFOOD_NO_SURFACE", detail: `No dogfood record for surface "${surface}" on ${repo}. Available: ${available || "none"}` };
  }

  if (surfaceEntry.verification_status !== "accepted") {
    return { pass: false, reason: "DOGFOOD_REJECTED", detail: `Latest record was rejected by verifier (status: ${surfaceEntry.verification_status})` };
  }

  if (surfaceEntry.verified !== "pass") {
    return { pass: false, reason: "DOGFOOD_VERDICT_FAIL", detail: `Latest verified verdict is "${surfaceEntry.verified}" (run: ${surfaceEntry.run_id})` };
  }

  const finishedAt = new Date(surfaceEntry.finished_at);
  const now = new Date();
  const ageMs = now - finishedAt;
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  if (ageDays > freshnessDays) {
    return { pass: false, reason: "DOGFOOD_STALE", detail: `Latest dogfood is ${ageDays} days old (limit: ${freshnessDays} days, run: ${surfaceEntry.run_id})` };
  }

  return { pass: true, run_id: surfaceEntry.run_id, ageDays };
}

function renderDogfoodGateResult(result, repo, surface, enforcement) {
  if (enforcement.mode === "exempt") {
    log(`${DIM}${BOLD}Gate F: exempt${RESET}`);
    log(`  ${DIM}○${RESET} ${repo} [${surface}] — exempt from dogfood enforcement`);
    if (enforcement.reason) log(`  ${DIM}Reason: ${enforcement.reason}${RESET}`);
    if (enforcement.review_after) log(`  ${DIM}Review after: ${enforcement.review_after}${RESET}`);
    log("");
    return;
  }

  if (result.pass) {
    log(`${GREEN}${BOLD}Gate F: dogfood passed${RESET}`);
    log(`  ${GREEN}✓${RESET} ${repo} [${surface}] — verified pass, ${result.ageDays}d old (run: ${result.run_id})`);
  } else if (enforcement.mode === "warn-only") {
    log(`${YELLOW}${BOLD}Gate F: dogfood warning${RESET}`);
    log(`  ${YELLOW}!${RESET} ${result.detail}`);
    log(`  ${DIM}Reason: ${result.reason} (warn-only — not blocking)${RESET}`);
    if (enforcement.reason) log(`  ${DIM}Policy note: ${enforcement.reason}${RESET}`);
  } else {
    log(`${RED}${BOLD}Gate F: dogfood failed${RESET}`);
    log(`  ${RED}✗${RESET} ${result.detail}`);
    log(`  ${DIM}Reason: ${result.reason}${RESET}`);
  }
  log("");
}

async function dogfoodCommand() {
  log(`\n${BOLD}shipcheck dogfood${RESET}\n`);

  const args = process.argv.slice(3);

  // Parse flags
  let repo = null;
  let surface = null;
  let dogfoodRepo = DEFAULT_DOGFOOD_REPO;
  let dogfoodRef = DEFAULT_DOGFOOD_REF;
  let freshnessDays = DEFAULT_FRESHNESS_DAYS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) { repo = args[++i]; }
    else if (args[i] === "--surface" && args[i + 1]) { surface = args[++i]; }
    else if (args[i] === "--dogfood-repo" && args[i + 1]) { dogfoodRepo = args[++i]; }
    else if (args[i] === "--dogfood-ref" && args[i + 1]) { dogfoodRef = args[++i]; }
    else if (args[i] === "--freshness-days" && args[i + 1]) { freshnessDays = parseInt(args[++i], 10); }
  }

  if (!repo) {
    fail("INPUT_MISSING_REPO", "Missing --repo flag", "Usage: shipcheck dogfood --repo org/repo --surface cli");
  }
  if (!surface) {
    fail("INPUT_MISSING_SURFACE", "Missing --surface flag", "Usage: shipcheck dogfood --repo org/repo --surface cli");
  }

  // Fetch enforcement mode
  const enforcement = await fetchEnforcementMode(dogfoodRepo, dogfoodRef, repo);

  // Exempt — report and exit clean
  if (enforcement.mode === "exempt") {
    renderDogfoodGateResult(null, repo, surface, enforcement);
    return;
  }

  // Fetch index
  const fetchResult = await fetchDogfoodIndex(dogfoodRepo, dogfoodRef);
  if (!fetchResult.ok) {
    fail(fetchResult.error, fetchResult.detail, "Check that dogfood-lab/testing-os repo and indexes/latest-by-repo.json exist");
  }

  // Evaluate
  const result = evaluateDogfoodGate(fetchResult.index, repo, surface, freshnessDays);

  // Render
  renderDogfoodGateResult(result, repo, surface, enforcement);

  if (!result.pass) {
    if (enforcement.mode === "warn-only") {
      return; // warn but don't block
    }
    if (process.env.SHIPCHECK_JSON) {
      console.error(JSON.stringify({ code: result.reason, message: result.detail }));
    }
    process.exit(1);
  }
}

// --- Gate G: AI-native front door (delegates to @mcptoolshop/site-theme) ---
//
// Verifies that a repo's AI-native front door (README / AGENTS.md / llms.txt)
// tells the truth, by consuming the `front-door` verifier shipped in
// @mcptoolshop/site-theme (>=2.0.0). The verifier is read-only and makes no
// network requests. site-theme is an OPTIONAL peer dependency — a hard dep
// would drag astro/vite/sharp (~280 packages) into this zero-dep CLI — so when
// it is not installed this gate SKIPS gracefully (exit 0) and never crashes the
// audit. It is the machine-readable complement to the Operator Docs (C) and
// Identity (E) gates.
//
// --- Standards compliance (memory/workflow_standards.md) ---
// PIN_PER_STEP              2 — deterministic: same files in, same scorecard out.
// ANDON_AUTHORITY          2 — exit 1 on any gate-failing finding; bad docs never ship.
// NAMED_COMPENSATORS       n/a — read-only verify, no irreversible tool calls.
// DECOMPOSE_BY_SECRETS     3 — own subcommand; the verifier engine lives in site-theme.
// UNCERTAINTY_GATED_HUMANS 2 — a missing/unloadable dep SKIPS with a clear message, never asserts pass.
// EXTERNAL_VERIFIER        3 — the verifier is a separate package (different codebase), not self-graded.

const FRONT_DOOR_MODULE = "@mcptoolshop/site-theme/front-door";
// Severity order mirrors site-theme's front-door model (risk-ordered, worst first).
const FRONT_DOOR_SEVERITIES = ["contradicted", "unbacked", "stale", "bloat", "hygiene", "style"];
// Severities that fail the gate (the front door makes a claim the repo does not back).
const FRONT_DOOR_GATE_FAIL = new Set(["contradicted", "unbacked", "stale"]);

// Map a front-door scorecard into shipcheck's dimension summary. Pure + defensive:
// tolerates a partial/malformed scorecard so a verifier change can never crash the audit.
function summarizeFrontDoor(scorecard) {
  const findings = Array.isArray(scorecard?.findings) ? scorecard.findings : [];

  const bySeverity = {};
  for (const s of FRONT_DOOR_SEVERITIES) bySeverity[s] = 0;
  const counts = scorecard?.counts?.bySeverity;
  if (counts && typeof counts === "object") {
    for (const s of FRONT_DOOR_SEVERITIES) bySeverity[s] = counts[s] ?? 0;
  } else {
    for (const f of findings) {
      if (f && Object.prototype.hasOwnProperty.call(bySeverity, f.severity)) bySeverity[f.severity] += 1;
    }
  }

  const topFindings = findings.filter((f) => f && FRONT_DOOR_GATE_FAIL.has(f.severity)).slice(0, 5);
  const failing = scorecard?.gate?.failing ?? findings.filter((f) => f && FRONT_DOOR_GATE_FAIL.has(f.severity)).length;
  const pass = scorecard?.gate ? scorecard.gate.pass === true : failing === 0;
  const total = scorecard?.counts?.total ?? findings.length;
  const reason =
    scorecard?.gate?.reason ??
    (pass
      ? "No contradicted, unbacked, or stale claims."
      : `${failing} gate-failing finding(s): the front door makes claims the repo does not back.`);

  return { pass, failing, total, bySeverity, reason, topFindings };
}

// Run the front-door gate against `root`. `loadVerify` is injectable for tests;
// it defaults to importing the optional site-theme peer. Never throws: any
// failure to load or run the verifier becomes a graceful skip.
async function runFrontDoorGate({ root = CWD, loadVerify } = {}) {
  const load = loadVerify ?? (() => import(FRONT_DOOR_MODULE));

  let mod;
  try {
    mod = await load();
  } catch (err) {
    return {
      status: "skip",
      reason: `${FRONT_DOOR_MODULE} not installed`,
      detail: "Install @mcptoolshop/site-theme (>=2.0.0) to enable the AI-native front-door gate.",
      error: err?.message || String(err),
    };
  }

  const verify = mod?.verify;
  if (typeof verify !== "function") {
    return {
      status: "skip",
      reason: `${FRONT_DOOR_MODULE} did not export verify()`,
      detail: "Upgrade @mcptoolshop/site-theme to >=2.0.0 — its front-door entry must export verify({ root }).",
    };
  }

  let scorecard;
  try {
    scorecard = verify({ root });
  } catch (err) {
    return {
      status: "skip",
      reason: "front-door verify() threw",
      detail: "The front-door verifier errored — audit continues without this gate.",
      error: err?.message || String(err),
    };
  }

  const summary = summarizeFrontDoor(scorecard);
  return { status: summary.pass ? "pass" : "fail", summary };
}

function renderFrontDoorSeverityLine(bySeverity) {
  return FRONT_DOOR_SEVERITIES.map((s) => `${s} ${bySeverity[s]}`).join(" · ");
}

function renderFrontDoorResult(result) {
  if (result.status === "skip") {
    log(`${DIM}${BOLD}Gate G: front door skipped${RESET}`);
    log(`  ${DIM}○${RESET} ${result.reason}`);
    if (result.detail) log(`  ${DIM}${result.detail}${RESET}`);
    log("");
    return;
  }

  const { summary } = result;
  if (result.status === "pass") {
    log(`${GREEN}${BOLD}Gate G: front door passed${RESET}`);
    log(`  ${GREEN}✓${RESET} ${summary.reason}`);
  } else {
    log(`${RED}${BOLD}Gate G: front door failed${RESET}`);
    log(`  ${RED}✗${RESET} ${summary.reason}`);
  }
  log(`  ${DIM}Severity: ${renderFrontDoorSeverityLine(summary.bySeverity)} (total ${summary.total})${RESET}`);
  if (summary.topFindings.length > 0) {
    log(`  ${YELLOW}${BOLD}Gate-failing findings:${RESET}`);
    for (const f of summary.topFindings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      log(`    ${RED}✗${RESET} [${f.severity}] ${f.title} ${DIM}(${loc})${RESET}`);
    }
  }
  log("");
}

async function frontDoorCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck front-door${RESET}\n`);
  const result = await runFrontDoorGate({ root });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderFrontDoorResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      console.error(JSON.stringify({ code: "FRONTDOOR_GATE_FAIL", message: result.summary.reason }));
    }
    process.exit(1);
  }
  // skip + pass exit 0 — a missing verifier never blocks the audit.
}

// --- Gate H: publish surface — every publishable package ships a complete tarball ---
//
// The failure this gate exists to prevent: a package whose package.json `files`
// field PROMISES README.md + LICENSE but whose published tarball ships without
// them. The D5 SHIP_GATE line ("npm pack --dry-run includes README/LICENSE") is a
// human-checked box — it can be checked while false, and in a monorepo it is easy
// to verify the ROOT package and never the N *published* workspace packages. This
// gate EXECUTES the check, per publishable package, so the box cannot be green
// while a tarball is incomplete.
//
// Standards compliance (memory/workflow_standards.md):
// PIN_PER_STEP 2 — deterministic: same tree in, same findings out.
// ANDON_AUTHORITY 2 — exit 1 on any incomplete tarball; an unlicensed package never ships green.
// NAMED_COMPENSATORS n/a — read-only (`npm pack --dry-run` writes nothing).
// DECOMPOSE_BY_SECRETS 3 — its own gate; changes when packaging rules change.
// UNCERTAINTY_GATED_HUMANS 2 — no publishable packages → explicit skip, never a false pass.
// EXTERNAL_VERIFIER 3 — npm's own packer computes the tarball contents, not shipcheck's self-grade.

function readJsonSafe(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

// Expand a workspace glob ("packages/*", "apps/*", or a literal "packages/core")
// into directories that contain a package.json. Deliberately supports only the
// trailing "/*" form the org uses — not full globbing — to stay zero-dep.
function expandWorkspaceGlob(root, pattern) {
  const clean = String(pattern).trim().replace(/\/+$/, "");
  const dirs = [];
  if (clean.endsWith("/*")) {
    const baseDir = join(root, clean.slice(0, -2));
    if (!existsSync(baseDir)) return dirs;
    let entries;
    try { entries = readdirSync(baseDir, { withFileTypes: true }); } catch { return dirs; }
    for (const e of entries) {
      if (e.isDirectory() && existsSync(join(baseDir, e.name, "package.json"))) {
        dirs.push(join(baseDir, e.name));
      }
    }
  } else if (existsSync(join(root, clean, "package.json"))) {
    dirs.push(join(root, clean));
  }
  return dirs;
}

// Collect workspace globs from npm (package.json `workspaces`) OR pnpm
// (pnpm-workspace.yaml `packages:`). Line-parses the YAML list rather than
// pulling a YAML dependency, matching the dogfood gate's approach.
function workspaceGlobs(root) {
  const globs = [];
  const rootPkg = readJsonSafe(join(root, "package.json"));
  if (rootPkg?.workspaces) {
    const ws = Array.isArray(rootPkg.workspaces) ? rootPkg.workspaces : (rootPkg.workspaces.packages || []);
    globs.push(...ws);
  }
  const pnpmWs = join(root, "pnpm-workspace.yaml");
  if (existsSync(pnpmWs)) {
    let inPackages = false;
    for (const line of readFileSync(pnpmWs, "utf8").split("\n")) {
      if (/^packages:\s*$/.test(line)) { inPackages = true; continue; }
      if (!inPackages) continue;
      const m = line.match(/^\s*-\s*['"]?([^'"#\s]+)['"]?\s*$/);
      if (m) globs.push(m[1]);
      else if (/^\S/.test(line)) inPackages = false; // dedent ends the list
    }
  }
  return [...new Set(globs)];
}

// Every package that WOULD publish to a registry: a package.json with a name
// that is not marked `private: true`. In a non-workspace repo, that's the root.
function discoverPublishablePackages(root = CWD) {
  const globs = workspaceGlobs(root);
  const dirs = globs.length === 0
    ? (existsSync(join(root, "package.json")) ? [root] : [])
    : globs.flatMap((g) => expandWorkspaceGlob(root, g));

  const pkgs = [];
  for (const dir of [...new Set(dirs)]) {
    const pj = readJsonSafe(join(dir, "package.json"));
    if (!pj || !pj.name || pj.private === true) continue;
    pkgs.push({ dir, name: pj.name, pj });
  }
  return pkgs;
}

// Default packer: ask npm what the tarball WOULD contain. Read-only. Injectable
// in tests so the unit suite never shells out.
function defaultPackRunner(dir) {
  // `shell: true` so `npm` resolves to npm.cmd on Windows — execFileSync cannot
  // spawn a .cmd directly on current Node (EINVAL). Args are fixed literals with
  // no injection surface; `dir` is passed via cwd, never interpolated.
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 120_000, shell: true,
  });
  const parsed = JSON.parse(out);
  return (parsed?.[0]?.files || []).map((f) => f.path);
}

// Gate H core. Pure given `packRunner`; returns { status, checked, findings }.
function runPublishGate({ root = CWD, packRunner = defaultPackRunner } = {}) {
  const pkgs = discoverPublishablePackages(root);
  if (pkgs.length === 0) {
    return { status: "skip", reason: "no publishable packages found", checked: 0, findings: [] };
  }

  const hasReadme = (files) => files.some((f) => /(^|\/)readme\.md$/i.test(f) || /(^|\/)readme$/i.test(f));
  const hasLicense = (files) => files.some((f) => /(^|\/)licen[cs]e(\.[^/]+)?$/i.test(f));

  const findings = [];
  for (const p of pkgs) {
    const issues = [];
    if (!p.pj.license) issues.push("package.json has no `license` field");
    for (const entry of p.pj.files || []) {
      const base = String(entry).replace(/\/+$/, "");
      if (!existsSync(join(p.dir, base))) issues.push(`files[] promises "${entry}" but it is not on disk`);
    }
    let files = null;
    try { files = packRunner(p.dir); }
    catch (err) { issues.push(`npm pack failed: ${err?.message || String(err)}`); }
    if (files) {
      if (!hasReadme(files)) issues.push("published tarball contains no README");
      if (!hasLicense(files)) issues.push("published tarball contains no LICENSE");
    }
    if (issues.length) findings.push({ name: p.name, dir: p.dir, issues });
  }

  return { status: findings.length === 0 ? "pass" : "fail", checked: pkgs.length, findings };
}

function renderPublishResult(result) {
  if (result.status === "skip") {
    log(`${DIM}${BOLD}Gate H: publish surface skipped${RESET}`);
    log(`  ${DIM}○${RESET} ${result.reason}`);
    log("");
    return;
  }
  if (result.status === "pass") {
    log(`${GREEN}${BOLD}Gate H: publish surface passed${RESET}`);
    log(`  ${GREEN}✓${RESET} ${result.checked} publishable package(s) — each tarball ships README + LICENSE and every files[] entry resolves`);
    log("");
    return;
  }
  log(`${RED}${BOLD}Gate H: publish surface failed${RESET}`);
  log(`  ${RED}✗${RESET} ${result.findings.length} of ${result.checked} publishable package(s) ship an incomplete tarball:`);
  for (const f of result.findings) {
    log(`  ${RED}✗${RESET} ${BOLD}${f.name}${RESET} ${DIM}(${f.dir})${RESET}`);
    for (const issue of f.issues) log(`      ${YELLOW}○${RESET} ${issue}`);
  }
  log("");
}

function packCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck pack${RESET}\n`);
  const result = runPublishGate({ root });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderPublishResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      console.error(JSON.stringify({ code: "PACK_INCOMPLETE_TARBALL", message: `${result.findings.length} publishable package(s) ship an incomplete tarball` }));
    }
    process.exit(1);
  }
  // pass + skip exit 0.
}

// --- Gate I: secrets — no credential ships inside a published tarball ---
//
// The failure this gate exists to prevent: a real credential (API key, token,
// private key) committed to a file that npm then publishes inside the tarball.
// SHIP_GATE A3 ("No secrets, tokens, or credentials in source") is a human-checked
// box — it can be ticked while false, and nobody re-greps the *published* file set
// on every release. This gate EXECUTES the check against exactly the files that
// would ship (the same npm-pack surface Gate H inspects), so the box cannot be
// green while a key rides along in the tarball.
//
// Design constraints that keep it trustworthy rather than noisy:
//  - HIGH-SIGNAL patterns only (provider-prefixed keys, private-key headers). It does
//    NOT flag generic high-entropy strings — false positives train maintainers to
//    ignore the gate, which is worse than not having it.
//  - The scanner NEVER prints the matched secret verbatim. A scanner that echoes the
//    key into a public CI log is itself the leak; every match is redacted.
//  - Inline escape hatch: a line containing `shipcheck-allow-secret` is skipped, so a
//    documented example token in prose cannot wedge the gate.
//
// Standards compliance (memory/workflow_standards.md):
// PIN_PER_STEP 2 — deterministic: same files + same ruleset in, same findings out.
// ANDON_AUTHORITY 2 — exit 1 on any match; a leaked credential never ships green.
// NAMED_COMPENSATORS n/a — read-only (reads files, spawns `npm pack --dry-run`).
// DECOMPOSE_BY_SECRETS 3 — its own gate + ruleset; changes when secret formats change.
// UNCERTAINTY_GATED_HUMANS 2 — no publishable packages → explicit skip, never a false pass; inline-allow lets a human resolve a known example.
// EXTERNAL_VERIFIER 3 — the scanner reads the artifact npm actually packs; the author's "no secrets" assertion is never consulted.

// Rules are ordered most-specific first. Each `re` has NO global flag so `.exec` is
// stateless. Every source pattern here is written so its own literal does not match
// itself (each continues with a `[` character-class), keeping bin/shipcheck.mjs clean
// when the gate scans its own published tarball.
const SECRET_RULES = [
  { id: "private-key", label: "Private key block", re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
  { id: "aws-access-key", label: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "github-pat", label: "GitHub fine-grained PAT", re: /\bgithub_pat_[0-9A-Za-z_]{22,}\b/ },
  { id: "github-token", label: "GitHub token", re: /\bgh[posru]_[0-9A-Za-z]{36,}\b/ },
  { id: "npm-token", label: "npm access token", re: /\bnpm_[0-9A-Za-z]{36}\b/ },
  { id: "slack-token", label: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { id: "google-api-key", label: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: "stripe-secret-key", label: "Stripe secret key", re: /\b[rs]k_live_[0-9A-Za-z]{24,}\b/ },
  { id: "anthropic-key", label: "Anthropic API key", re: /\bsk-ant-[0-9A-Za-z_-]{20,}\b/ },
  { id: "openai-project-key", label: "OpenAI key", re: /\bsk-proj-[0-9A-Za-z_-]{20,}\b/ },
  { id: "openai-classic-key", label: "OpenAI key", re: /\bsk-[0-9A-Za-z]{48}\b/ },
];

// Never true-binary; scanning bytes for text patterns is pointless and slow.
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff", ".pdf",
  ".zip", ".gz", ".tgz", ".tar", ".br", ".7z", ".rar",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp4", ".mov", ".webm", ".mp3", ".wav", ".ogg", ".flac",
  ".node", ".wasm", ".jar", ".class", ".so", ".dll", ".dylib", ".bin", ".exe", ".pyc",
]);
const MAX_SCAN_BYTES = 2_000_000; // a hand-committed key lives in a small text file, not a data blob.

// Show enough to locate the credential without reprinting it. Never returns the raw value.
function redactSecret(match) {
  const s = String(match);
  if (s.length <= 8) return "*".repeat(s.length);
  return `${s.slice(0, 4)}${"*".repeat(Math.min(s.length - 6, 12))}${s.slice(-2)}`;
}

// Pure scanner: text in, redacted findings out. Exported for unit + RED meta-tests.
function scanTextForSecrets(text, { rules = SECRET_RULES } = {}) {
  const findings = [];
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("shipcheck-allow-secret")) continue; // documented example escape hatch
    for (const rule of rules) {
      const m = rule.re.exec(line);
      if (m) findings.push({ ruleId: rule.id, label: rule.label, line: i + 1, redacted: redactSecret(m[0]) });
    }
  }
  return findings;
}

// Default reader: resolve a pack-relative path to disk, skip binary/oversized, read utf8.
// Returns null for anything that should not be scanned.
function defaultSecretFileReader(pkgDir, relPath) {
  const clean = String(relPath).replace(/^package\//, ""); // real npm omits this; mocks may add it
  const full = join(pkgDir, clean);
  if (BINARY_EXT.has(extname(clean).toLowerCase())) return null;
  try {
    const st = statSync(full);
    if (!st.isFile() || st.size > MAX_SCAN_BYTES) return null;
    return readFileSync(full, "utf8");
  } catch {
    return null;
  }
}

// Gate I core. Pure given `listFiles` + `readFile`; returns { status, checked, filesScanned, findings, errors }.
function runSecretsGate({ root = CWD, discover = discoverPublishablePackages, listFiles = defaultPackRunner, readFile = defaultSecretFileReader } = {}) {
  const pkgs = discover(root);
  if (pkgs.length === 0) {
    return { status: "skip", reason: "no publishable packages found", checked: 0, filesScanned: 0, findings: [], errors: [] };
  }

  const findings = [];
  const errors = [];
  let filesScanned = 0;

  for (const p of pkgs) {
    let files;
    try {
      files = listFiles(p.dir);
    } catch (err) {
      // Can't compute the publish surface → we cannot certify "no secrets ship". Fail loudly.
      errors.push({ name: p.name, dir: p.dir, detail: `could not list published files: ${err?.message || String(err)}` });
      continue;
    }
    for (const rel of files) {
      const content = readFile(p.dir, rel);
      if (content == null) continue;
      filesScanned++;
      for (const f of scanTextForSecrets(content)) {
        findings.push({ name: p.name, dir: p.dir, file: String(rel).replace(/^package\//, ""), ...f });
      }
    }
  }

  const status = findings.length > 0 || errors.length > 0 ? "fail" : "pass";
  return { status, checked: pkgs.length, filesScanned, findings, errors };
}

function renderSecretsResult(result) {
  if (result.status === "skip") {
    log(`${DIM}${BOLD}Gate I: secrets skipped${RESET}`);
    log(`  ${DIM}○${RESET} ${result.reason}`);
    log("");
    return;
  }
  if (result.status === "pass") {
    log(`${GREEN}${BOLD}Gate I: secrets passed${RESET}`);
    log(`  ${GREEN}✓${RESET} ${result.checked} publishable package(s), ${result.filesScanned} file(s) scanned — no credentials in the published surface`);
    log("");
    return;
  }
  log(`${RED}${BOLD}Gate I: secrets failed${RESET}`);
  if (result.findings.length) {
    log(`  ${RED}✗${RESET} ${result.findings.length} secret(s) found in files that would be published:`);
    for (const f of result.findings) {
      log(`  ${RED}✗${RESET} ${BOLD}${f.name}${RESET} ${DIM}${f.file}:${f.line}${RESET} — ${f.label} ${DIM}[${f.ruleId}]${RESET} ${YELLOW}${f.redacted}${RESET}`);
    }
    log(`  ${DIM}Redacted. Rotate any real key immediately — it may already be compromised. False positive? add \`shipcheck-allow-secret\` to the line.${RESET}`);
  }
  for (const e of result.errors) {
    log(`  ${RED}✗${RESET} ${BOLD}${e.name}${RESET} — ${e.detail}`);
  }
  log("");
}

function secretsCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck secrets${RESET}\n`);
  const result = runSecretsGate({ root });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderSecretsResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      console.error(JSON.stringify({ code: "SECRETS_IN_TARBALL", message: `${result.findings.length} secret(s) in the published surface` }));
    }
    process.exit(1);
  }
  // pass + skip exit 0.
}

// --- Gate J: manifest — release-hygiene facts the SHIP_GATE only attests ---
//
// Converts three D-class SHIP_GATE lines from human-checked boxes into executed checks:
//   D6  engines.node (npm) / requires-python (pypi) set — an unconstrained package
//       installs on an incompatible runtime and fails cryptically at import time.
//   D7  a lockfile is committed — without it every install floats, defeating
//       reproducibility and widening the supply-chain surface.
//   D2  manifest version is not BEHIND the newest released git tag — a stale version
//       re-publishes an old or duplicate release under a fresh one's notes.
// Each was tick-if-true; here code reads the manifest, the working tree, and the tag
// list and fails if the fact is false. D2 defaults to "not behind" so it never
// false-fails a legitimately-ahead dev tree and SKIPS cleanly when no tags/git are
// present (extracted tarball, shallow CI checkout); `--expect <version>` switches it
// to strict exact-match for release-time enforcement. This is the portable, inheritable
// form of the ad-hoc "Verify release tag matches package.json" step that today lives
// only in shipcheck's own release.yml.
//
// Standards compliance (memory/workflow_standards.md):
// PIN_PER_STEP 2 — deterministic: same manifest + tree + tag list in, same result out.
// ANDON_AUTHORITY 2 — exit 1 on any failing sub-check; a mislabeled/unconstrained release never ships green.
// NAMED_COMPENSATORS n/a — read-only (reads files, runs `git tag --list`).
// DECOMPOSE_BY_SECRETS 3 — its own gate; the three sub-checks change together when packaging/release rules change.
// UNCERTAINTY_GATED_HUMANS 2 — checks that don't apply (no tags, non-semver version, no manifest) SKIP explicitly rather than assert a pass.
// EXTERNAL_VERIFIER 3 — verified against git's tag list and the on-disk tree, not against the maintainer's checkbox.

const NPM_LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock"];
const PYPI_LOCKFILES = ["poetry.lock", "Pipfile.lock", "uv.lock", "pdm.lock"];

function parseSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmpSemver(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Minimal, zero-dep pyproject reader: enough to know if it's a Python project and
// whether it constrains the interpreter. Line-regex, matching the org's no-YAML/TOML-dep rule.
function defaultReadPyproject(root = CWD) {
  const p = join(root, "pyproject.toml");
  if (!existsSync(p)) return { hasProject: false };
  let text = "";
  try { text = readFileSync(p, "utf8"); } catch { return { hasProject: false }; }
  const hasProject = /^\s*\[project\]/m.test(text) || /^\s*\[tool\.poetry\]/m.test(text);
  const rp = /^\s*requires-python\s*=\s*['"]([^'"]+)['"]/m.exec(text) || /^\s*python\s*=\s*['"]([^'"]+)['"]/m.exec(text);
  const ver = /^\s*version\s*=\s*['"]([^'"]+)['"]/m.exec(text);
  return { hasProject, requiresPython: rp ? rp[1] : null, version: ver ? ver[1] : null };
}

function defaultListTags(root = CWD) {
  try {
    const out = execFileSync("git", ["tag", "--list"], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10_000,
    });
    return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    return []; // no git / no tags / not a repo → caller SKIPS the version check
  }
}

// Sub-check: every publishable package declares an engine/interpreter constraint.
function checkEngines(packages, { pyproject } = {}) {
  const applicable = packages.length > 0 || (pyproject && pyproject.hasProject);
  if (!applicable) return { id: "engines", status: "skip", detail: "no npm/pypi manifest to check" };
  const missing = [];
  for (const p of packages) {
    const node = p.pj?.engines?.node;
    if (!node || String(node).trim() === "") missing.push(p.name);
  }
  if (pyproject && pyproject.hasProject && !pyproject.requiresPython) missing.push("(pyproject requires-python)");
  return missing.length
    ? { id: "engines", status: "fail", detail: `missing an engine constraint: ${missing.join(", ")}`, findings: missing }
    : { id: "engines", status: "pass", detail: `${packages.length} npm package(s)${pyproject?.hasProject ? " + pyproject" : ""} declare an engine constraint` };
}

// Sub-check: a lockfile is committed at the repo root.
function checkLockfile(root, { exists = (p) => existsSync(p), isNpm, isPypi } = {}) {
  const candidates = [];
  if (isNpm) candidates.push(...NPM_LOCKFILES);
  if (isPypi) candidates.push(...PYPI_LOCKFILES);
  if (candidates.length === 0) return { id: "lockfile", status: "skip", detail: "no npm/pypi project detected" };
  const found = candidates.filter((f) => exists(join(root, f)));
  return found.length
    ? { id: "lockfile", status: "pass", detail: `lockfile committed: ${found.join(", ")}` }
    : { id: "lockfile", status: "fail", detail: `no lockfile committed (looked for: ${candidates.join(", ")})` };
}

// Sub-check: manifest version is consistent with the release history.
function checkVersionTag(version, tags, { expect = null } = {}) {
  const cur = parseSemver(version);
  if (!cur) return { id: "version-tag", status: "skip", detail: `manifest version "${version}" is not semver` };

  if (expect != null) {
    const exp = parseSemver(expect);
    return exp && cmpSemver(cur, exp) === 0
      ? { id: "version-tag", status: "pass", detail: `manifest version ${version} matches --expect ${expect}` }
      : { id: "version-tag", status: "fail", detail: `manifest version ${version} does not match --expect ${expect}` };
  }

  const semverTags = (tags || []).map((t) => ({ raw: t, v: parseSemver(t) })).filter((t) => t.v);
  if (semverTags.length === 0) {
    return { id: "version-tag", status: "skip", detail: "no semver git tags to compare (unreleased, or tags not fetched)" };
  }
  let max = semverTags[0];
  for (const t of semverTags) if (cmpSemver(t.v, max.v) > 0) max = t;
  const c = cmpSemver(cur, max.v);
  if (c < 0) {
    return { id: "version-tag", status: "fail", detail: `manifest version ${version} is BEHIND newest released tag ${max.raw} — publishing would duplicate or downgrade a release` };
  }
  return {
    id: "version-tag",
    status: "pass",
    detail: c === 0 ? `manifest version ${version} matches newest tag ${max.raw}` : `manifest version ${version} is ahead of newest tag ${max.raw} (unreleased)`,
  };
}

// Gate J core. Pure given its injectables; returns { status, checks, checked }.
function runManifestGate({
  root = CWD,
  discover = discoverPublishablePackages,
  listTags = defaultListTags,
  exists = (p) => existsSync(p),
  readPyproject = defaultReadPyproject,
  rootVersion,
  expect = null,
} = {}) {
  const packages = discover(root);
  const py = readPyproject(root);
  const isNpm = packages.length > 0 || exists(join(root, "package.json"));
  const isPypi = !!py.hasProject;

  let version = rootVersion;
  if (version == null) {
    const rootPj = readJsonSafe(join(root, "package.json"));
    version = rootPj?.version ?? py.version ?? null;
  }

  const checks = [
    checkEngines(packages, { pyproject: py }),
    checkLockfile(root, { exists, isNpm, isPypi }),
    version != null ? checkVersionTag(version, listTags(root), { expect }) : { id: "version-tag", status: "skip", detail: "no manifest version found" },
  ];

  const failed = checks.filter((c) => c.status === "fail");
  const applicable = checks.some((c) => c.status !== "skip");
  const status = failed.length ? "fail" : applicable ? "pass" : "skip";
  return { status, checks, checked: packages.length };
}

const CHECK_GLYPH = { pass: `${GREEN}✓${RESET}`, fail: `${RED}✗${RESET}`, skip: `${DIM}○${RESET}` };

function renderManifestResult(result) {
  if (result.status === "skip") {
    log(`${DIM}${BOLD}Gate J: manifest skipped${RESET}`);
    log(`  ${DIM}○${RESET} no npm/pypi manifest facts to verify`);
    log("");
    return;
  }
  const header = result.status === "pass"
    ? `${GREEN}${BOLD}Gate J: manifest passed${RESET}`
    : `${RED}${BOLD}Gate J: manifest failed${RESET}`;
  log(header);
  for (const c of result.checks) {
    log(`  ${CHECK_GLYPH[c.status]} ${BOLD}${c.id}${RESET}: ${c.detail}`);
  }
  log("");
}

function manifestCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  let expect = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--expect" && args[i + 1]) { expect = args[++i]; }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck manifest${RESET}\n`);
  const result = runManifestGate({ root, expect });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderManifestResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      const failed = result.checks.filter((c) => c.status === "fail").map((c) => c.id);
      console.error(JSON.stringify({ code: "MANIFEST_HYGIENE_FAIL", message: `failing checks: ${failed.join(", ")}` }));
    }
    process.exit(1);
  }
  // pass + skip exit 0.
}

// --- Gate K: security-docs — the security surface is present, not just attested ---
//
// Converts two HARD-GATE (section A) SHIP_GATE lines from checkboxes into executed checks:
//   A1  SECURITY.md exists — with an actual reporting path, not an empty stub.
//   A2  the README states a trust/threat model — data touched, NOT touched, permissions.
// Both are today ticked by a human and never re-read. A repo can green "SECURITY.md
// exists" with the file deleted, or "threat model paragraph" with the section stripped.
//
// Honest ceiling (disclosed, not faked): this gate verifies PRESENCE + NON-EMPTINESS +
// a reporting CONTACT. It does NOT — and a deterministic gate cannot — judge whether the
// threat model is CORRECT or COMPLETE. That semantic check is a separate-model verifier
// job (see workflow_standards EXTERNAL_VERIFIER) and is named as residual, not claimed here.
//
// Standards compliance (memory/workflow_standards.md):
// PIN_PER_STEP 2 — deterministic: same docs in, same result out.
// ANDON_AUTHORITY 2 — exit 1 when the security surface is absent/empty; a repo can't green a missing SECURITY.md.
// NAMED_COMPENSATORS n/a — read-only.
// DECOMPOSE_BY_SECRETS 3 — its own gate; changes when the security-doc contract changes.
// UNCERTAINTY_GATED_HUMANS 2 — verifies presence, and explicitly disclaims judging quality rather than faking a pass on it.
// EXTERNAL_VERIFIER 2 — reads the doc artifacts directly; the maintainer's checkbox is not consulted. (2 not 3: the deeper "is the threat model any good" check needs a different-family model — named residual.)

const SECURITY_MD_LOCATIONS = ["SECURITY.md", ".github/SECURITY.md", "docs/SECURITY.md"];
const README_LOCATIONS = ["README.md", "readme.md"];
// A reporting path: an email, a URL, or an explicit "report" instruction.
const SECURITY_CONTACT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|https?:\/\/\S+|\breport(ing)?\b/i;
// A trust/threat-model section heading. "trust model" and "security" included because
// good repos title it either way (shipcheck's own README uses "## Trust model").
const THREATMODEL_HEADING_RE = /^#{1,6}\s+.*(threat model|trust model|security|data (?:we|it) (?:touch|handle|access)|privacy)/im;

function defaultDocReader(p) {
  try { return readFileSync(p, "utf8"); } catch { return null; }
}
function firstExisting(root, names, exists) {
  for (const n of names) if (exists(join(root, n))) return n;
  return null;
}
// Body text under a heading, up to the next heading or EOF.
function sectionBodyAfter(text, headingIndex, headingLen) {
  const rest = text.slice(headingIndex + headingLen);
  const next = /\n#{1,6}\s/.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function checkSecurityMd(root, { exists = (p) => existsSync(p), readFile = defaultDocReader } = {}) {
  const loc = firstExisting(root, SECURITY_MD_LOCATIONS, exists);
  if (!loc) return { id: "security-md", status: "fail", detail: "no SECURITY.md (looked in ./, .github/, docs/)" };
  const text = (readFile(join(root, loc)) || "").trim();
  if (text.length < 40) return { id: "security-md", status: "fail", detail: `${loc} is present but effectively empty (${text.length} chars)` };
  if (!SECURITY_CONTACT_RE.test(text)) return { id: "security-md", status: "fail", detail: `${loc} has no reporting contact (email, URL, or "report" instruction)` };
  return { id: "security-md", status: "pass", detail: `${loc} present with a reporting contact` };
}

function checkThreatModel(root, { exists = (p) => existsSync(p), readFile = defaultDocReader } = {}) {
  const loc = firstExisting(root, README_LOCATIONS, exists);
  if (!loc) return { id: "threat-model", status: "fail", detail: "no README to check for a trust/threat model" };
  const text = readFile(join(root, loc)) || "";
  const m = THREATMODEL_HEADING_RE.exec(text);
  if (!m) return { id: "threat-model", status: "fail", detail: `${loc} has no trust/threat-model section (A2: data touched, NOT touched, permissions)` };
  const body = sectionBodyAfter(text, m.index, m[0].length);
  if (body.length < 20) return { id: "threat-model", status: "fail", detail: `${loc} trust/threat-model heading has no substantive body` };
  return { id: "threat-model", status: "pass", detail: `${loc} states a trust/threat model` };
}

// Gate K core. Pure given its injectables; returns { status, checks }.
function runSecurityDocsGate({ root = CWD, exists = (p) => existsSync(p), readFile = defaultDocReader } = {}) {
  const checks = [
    checkSecurityMd(root, { exists, readFile }),
    checkThreatModel(root, { exists, readFile }),
  ];
  const status = checks.some((c) => c.status === "fail") ? "fail" : "pass";
  return { status, checks };
}

function renderSecurityDocsResult(result) {
  const header = result.status === "pass"
    ? `${GREEN}${BOLD}Gate K: security-docs passed${RESET}`
    : `${RED}${BOLD}Gate K: security-docs failed${RESET}`;
  log(header);
  for (const c of result.checks) {
    log(`  ${CHECK_GLYPH[c.status]} ${BOLD}${c.id}${RESET}: ${c.detail}`);
  }
  if (result.status === "fail") {
    log(`  ${DIM}Presence + contact only — a deterministic gate cannot judge threat-model quality (that needs a separate-family verifier).${RESET}`);
  }
  log("");
}

function securityDocsCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck security-docs${RESET}\n`);
  const result = runSecurityDocsGate({ root });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderSecurityDocsResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      const failed = result.checks.filter((c) => c.status === "fail").map((c) => c.id);
      console.error(JSON.stringify({ code: "SECURITY_DOCS_MISSING", message: `failing checks: ${failed.join(", ")}` }));
    }
    process.exit(1);
  }
}

// --- Gate L: ci — supply-chain publish integrity + dependency scanning ---
//
// Converts two attested facts into executed checks by reading the repo's CI
// configuration (and, opt-in, the npm registry):
//   provenance      — every workflow that runs `npm publish` uses OIDC trusted
//                     publishing (`id-token: write`) AND publishes with `--provenance`.
//                     This is the CONFIG/intent layer. `--registry <pkg>[@<ver>]` adds
//                     the OUTCOME layer: it confirms the published tarball actually
//                     carries a provenance attestation on the registry. Intent AND
//                     outcome — two complementary layers, not a choice between them.
//   dependency-scan — a recognized vulnerability scanner runs in CI, or a dependabot
//                     config is present (SHIP_GATE D3).
//
// Note on D4 (automated dependency-update mechanism): deliberately NOT executed here.
// The org's own github-actions rule says "do NOT add dependabot.yml unless explicitly
// requested" — so a hard gate that fails a repo for lacking an update bot would punish
// repos for following policy. D4 stays a per-repo attestation until that policy conflict
// is resolved (see docs/executed-vs-attested-audit.md).
//
// Standards compliance (memory/workflow_standards.md):
// PIN_PER_STEP 2 — deterministic given the workflow files (+ a pinned registry response).
// ANDON_AUTHORITY 2 — exit 1 when a publish path is un-hardened or CI runs no scanner.
// NAMED_COMPENSATORS n/a — read-only (reads workflow files; opt-in registry GET).
// DECOMPOSE_BY_SECRETS 3 — its own gate; the CI-config facts change together when release/CI policy changes.
// UNCERTAINTY_GATED_HUMANS 2 — no publish workflow / no manifest → explicit skip, never a false pass.
// EXTERNAL_VERIFIER 3 — verified against the actual workflow files and the registry, not the maintainer's checkbox.

const WORKFLOW_DIR = ".github/workflows";
const DEP_SCAN_SIGNALS = [
  { id: "npm-audit", re: /\bnpm audit\b/ },
  { id: "pnpm-audit", re: /\bpnpm audit\b/ },
  { id: "yarn-audit", re: /\byarn(?: npm)? audit\b/ },
  { id: "pip-audit", re: /\bpip-audit\b/ },
  { id: "osv-scanner", re: /osv-scanner/i },
  { id: "snyk", re: /\bsnyk\b/i },
  { id: "cargo-audit", re: /\bcargo audit\b/ },
  { id: "govulncheck", re: /\bgovulncheck\b/ },
  { id: "trivy", re: /aquasecurity\/trivy|\btrivy\b/i },
  { id: "dependency-review", re: /actions\/dependency-review-action/ },
];

function defaultReadWorkflows(root = CWD) {
  const dir = join(root, WORKFLOW_DIR);
  if (!existsSync(dir)) return [];
  let files = [];
  try { files = readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)); } catch { return []; }
  const out = [];
  for (const f of files) {
    try { out.push({ name: `${WORKFLOW_DIR}/${f}`, text: readFileSync(join(dir, f), "utf8") }); } catch {}
  }
  return out;
}

// Config/intent layer: publish workflows must use OIDC + provenance.
function checkProvenanceConfig(workflows) {
  const publishers = workflows.filter((w) => /npm publish/.test(w.text));
  if (publishers.length === 0) {
    return { id: "provenance", status: "skip", detail: "no npm-publish workflow found — publish via a workflow with OIDC + --provenance to enable this check" };
  }
  const bad = [];
  for (const w of publishers) {
    const issues = [];
    if (!/id-token:\s*write/.test(w.text)) issues.push("no `id-token: write` (OIDC trusted publishing off)");
    if (!/--provenance\b/.test(w.text) && !/provenance:\s*true/.test(w.text)) issues.push("`npm publish` without `--provenance`");
    if (issues.length) bad.push({ workflow: w.name, issues });
  }
  return bad.length
    ? { id: "provenance", status: "fail", detail: `${bad.length} of ${publishers.length} publish workflow(s) not provenance-hardened`, findings: bad }
    : { id: "provenance", status: "pass", detail: `${publishers.length} publish workflow(s) use OIDC + --provenance` };
}

// Outcome layer: the published tarball actually carries a provenance attestation.
async function checkProvenancePublished(spec, fetchImpl = fetch) {
  const at = spec.lastIndexOf("@");
  const name = at > 0 ? spec.slice(0, at) : spec;
  const wantVer = at > 0 ? spec.slice(at + 1) : null;
  const url = `https://registry.npmjs.org/${name.replace(/\//g, "%2f")}`;
  let doc;
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return { id: "provenance-published", status: "fail", detail: `registry returned ${res.status} for ${name}` };
    doc = await res.json();
  } catch (err) {
    return { id: "provenance-published", status: "skip", detail: `could not reach registry: ${err?.message || String(err)}` };
  }
  const ver = wantVer || doc["dist-tags"]?.latest;
  const dist = doc?.versions?.[ver]?.dist;
  if (!dist) return { id: "provenance-published", status: "fail", detail: `${name}@${ver} not found on registry` };
  return dist.attestations
    ? { id: "provenance-published", status: "pass", detail: `${name}@${ver} was published with a provenance attestation` }
    : { id: "provenance-published", status: "fail", detail: `${name}@${ver} has NO provenance attestation on the registry` };
}

// SHIP_GATE D3: a dependency scanner runs in CI (or dependabot is configured).
function checkDependencyScan(root, workflows, { exists = (p) => existsSync(p) } = {}) {
  const hasManifest = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod"].some((m) => exists(join(root, m)));
  if (!hasManifest) return { id: "dependency-scan", status: "skip", detail: "no dependency manifest to scan" };
  const hits = [];
  for (const w of workflows) for (const s of DEP_SCAN_SIGNALS) if (s.re.test(w.text)) hits.push(s.id);
  if (exists(join(root, ".github/dependabot.yml")) || exists(join(root, ".github/dependabot.yaml"))) hits.push("dependabot");
  const found = [...new Set(hits)];
  return found.length
    ? { id: "dependency-scan", status: "pass", detail: `dependency scanning runs in CI: ${found.join(", ")}` }
    : { id: "dependency-scan", status: "fail", detail: "no dependency scanner found in CI (npm audit / osv-scanner / snyk / dependabot / …)" };
}

async function runCiGate({ root = CWD, readWorkflows = defaultReadWorkflows, exists = (p) => existsSync(p), registry = null, fetchImpl = fetch } = {}) {
  const workflows = readWorkflows(root);
  const checks = [checkProvenanceConfig(workflows), checkDependencyScan(root, workflows, { exists })];
  if (registry) checks.push(await checkProvenancePublished(registry, fetchImpl));
  const status = checks.some((c) => c.status === "fail")
    ? "fail"
    : checks.every((c) => c.status === "skip") ? "skip" : "pass";
  return { status, checks };
}

function renderCiResult(result) {
  if (result.status === "skip") {
    log(`${DIM}${BOLD}Gate L: ci skipped${RESET}`);
    for (const c of result.checks) log(`  ${DIM}○${RESET} ${c.id}: ${c.detail}`);
    log("");
    return;
  }
  log(result.status === "pass" ? `${GREEN}${BOLD}Gate L: ci passed${RESET}` : `${RED}${BOLD}Gate L: ci failed${RESET}`);
  for (const c of result.checks) {
    log(`  ${CHECK_GLYPH[c.status]} ${BOLD}${c.id}${RESET}: ${c.detail}`);
    for (const f of c.findings || []) {
      log(`      ${DIM}${f.workflow}${RESET}`);
      for (const issue of f.issues) log(`        ${YELLOW}○${RESET} ${issue}`);
    }
  }
  log("");
}

async function ciCommand() {
  const args = process.argv.slice(3);
  let root = CWD;
  let json = false;
  let registry = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = resolve(CWD, args[++i]); }
    else if (args[i] === "--registry" && args[i + 1]) { registry = args[++i]; }
    else if (args[i] === "--json") { json = true; }
  }

  if (!json) log(`\n${BOLD}shipcheck ci${RESET}\n`);
  const result = await runCiGate({ root, registry });

  if (json) {
    log(JSON.stringify(result));
  } else {
    renderCiResult(result);
  }

  if (result.status === "fail") {
    if (process.env.SHIPCHECK_JSON && !json) {
      const failed = result.checks.filter((c) => c.status === "fail").map((c) => c.id);
      console.error(JSON.stringify({ code: "CI_HARDENING_FAIL", message: `failing checks: ${failed.join(", ")}` }));
    }
    process.exit(1);
  }
}

function helpCommand() {
  log(`
${BOLD}shipcheck${RESET} — product standards for MCP Tool Shop

${BOLD}Usage:${RESET}
  npx @mcptoolshop/shipcheck init     Copy templates into current repo
  npx @mcptoolshop/shipcheck audit    Check SHIP_GATE.md progress
  npx @mcptoolshop/shipcheck dogfood  Check dogfood freshness (Gate F)
  npx @mcptoolshop/shipcheck front-door  Verify the AI-native front door (Gate G)
  npx @mcptoolshop/shipcheck pack     Verify every publishable package's tarball (Gate H)
  npx @mcptoolshop/shipcheck secrets  Scan every publishable tarball for credentials (Gate I)
  npx @mcptoolshop/shipcheck manifest Verify engines/lockfile/version-vs-tag (Gate J)
  npx @mcptoolshop/shipcheck security-docs  Verify SECURITY.md + README trust model (Gate K)
  npx @mcptoolshop/shipcheck ci       Verify OIDC/provenance + dependency scanning (Gate L)
  npx @mcptoolshop/shipcheck help     Show this message
  npx @mcptoolshop/shipcheck --version Show version

${BOLD}What it does:${RESET}
  init     Detects repo type (npm, pypi, mcp, cli, etc.)
           Copies SHIP_GATE.md, SECURITY.md, CHANGELOG.md, SCORECARD.md
           Skips files that already exist (except SHIP_GATE + SCORECARD)

  audit    Counts checked/unchecked/skipped items in SHIP_GATE.md
           Reports pass rate and lists remaining gaps
           Exits 0 if all gates pass, 1 if gaps remain

  dogfood  Checks dogfood-lab/testing-os for a fresh, passing record
           --repo org/repo       Target repo (required)
           --surface cli|desktop  Product surface (required)
           --freshness-days 30   Max age in days (default: 30)
           Exits 0 if accepted + pass + fresh, 1 otherwise

  front-door  Verifies the AI-native front door (README / AGENTS.md / llms.txt)
           via @mcptoolshop/site-theme's front-door verifier
           --root <dir>          Repo to audit (default: cwd)
           --json                Machine-readable result
           Exits 1 on contradicted/unbacked/stale claims, 0 on pass
           SKIPS gracefully (exit 0) when site-theme is not installed

  pack     Runs 'npm pack --dry-run' on EVERY publishable workspace package
           (npm workspaces or pnpm-workspace.yaml) and fails if any tarball
           is missing its README or LICENSE, if a files[] entry doesn't
           resolve, or if package.json has no license field. Executes the
           check that SHIP_GATE D5 otherwise only asserts — so an unlicensed
           or README-less package cannot ship green in a monorepo.
           --root <dir>          Repo to audit (default: cwd)
           --json                Machine-readable result
           Exits 1 if any publishable package ships an incomplete tarball

  secrets  Scans EVERY publishable package's tarball surface (the same npm-pack
           file set as 'pack') for high-signal credentials — provider-prefixed
           API keys, tokens, and private-key blocks — and fails if any ship.
           Executes SHIP_GATE A3 ("no secrets in source"), which is otherwise a
           human-checked box. Matches are redacted; add 'shipcheck-allow-secret'
           to a line to whitelist a documented example.
           --root <dir>          Repo to audit (default: cwd)
           --json                Machine-readable result
           Exits 1 if any credential is found in the published surface

  manifest Executes three release-hygiene SHIP_GATE lines that are otherwise
           attested boxes:
             D6  every publishable package sets engines.node / requires-python
             D7  a lockfile is committed at the repo root
             D2  the manifest version is not behind the newest released git tag
           --root <dir>          Repo to audit (default: cwd)
           --expect <version>    Require D2 to exactly match this version (release mode)
           --json                Machine-readable result
           Exits 1 if any hygiene fact is false (skips checks that don't apply)

  security-docs  Executes two HARD-GATE (section A) SHIP_GATE lines:
             A1  SECURITY.md exists (./, .github/, or docs/) with a reporting contact
             A2  the README states a trust/threat model with a substantive body
           Verifies PRESENCE + a contact — not threat-model quality (a deterministic
           gate cannot judge that; it is named as a separate-verifier residual).
           --root <dir>          Repo to audit (default: cwd)
           --json                Machine-readable result
           Exits 1 if the security surface is absent or empty

  ci       Reads .github/workflows to execute two attested facts:
             provenance       every 'npm publish' workflow uses OIDC
                              (id-token: write) + --provenance (config/intent)
             dependency-scan  a scanner runs in CI or dependabot is configured (D3)
           --registry <pkg>[@<ver>]  ALSO confirm the published tarball carries a
                              provenance attestation on npm (outcome — both layers)
           --root <dir>          Repo to audit (default: cwd)
           --json                Machine-readable result
           Exits 1 if a publish path is un-hardened or CI runs no scanner

${DIM}https://github.com/mcp-tool-shop-org/shipcheck${RESET}
`);
}

// --- Main ---

const command = process.argv[2] || "help";

// Exports for testing
export {
  evaluateDogfoodGate, fetchEnforcementMode, summarizeFrontDoor, runFrontDoorGate,
  runPublishGate, discoverPublishablePackages,
  scanTextForSecrets, runSecretsGate,
  checkEngines, checkLockfile, checkVersionTag, runManifestGate, parseSemver,
  checkSecurityMd, checkThreatModel, runSecurityDocsGate,
  checkProvenanceConfig, checkProvenancePublished, checkDependencyScan, runCiGate,
};

switch (command) {
  case "init":
    initCommand();
    break;
  case "audit":
    auditCommand();
    break;
  case "dogfood":
    await dogfoodCommand();
    break;
  case "front-door":
    await frontDoorCommand();
    break;
  case "pack":
    packCommand();
    break;
  case "secrets":
    secretsCommand();
    break;
  case "manifest":
    manifestCommand();
    break;
  case "security-docs":
    securityDocsCommand();
    break;
  case "ci":
    await ciCommand();
    break;
  case "--version":
  case "-V":
    log(`shipcheck ${PKG.version}`);
    break;
  case "help":
  case "--help":
  case "-h":
    helpCommand();
    break;
  default:
    fail("INPUT_UNKNOWN_COMMAND", `Unknown command: ${command}`, "Run 'shipcheck help' to see available commands");
}
