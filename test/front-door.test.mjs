import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { summarizeFrontDoor, runFrontDoorGate } from "../bin/shipcheck.mjs";

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
    return { stdout: err.stdout || "", stderr: err.stderr || "", exitCode: err.status };
  }
}

// A faithful shape of @mcptoolshop/site-theme/front-door's verify() scorecard.
function scorecard({ findings = [], pass = true, failing = 0, reason } = {}) {
  const bySeverity = { contradicted: 0, unbacked: 0, stale: 0, bloat: 0, hygiene: 0, style: 0 };
  const byBucket = {};
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
    byBucket[f.bucket] = (byBucket[f.bucket] ?? 0) + 1;
  }
  return {
    findings,
    counts: { bySeverity, byBucket, total: findings.length },
    gate: { pass, failing, reason: reason ?? (pass ? "No contradicted, unbacked, or stale claims." : `${failing} gate-failing finding(s).`) },
  };
}

// --- summarizeFrontDoor (pure mapping) ---

describe("summarizeFrontDoor", () => {
  it("passes a clean scorecard with all-zero severity counts", () => {
    const s = summarizeFrontDoor(scorecard({ pass: true }));
    assert.equal(s.pass, true);
    assert.equal(s.total, 0);
    assert.equal(s.failing, 0);
    assert.deepEqual(s.topFindings, []);
    assert.equal(s.bySeverity.contradicted, 0);
    assert.equal(s.bySeverity.style, 0);
  });

  it("fails and collects gate-failing findings", () => {
    const findings = [
      { severity: "contradicted", bucket: "contradicted", file: "README.md", line: 12, title: "Claims a flag that does not exist" },
      { severity: "stale", bucket: "missing", file: "AGENTS.md", line: 3, title: "Links a missing script" },
      { severity: "style", bucket: "unverifiable", file: "README.md", line: 40, title: "Long line" },
    ];
    const s = summarizeFrontDoor(scorecard({ findings, pass: false, failing: 2 }));
    assert.equal(s.pass, false);
    assert.equal(s.failing, 2);
    assert.equal(s.total, 3);
    // style is not a gate-failing severity
    assert.equal(s.topFindings.length, 2);
    assert.equal(s.bySeverity.contradicted, 1);
    assert.equal(s.bySeverity.stale, 1);
    assert.equal(s.bySeverity.style, 1);
  });

  it("caps top findings at 5", () => {
    const findings = Array.from({ length: 9 }, (_, i) => ({
      severity: "unbacked",
      bucket: "missing",
      file: "README.md",
      line: i + 1,
      title: `claim ${i}`,
    }));
    const s = summarizeFrontDoor(scorecard({ findings, pass: false, failing: 9 }));
    assert.equal(s.topFindings.length, 5);
    assert.equal(s.bySeverity.unbacked, 9);
  });

  it("derives counts when bySeverity is absent", () => {
    const findings = [
      { severity: "unbacked", file: "README.md", title: "x" },
      { severity: "hygiene", file: "AGENTS.md", title: "y" },
    ];
    // No counts block — force the derive branch.
    const s = summarizeFrontDoor({ findings, gate: { pass: false } });
    assert.equal(s.pass, false);
    assert.equal(s.bySeverity.unbacked, 1);
    assert.equal(s.bySeverity.hygiene, 1);
    assert.equal(s.failing, 1);
  });

  it("does not throw on a malformed/empty scorecard", () => {
    for (const bad of [undefined, null, {}, { findings: "nope" }, { gate: null }]) {
      const s = summarizeFrontDoor(bad);
      assert.equal(typeof s.pass, "boolean");
      assert.equal(typeof s.total, "number");
      assert.ok(s.bySeverity && typeof s.bySeverity === "object");
    }
  });
});

// --- runFrontDoorGate (injected loader — no real dependency needed) ---

describe("runFrontDoorGate", () => {
  it("skips gracefully when the dependency cannot be resolved", async () => {
    const result = await runFrontDoorGate({
      root: "/tmp",
      loadVerify: async () => { throw Object.assign(new Error("Cannot find module"), { code: "ERR_MODULE_NOT_FOUND" }); },
    });
    assert.equal(result.status, "skip");
    assert.ok(/not installed/.test(result.reason));
    assert.ok(result.detail.includes("@mcptoolshop/site-theme"));
  });

  it("skips when the module does not export verify()", async () => {
    const result = await runFrontDoorGate({ root: "/tmp", loadVerify: async () => ({}) });
    assert.equal(result.status, "skip");
    assert.ok(/verify/.test(result.reason));
  });

  it("passes when verify() returns a passing scorecard", async () => {
    const result = await runFrontDoorGate({
      root: "/tmp",
      loadVerify: async () => ({ verify: () => scorecard({ pass: true }) }),
    });
    assert.equal(result.status, "pass");
    assert.equal(result.summary.pass, true);
  });

  it("fails when verify() returns a failing scorecard", async () => {
    const findings = [{ severity: "contradicted", bucket: "contradicted", file: "README.md", line: 1, title: "lie" }];
    const result = await runFrontDoorGate({
      root: "/tmp",
      loadVerify: async () => ({ verify: () => scorecard({ findings, pass: false, failing: 1 }) }),
    });
    assert.equal(result.status, "fail");
    assert.equal(result.summary.failing, 1);
    assert.equal(result.summary.topFindings.length, 1);
  });

  it("skips (never crashes) when verify() throws", async () => {
    const result = await runFrontDoorGate({
      root: "/tmp",
      loadVerify: async () => ({ verify: () => { throw new Error("boom"); } }),
    });
    assert.equal(result.status, "skip");
    assert.ok(/threw/.test(result.reason));
    assert.equal(result.error, "boom");
  });

  it("passes root through to verify()", async () => {
    let seen = null;
    await runFrontDoorGate({
      root: "/some/repo",
      loadVerify: async () => ({ verify: (opts) => { seen = opts; return scorecard({ pass: true }); } }),
    });
    assert.deepEqual(seen, { root: "/some/repo" });
  });
});

// --- front-door command (CLI E2E) ---
//
// site-theme is an optional peer dep and is not installed in the test env, so the
// real CLI takes the graceful-skip path. Whether it skips (dep missing) or passes
// (dep present + bare repo has only hygiene findings), the exit code is 0 — these
// assertions stay true in both environments.

describe("front-door command (CLI)", () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "shipcheck-fd-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("runs and exits 0 on a bare repo (skip or pass)", () => {
    const { stdout, exitCode } = run(["front-door"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(/front door/i.test(stdout), `expected front-door output, got: ${stdout}`);
  });

  it("emits valid JSON with --json", () => {
    writeFileSync(join(tmp, "README.md"), "# Tmp\n\nA repo.\n");
    const { stdout, exitCode } = run(["front-door", "--json"], tmp);
    assert.equal(exitCode, 0);
    const line = stdout.split("\n").find((l) => l.trim().startsWith("{"));
    const parsed = JSON.parse(line);
    assert.ok(["skip", "pass", "fail"].includes(parsed.status));
  });

  it("appears in help output", () => {
    const { stdout, exitCode } = run(["help"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("front-door"));
  });
});
