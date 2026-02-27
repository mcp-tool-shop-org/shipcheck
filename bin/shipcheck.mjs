#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const CWD = process.cwd();

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

function helpCommand() {
  log(`
${BOLD}shipcheck${RESET} — product standards for MCP Tool Shop

${BOLD}Usage:${RESET}
  npx @mcptoolshop/shipcheck init     Copy templates into current repo
  npx @mcptoolshop/shipcheck audit    Check SHIP_GATE.md progress
  npx @mcptoolshop/shipcheck help     Show this message

${BOLD}What it does:${RESET}
  init   Detects repo type (npm, pypi, mcp, cli, etc.)
         Copies SHIP_GATE.md, SECURITY.md, CHANGELOG.md, SCORECARD.md
         Skips files that already exist (except SHIP_GATE + SCORECARD)

  audit  Counts checked/unchecked/skipped items in SHIP_GATE.md
         Reports pass rate and lists remaining gaps
         Exits 0 if all gates pass, 1 if gaps remain

${DIM}https://github.com/mcp-tool-shop-org/shipcheck${RESET}
`);
}

// --- Main ---

const command = process.argv[2] || "help";

switch (command) {
  case "init":
    initCommand();
    break;
  case "audit":
    auditCommand();
    break;
  case "help":
  case "--help":
  case "-h":
    helpCommand();
    break;
  default:
    fail("INPUT_UNKNOWN_COMMAND", `Unknown command: ${command}`, "Run 'shipcheck help' to see available commands");
}
