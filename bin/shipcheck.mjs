#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

function helpCommand() {
  log(`
${BOLD}shipcheck${RESET} — product standards for MCP Tool Shop

${BOLD}Usage:${RESET}
  npx @mcptoolshop/shipcheck init     Copy templates into current repo
  npx @mcptoolshop/shipcheck audit    Check SHIP_GATE.md progress
  npx @mcptoolshop/shipcheck dogfood  Check dogfood freshness (Gate F)
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

${DIM}https://github.com/mcp-tool-shop-org/shipcheck${RESET}
`);
}

// --- Main ---

const command = process.argv[2] || "help";

// Exports for testing
export { evaluateDogfoodGate, fetchEnforcementMode };

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
