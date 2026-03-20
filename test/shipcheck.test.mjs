import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluateDogfoodGate } from "../bin/shipcheck.mjs";

const BIN = join(import.meta.dirname, "..", "bin", "shipcheck.mjs");

function run(args, cwd, env = {}) {
  try {
    const stdout = execFileSync("node", [BIN, ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, ...env },
      timeout: 10_000,
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      exitCode: err.status,
    };
  }
}

// --- help ---

describe("help command", () => {
  it("prints usage info and exits 0", () => {
    const { stdout, exitCode } = run(["help"], process.cwd());
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("shipcheck"));
    assert.ok(stdout.includes("init"));
    assert.ok(stdout.includes("audit"));
  });

  it("--help alias works", () => {
    const { stdout, exitCode } = run(["--help"], process.cwd());
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("shipcheck"));
  });

  it("-h alias works", () => {
    const { exitCode } = run(["-h"], process.cwd());
    assert.equal(exitCode, 0);
  });

  it("no args defaults to help", () => {
    const { stdout, exitCode } = run([], process.cwd());
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("shipcheck"));
  });
});

// --- unknown command ---

describe("unknown command", () => {
  it("exits non-zero with error", () => {
    const { exitCode, stderr } = run(["bogus"], process.cwd());
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes("Unknown command") || stderr.includes("bogus"));
  });

  it("emits structured JSON when SHIPCHECK_JSON is set", () => {
    const { exitCode, stderr } = run(["bogus"], process.cwd(), {
      SHIPCHECK_JSON: "1",
    });
    assert.notEqual(exitCode, 0);
    const parsed = JSON.parse(stderr.trim());
    assert.equal(parsed.code, "INPUT_UNKNOWN_COMMAND");
    assert.ok(parsed.message.includes("bogus"));
    assert.ok(parsed.hint);
  });
});

// --- init ---

describe("init command", () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "shipcheck-test-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("creates SHIP_GATE.md, SECURITY.md, CHANGELOG.md, SCORECARD.md", () => {
    // Provide a minimal package.json so detectTypes finds npm
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "test" }));

    const { exitCode } = run(["init"], tmp);
    assert.equal(exitCode, 0);

    for (const file of ["SHIP_GATE.md", "SECURITY.md", "CHANGELOG.md", "SCORECARD.md"]) {
      assert.ok(existsSync(join(tmp, file)), `Expected ${file} to exist`);
    }
  });

  it("skips SECURITY.md and CHANGELOG.md if they already exist", () => {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "test" }));
    writeFileSync(join(tmp, "SECURITY.md"), "existing");
    writeFileSync(join(tmp, "CHANGELOG.md"), "existing");

    const { stdout, exitCode } = run(["init"], tmp);
    assert.equal(exitCode, 0);

    // Original content preserved
    assert.equal(readFileSync(join(tmp, "SECURITY.md"), "utf8"), "existing");
    assert.equal(readFileSync(join(tmp, "CHANGELOG.md"), "utf8"), "existing");
    assert.ok(stdout.includes("skip"));
  });

  it("always overwrites SHIP_GATE.md and SCORECARD.md", () => {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "test" }));
    writeFileSync(join(tmp, "SHIP_GATE.md"), "old");
    writeFileSync(join(tmp, "SCORECARD.md"), "old");

    run(["init"], tmp);

    assert.notEqual(readFileSync(join(tmp, "SHIP_GATE.md"), "utf8"), "old");
    assert.notEqual(readFileSync(join(tmp, "SCORECARD.md"), "utf8"), "old");
  });
});

// --- detectTypes (tested via init output) ---

describe("detectTypes via init", () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "shipcheck-detect-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("detects npm tag from package.json", () => {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "x" }));
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[npm]"));
    assert.ok(stdout.includes("[all]"));
  });

  it("detects mcp tag from keywords", () => {
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "x", keywords: ["mcp"] })
    );
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[mcp]"));
  });

  it("detects mcp tag from description", () => {
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "x", description: "An MCP server" })
    );
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[mcp]"));
  });

  it("detects cli tag from bin field", () => {
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "x", bin: { foo: "foo.js" } })
    );
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[cli]"));
  });

  it("detects pypi tag from pyproject.toml", () => {
    writeFileSync(join(tmp, "pyproject.toml"), "[project]\nname='x'");
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[pypi]"));
  });

  it("detects container tag from Dockerfile", () => {
    writeFileSync(join(tmp, "Dockerfile"), "FROM node:22");
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[container]"));
  });

  it("detects vsix tag from .vscodeignore", () => {
    writeFileSync(join(tmp, ".vscodeignore"), "");
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[vsix]"));
  });

  it("detects vsix tag from engines.vscode", () => {
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "x", engines: { vscode: "^1.80.0" } })
    );
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[vsix]"));
  });

  it("detects desktop tag from tauri.conf.json", () => {
    writeFileSync(join(tmp, "tauri.conf.json"), "{}");
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[desktop]"));
  });

  it("returns only [all] for bare directory", () => {
    const { stdout } = run(["init"], tmp);
    assert.ok(stdout.includes("[all]"));
    assert.ok(!stdout.includes("[npm]"));
    assert.ok(!stdout.includes("[mcp]"));
  });
});

// --- audit ---

describe("audit command", () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "shipcheck-audit-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("exits 0 when all items are checked", () => {
    writeFileSync(
      join(tmp, "SHIP_GATE.md"),
      "# Gate\n- [x] Item A\n- [x] Item B\n- [ ] Item C SKIP: not applicable\n"
    );
    const { exitCode, stdout } = run(["audit"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("100%"));
    assert.ok(stdout.includes("Ship it"));
  });

  it("exits 1 when gaps remain", () => {
    writeFileSync(
      join(tmp, "SHIP_GATE.md"),
      "# Gate\n- [x] Item A\n- [ ] Item B is missing\n"
    );
    const { exitCode, stdout } = run(["audit"], tmp);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("50%"));
    assert.ok(stdout.includes("Item B"));
  });

  it("counts skipped items correctly", () => {
    writeFileSync(
      join(tmp, "SHIP_GATE.md"),
      "- [x] A\n- [ ] B SKIP: reason\n- [ ] C SKIP: reason\n- [ ] D\n"
    );
    const { exitCode, stdout } = run(["audit"], tmp);
    assert.equal(exitCode, 1);
    // 1 checked, 1 unchecked, 2 skipped → pass rate = 1/(1+1) = 50%
    assert.ok(stdout.includes("50%"));
    assert.ok(stdout.includes("Skipped"));
  });

  it("fails with structured error when SHIP_GATE.md missing", () => {
    const { exitCode, stderr } = run(["audit"], tmp);
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes("SHIP_GATE.md") || stderr.includes("STATE_MISSING_GATE"));
  });

  it("handles uppercase [X] as checked", () => {
    writeFileSync(
      join(tmp, "SHIP_GATE.md"),
      "- [X] Item A\n- [X] Item B\n"
    );
    const { exitCode } = run(["audit"], tmp);
    assert.equal(exitCode, 0);
  });
});

// --- Gate F: dogfood (evaluateDogfoodGate unit tests) ---

describe("evaluateDogfoodGate", () => {
  const freshDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
  const staleDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago

  const goodIndex = {
    "mcp-tool-shop-org/shipcheck": {
      "cli": {
        run_id: "shipcheck-123-1",
        verified: "pass",
        verification_status: "accepted",
        finished_at: freshDate,
        path: "records/mcp-tool-shop-org/shipcheck/2026/03/19/run-shipcheck-123-1.json"
      }
    }
  };

  it("passes on fresh accepted/pass record", () => {
    const result = evaluateDogfoodGate(goodIndex, "mcp-tool-shop-org/shipcheck", "cli", 30);
    assert.equal(result.pass, true);
    assert.equal(result.run_id, "shipcheck-123-1");
    assert.ok(result.ageDays <= 2);
  });

  it("fails on missing repo", () => {
    const result = evaluateDogfoodGate(goodIndex, "mcp-tool-shop-org/unknown", "cli", 30);
    assert.equal(result.pass, false);
    assert.equal(result.reason, "DOGFOOD_NO_RECORD");
  });

  it("fails on missing surface", () => {
    const result = evaluateDogfoodGate(goodIndex, "mcp-tool-shop-org/shipcheck", "desktop", 30);
    assert.equal(result.pass, false);
    assert.equal(result.reason, "DOGFOOD_NO_SURFACE");
    assert.ok(result.detail.includes("cli"));
  });

  it("fails on rejected verification", () => {
    const index = {
      "org/repo": {
        "cli": { run_id: "r-1", verified: "pass", verification_status: "rejected", finished_at: freshDate }
      }
    };
    const result = evaluateDogfoodGate(index, "org/repo", "cli", 30);
    assert.equal(result.pass, false);
    assert.equal(result.reason, "DOGFOOD_REJECTED");
  });

  it("fails on non-pass verdict", () => {
    const index = {
      "org/repo": {
        "cli": { run_id: "r-1", verified: "fail", verification_status: "accepted", finished_at: freshDate }
      }
    };
    const result = evaluateDogfoodGate(index, "org/repo", "cli", 30);
    assert.equal(result.pass, false);
    assert.equal(result.reason, "DOGFOOD_VERDICT_FAIL");
    assert.ok(result.detail.includes("fail"));
  });

  it("fails on stale record", () => {
    const index = {
      "org/repo": {
        "cli": { run_id: "r-1", verified: "pass", verification_status: "accepted", finished_at: staleDate }
      }
    };
    const result = evaluateDogfoodGate(index, "org/repo", "cli", 30);
    assert.equal(result.pass, false);
    assert.equal(result.reason, "DOGFOOD_STALE");
    assert.ok(result.detail.includes("60"));
  });

  it("respects custom freshness window", () => {
    const index = {
      "org/repo": {
        "cli": { run_id: "r-1", verified: "pass", verification_status: "accepted", finished_at: staleDate }
      }
    };
    // 90-day window should accept a 60-day-old record
    const result = evaluateDogfoodGate(index, "org/repo", "cli", 90);
    assert.equal(result.pass, true);
  });
});

// --- Gate F: dogfood CLI ---

describe("dogfood command (CLI)", () => {
  it("fails with missing --repo", () => {
    const { exitCode, stderr } = run(["dogfood", "--surface", "cli"], process.cwd());
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes("INPUT_MISSING_REPO") || stderr.includes("--repo"));
  });

  it("fails with missing --surface", () => {
    const { exitCode, stderr } = run(["dogfood", "--repo", "org/repo"], process.cwd());
    assert.notEqual(exitCode, 0);
    assert.ok(stderr.includes("INPUT_MISSING_SURFACE") || stderr.includes("--surface"));
  });

  it("passes for a known good repo+surface (live)", () => {
    const { exitCode, stdout } = run(
      ["dogfood", "--repo", "mcp-tool-shop-org/shipcheck", "--surface", "cli"],
      process.cwd()
    );
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("Gate F"));
    assert.ok(stdout.includes("passed"));
  });

  it("fails for a repo with no record (live)", () => {
    const { exitCode, stdout } = run(
      ["dogfood", "--repo", "mcp-tool-shop-org/nonexistent", "--surface", "cli"],
      process.cwd()
    );
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("failed"));
  });
});
