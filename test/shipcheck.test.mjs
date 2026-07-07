import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  evaluateDogfoodGate, fetchEnforcementMode, runPublishGate, discoverPublishablePackages,
  scanTextForSecrets, runSecretsGate,
  checkEngines, checkLockfile, checkVersionTag, runManifestGate,
  checkSecurityMd, checkThreatModel, runSecurityDocsGate,
} from "../bin/shipcheck.mjs";

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

// Live tests hit dogfood-lab and assert a *fresh* (<=30d) passing record — an
// external, time-sensitive dependency that must not gate CI or a release. Opt in
// with SHIPCHECK_LIVE=1 to run them (e.g. a nightly job).
const SKIP_LIVE = process.env.SHIPCHECK_LIVE
  ? false
  : "live: needs a fresh dogfood-lab record — opt in with SHIPCHECK_LIVE=1";

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

  it("passes for a known good repo+surface (live)", { skip: SKIP_LIVE }, () => {
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

// --- Gate F: enforcement mode ---

describe("fetchEnforcementMode", () => {
  it("returns required for a repo with enforcement: required (live)", async () => {
    const result = await fetchEnforcementMode(
      "dogfood-lab/testing-os", "main", "mcp-tool-shop-org/shipcheck"
    );
    assert.equal(result.mode, "required");
    assert.equal(result.reason, null);
    assert.equal(result.review_after, null);
  });

  it("returns required when policy file does not exist (live)", async () => {
    const result = await fetchEnforcementMode(
      "dogfood-lab/testing-os", "main", "mcp-tool-shop-org/nonexistent-repo-xyz"
    );
    assert.equal(result.mode, "required");
  });
});

describe("dogfood enforcement CLI", () => {
  it("passes with required mode for a known good repo (live)", { skip: SKIP_LIVE }, () => {
    const { exitCode, stdout } = run(
      ["dogfood", "--repo", "mcp-tool-shop-org/shipcheck", "--surface", "cli"],
      process.cwd()
    );
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("Gate F"));
    assert.ok(stdout.includes("passed"));
  });

  it("fails with required mode for a missing repo (live)", () => {
    const { exitCode, stdout } = run(
      ["dogfood", "--repo", "mcp-tool-shop-org/nonexistent", "--surface", "cli"],
      process.cwd()
    );
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("failed"));
  });
});

// --- pack (Gate H: publish surface) ---

describe("pack command (Gate H)", () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "shipcheck-pack-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  // Build a workspace package on disk. `disk` lists files to actually create.
  function makePkg(rel, pj, disk = []) {
    const dir = join(tmp, rel);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify(pj, null, 2));
    for (const f of disk) writeFileSync(join(dir, f), `${f} content`);
    return dir;
  }
  function rootWorkspaces(globs) {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "root", private: true, workspaces: globs }));
  }

  it("passes when every publishable package tarball has README + LICENSE", () => {
    makePkg("packages/a", { name: "@x/a", version: "1.0.0", license: "MIT", files: ["README.md", "LICENSE"] }, ["README.md", "LICENSE"]);
    rootWorkspaces(["packages/*"]);
    const packRunner = () => ["package/package.json", "package/README.md", "package/LICENSE"];
    const result = runPublishGate({ root: tmp, packRunner });
    assert.equal(result.status, "pass");
    assert.equal(result.checked, 1);
    assert.equal(result.findings.length, 0);
  });

  it("FAILS a package whose tarball is missing the README (the storyboard-os defect)", () => {
    makePkg("packages/a", { name: "@x/a", version: "1.0.0", license: "MIT", files: ["README.md", "LICENSE"] }, ["LICENSE"]);
    rootWorkspaces(["packages/*"]);
    const packRunner = () => ["package/package.json", "package/LICENSE"];
    const result = runPublishGate({ root: tmp, packRunner });
    assert.equal(result.status, "fail");
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].name, "@x/a");
    assert.ok(result.findings[0].issues.some((i) => /tarball contains no README/i.test(i)));
    assert.ok(result.findings[0].issues.some((i) => /files\[\] promises "README\.md"/.test(i)));
  });

  it("FAILS a package whose tarball is missing the LICENSE (all six storyboard-os packages)", () => {
    makePkg("packages/a", { name: "@x/a", version: "1.0.0", license: "MIT", files: ["README.md", "LICENSE"] }, ["README.md"]);
    rootWorkspaces(["packages/*"]);
    const packRunner = () => ["package/README.md"];
    const result = runPublishGate({ root: tmp, packRunner });
    assert.equal(result.status, "fail");
    assert.ok(result.findings[0].issues.some((i) => /tarball contains no LICENSE/i.test(i)));
  });

  it("FAILS a package with no license field", () => {
    makePkg("packages/a", { name: "@x/a", version: "1.0.0", files: ["README.md", "LICENSE"] }, ["README.md", "LICENSE"]);
    rootWorkspaces(["packages/*"]);
    const result = runPublishGate({ root: tmp, packRunner: () => ["package/README.md", "package/LICENSE"] });
    assert.equal(result.status, "fail");
    assert.ok(result.findings[0].issues.some((i) => /no `license` field/.test(i)));
  });

  it("excludes private packages; skips when nothing is publishable", () => {
    makePkg("packages/priv", { name: "@x/priv", version: "1.0.0", private: true }, []);
    rootWorkspaces(["packages/*"]);
    const result = runPublishGate({ root: tmp, packRunner: () => [] });
    assert.equal(result.status, "skip");
    assert.equal(result.checked, 0);
  });

  it("discoverPublishablePackages reads pnpm-workspace.yaml and excludes private", () => {
    makePkg("packages/pub", { name: "@x/pub", version: "1.0.0", license: "MIT" }, []);
    makePkg("packages/priv", { name: "@x/priv", version: "1.0.0", private: true }, []);
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "root", private: true }));
    writeFileSync(join(tmp, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\n");
    const names = discoverPublishablePackages(tmp).map((p) => p.name);
    assert.ok(names.includes("@x/pub"));
    assert.ok(!names.includes("@x/priv"));
  });

  it("integration: `shipcheck pack` exits 1 and names the incomplete package (real npm pack)", () => {
    makePkg("packages/good", { name: "@x/good", version: "1.0.0", license: "MIT", files: ["README.md", "LICENSE"] }, ["README.md", "LICENSE"]);
    makePkg("packages/bad", { name: "@x/bad", version: "1.0.0", license: "MIT", files: ["README.md", "LICENSE"] }, []);
    rootWorkspaces(["packages/*"]);
    const { exitCode, stdout } = run(["pack"], tmp);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("@x/bad"));
    assert.ok(stdout.includes("1 of 2"));
  });
});

// --- secrets (Gate I: no credential ships in a published tarball) ---
//
// Fake credentials below are constructed at runtime (prefix + filler) so the test
// SOURCE never contains a contiguous real-looking token — this keeps GitHub push
// protection and the org's own `shipcheck secrets` gate quiet while the RUNTIME
// value still exercises the regex. AKIAIOSFODNN7EXAMPLE is AWS's own documented,
// universally-allowlisted example key.
const FAKE = {
  aws: "AKIAIOSFODNN7EXAMPLE",
  githubPat: "ghp_" + "0123456789abcdefghijklmnopqrstuvwxyz",   // 36-char body
  npmToken: "npm_" + "0123456789abcdefghijklmnopqrstuvwxyz",    // 36-char body
  anthropic: "sk-ant-" + "A".repeat(24),
  privKeyHeader: "-----BEGIN RSA PRIVATE KEY-----",
};

describe("scanTextForSecrets (Gate I unit + RED meta)", () => {
  it("detects an AWS access key id", () => {
    const f = scanTextForSecrets(`const key = "${FAKE.aws}";`);
    assert.equal(f.length, 1);
    assert.equal(f[0].ruleId, "aws-access-key");
    assert.equal(f[0].line, 1);
  });

  it("detects a GitHub token, an npm token, an Anthropic key, and a private-key block", () => {
    assert.ok(scanTextForSecrets(`token=${FAKE.githubPat}`).some((f) => f.ruleId === "github-token"));
    assert.ok(scanTextForSecrets(`//registry.npmjs.org/:_authToken=${FAKE.npmToken}`).some((f) => f.ruleId === "npm-token"));
    assert.ok(scanTextForSecrets(`ANTHROPIC_API_KEY=${FAKE.anthropic}`).some((f) => f.ruleId === "anthropic-key"));
    assert.ok(scanTextForSecrets(FAKE.privKeyHeader).some((f) => f.ruleId === "private-key"));
  });

  it("REDACTS the match — the raw secret never appears in a finding", () => {
    const f = scanTextForSecrets(`k=${FAKE.aws}`);
    assert.equal(f.length, 1);
    assert.ok(!f[0].redacted.includes(FAKE.aws), "redacted value must not contain the raw secret");
    assert.ok(f[0].redacted.startsWith("AKIA"));
    assert.ok(f[0].redacted.includes("*"));
  });

  it("is clean on ordinary code (no false positives)", () => {
    const code = `import { readFileSync } from "node:fs";\nconst version = "1.0.7";\nconst sha = "abc123def456";\n// AKIA is a prefix, [0-9A-Z]{16} is a pattern`;
    assert.deepEqual(scanTextForSecrets(code), []);
  });

  it("honors the shipcheck-allow-secret inline escape hatch", () => {
    const line = `example = "${FAKE.aws}" // shipcheck-allow-secret documented sample`;
    assert.deepEqual(scanTextForSecrets(line), []);
  });
});

describe("runSecretsGate (Gate I core)", () => {
  it("passes when every published file is clean (GREEN)", () => {
    const discover = () => [{ dir: "/pkg", name: "@x/clean", pj: {} }];
    const listFiles = () => ["index.js", "README.md"];
    const readFile = (_dir, rel) => (rel === "index.js" ? "export const x = 1;" : "# readme");
    const result = runSecretsGate({ discover, listFiles, readFile });
    assert.equal(result.status, "pass");
    assert.equal(result.filesScanned, 2);
    assert.equal(result.findings.length, 0);
  });

  it("RED meta: goes RED when a published file carries a secret", () => {
    const discover = () => [{ dir: "/pkg", name: "@x/leaky", pj: {} }];
    const listFiles = () => ["index.js"];
    const readFile = () => `export const AWS_KEY = "${FAKE.aws}";`;
    const result = runSecretsGate({ discover, listFiles, readFile });
    assert.equal(result.status, "fail");
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].name, "@x/leaky");
    assert.equal(result.findings[0].file, "index.js");
    assert.equal(result.findings[0].ruleId, "aws-access-key");
    assert.ok(!JSON.stringify(result).includes(FAKE.aws), "gate result must never carry the raw secret");
  });

  it("fails when the publish surface cannot be listed (can't certify clean)", () => {
    const discover = () => [{ dir: "/pkg", name: "@x/broken", pj: {} }];
    const listFiles = () => { throw new Error("npm pack blew up"); };
    const result = runSecretsGate({ discover, listFiles });
    assert.equal(result.status, "fail");
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].name, "@x/broken");
  });

  it("skips when there are no publishable packages", () => {
    const result = runSecretsGate({ discover: () => [] });
    assert.equal(result.status, "skip");
  });
});

describe("secrets command (Gate I integration, real npm pack)", () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "shipcheck-secrets-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  function makePkg(rel, pj, disk = {}) {
    const dir = join(tmp, rel);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify(pj, null, 2));
    for (const [f, content] of Object.entries(disk)) writeFileSync(join(dir, f), content);
    return dir;
  }

  it("RED meta: exits 1 and names the package when a real key ships in the tarball", () => {
    makePkg("packages/leaky",
      { name: "@x/leaky", version: "1.0.0", license: "MIT", files: ["index.js", "README.md", "LICENSE"] },
      { "index.js": `export const K = "${FAKE.aws}";\n`, "README.md": "# leaky", "LICENSE": "MIT" });
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "root", private: true, workspaces: ["packages/*"] }));
    const { exitCode, stdout } = run(["secrets"], tmp);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("@x/leaky"));
    assert.ok(stdout.includes("index.js"));
    assert.ok(!stdout.includes(FAKE.aws), "CLI output must redact the secret, never print it raw");
  });

  it("exits 0 when the published files are clean", () => {
    makePkg("packages/clean",
      { name: "@x/clean", version: "1.0.0", license: "MIT", files: ["index.js", "README.md", "LICENSE"] },
      { "index.js": "export const ok = true;\n", "README.md": "# clean", "LICENSE": "MIT" });
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "root", private: true, workspaces: ["packages/*"] }));
    const { exitCode, stdout } = run(["secrets"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("passed"));
  });
});

// --- manifest (Gate J: engines / lockfile / version-vs-tag) ---

describe("checkEngines (Gate J RED meta)", () => {
  it("passes when every package declares engines.node", () => {
    const r = checkEngines([{ name: "@x/a", pj: { engines: { node: ">=18" } } }]);
    assert.equal(r.status, "pass");
  });
  it("RED meta: fails when a package is missing engines.node", () => {
    const r = checkEngines([
      { name: "@x/a", pj: { engines: { node: ">=18" } } },
      { name: "@x/b", pj: {} },
    ]);
    assert.equal(r.status, "fail");
    assert.deepEqual(r.findings, ["@x/b"]);
  });
  it("RED meta: fails a pyproject with no requires-python", () => {
    const r = checkEngines([], { pyproject: { hasProject: true, requiresPython: null } });
    assert.equal(r.status, "fail");
  });
  it("skips when nothing is applicable", () => {
    assert.equal(checkEngines([], { pyproject: { hasProject: false } }).status, "skip");
  });
});

describe("checkLockfile (Gate J RED meta)", () => {
  it("passes when a lockfile exists", () => {
    const exists = (p) => p.endsWith("package-lock.json");
    assert.equal(checkLockfile("/r", { exists, isNpm: true }).status, "pass");
  });
  it("RED meta: fails when no lockfile is committed", () => {
    const r = checkLockfile("/r", { exists: () => false, isNpm: true });
    assert.equal(r.status, "fail");
    assert.ok(r.detail.includes("no lockfile"));
  });
  it("skips when neither npm nor pypi", () => {
    assert.equal(checkLockfile("/r", { exists: () => false }).status, "skip");
  });
});

describe("checkVersionTag (Gate J RED meta)", () => {
  it("passes when version is ahead of the newest tag", () => {
    assert.equal(checkVersionTag("1.0.7", ["v1.0.4", "v1.0.2"]).status, "pass");
  });
  it("passes when version equals the newest tag", () => {
    const r = checkVersionTag("1.0.4", ["v1.0.4", "v1.0.2"]);
    assert.equal(r.status, "pass");
    assert.ok(r.detail.includes("matches"));
  });
  it("RED meta: fails when the manifest version is BEHIND the newest released tag", () => {
    const r = checkVersionTag("1.0.3", ["v1.0.4", "v1.0.2"]);
    assert.equal(r.status, "fail");
    assert.ok(r.detail.includes("BEHIND"));
    assert.ok(r.detail.includes("v1.0.4"));
  });
  it("ignores non-semver tags (swarm-save-*) when choosing the newest", () => {
    // The real shipcheck repo: git describe returns a swarm-save-* tag; the gate
    // must pick the newest SEMVER tag, not the newest by commit date.
    const tags = ["v1.0.4", "swarm-save-1775881551", "swarm-save-1775881563", "v1.0.2"];
    assert.equal(checkVersionTag("1.0.7", tags).status, "pass");
    assert.equal(checkVersionTag("1.0.3", tags).status, "fail"); // still measured against v1.0.4
  });
  it("skips when there are no semver tags", () => {
    assert.equal(checkVersionTag("1.0.0", ["swarm-save-1", "nightly"]).status, "skip");
  });
  it("skips when the manifest version is not semver", () => {
    assert.equal(checkVersionTag("nightly", ["v1.0.0"]).status, "skip");
  });
  it("--expect passes on exact match, fails otherwise", () => {
    assert.equal(checkVersionTag("1.2.3", [], { expect: "1.2.3" }).status, "pass");
    assert.equal(checkVersionTag("1.2.3", [], { expect: "1.2.4" }).status, "fail");
  });
});

describe("runManifestGate (Gate J core, injected)", () => {
  it("passes a healthy npm package (engines + lockfile + ahead-of-tag)", () => {
    const discover = () => [{ dir: "/r", name: "@x/a", pj: { engines: { node: ">=18" }, version: "2.0.0" } }];
    const result = runManifestGate({
      root: "/r", discover,
      listTags: () => ["v1.0.0"],
      exists: (p) => p.endsWith("package-lock.json"),
      readPyproject: () => ({ hasProject: false }),
      rootVersion: "2.0.0",
    });
    assert.equal(result.status, "pass");
    assert.equal(result.checks.filter((c) => c.status === "fail").length, 0);
  });

  it("RED meta: fails when engines missing AND version behind tag", () => {
    const discover = () => [{ dir: "/r", name: "@x/a", pj: { version: "1.0.0" } }];
    const result = runManifestGate({
      root: "/r", discover,
      listTags: () => ["v2.0.0"],
      exists: () => false, // no lockfile either
      readPyproject: () => ({ hasProject: false }),
      rootVersion: "1.0.0",
    });
    assert.equal(result.status, "fail");
    const failed = result.checks.filter((c) => c.status === "fail").map((c) => c.id).sort();
    assert.deepEqual(failed, ["engines", "lockfile", "version-tag"]);
  });
});

describe("manifest command (Gate J integration, real run)", () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "shipcheck-manifest-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("RED meta: exits 1 on a package missing engines + lockfile", () => {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "@x/thing", version: "1.0.0" }));
    const { exitCode, stdout } = run(["manifest"], tmp);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("engines"));
    assert.ok(stdout.includes("lockfile"));
  });

  it("exits 0 on a healthy repo (engines + lockfile, no tags to compare)", () => {
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "@x/thing", version: "1.0.0", engines: { node: ">=18" } }));
    writeFileSync(join(tmp, "package-lock.json"), "{}");
    const { exitCode, stdout } = run(["manifest"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("passed"));
  });
});

// --- security-docs (Gate K: A1 SECURITY.md + A2 README trust model) ---

describe("checkSecurityMd (Gate K RED meta)", () => {
  const withEmail = "# Security\n\n## Reporting\n\nEmail: security@example.com\n";
  it("passes when SECURITY.md exists with a reporting contact", () => {
    const r = checkSecurityMd("/r", { exists: (p) => p.endsWith("SECURITY.md"), readFile: () => withEmail });
    assert.equal(r.status, "pass");
  });
  it("RED meta: fails when SECURITY.md is absent", () => {
    assert.equal(checkSecurityMd("/r", { exists: () => false }).status, "fail");
  });
  it("RED meta: fails when SECURITY.md exists but is an empty stub (the box would tick green)", () => {
    const r = checkSecurityMd("/r", { exists: (p) => p.endsWith("SECURITY.md"), readFile: () => "   \n" });
    assert.equal(r.status, "fail");
    assert.ok(r.detail.includes("empty"));
  });
  it("RED meta: fails when SECURITY.md has no reporting contact", () => {
    const r = checkSecurityMd("/r", { exists: (p) => p.endsWith("SECURITY.md"), readFile: () => "# Security\n\nWe take security seriously and think about it a lot here.\n" });
    assert.equal(r.status, "fail");
    assert.ok(r.detail.includes("contact"));
  });
});

describe("checkThreatModel (Gate K RED meta)", () => {
  it("passes on a 'Trust model' section with a body (shipcheck's own shape)", () => {
    const readme = "# Tool\n\n## Trust model\n\n**Data touched:** reads package.json only. **No telemetry.**\n\n## License\nMIT\n";
    const r = checkThreatModel("/r", { exists: (p) => p.endsWith("README.md"), readFile: () => readme });
    assert.equal(r.status, "pass");
  });
  it("RED meta: fails when the README has no trust/threat-model section", () => {
    const readme = "# Tool\n\n## Install\n\nnpm i tool\n\n## License\nMIT\n";
    assert.equal(checkThreatModel("/r", { exists: (p) => p.endsWith("README.md"), readFile: () => readme }).status, "fail");
  });
  it("RED meta: fails when the section heading exists but has no substantive body", () => {
    const readme = "# Tool\n\n## Threat model\n## License\nMIT\n";
    const r = checkThreatModel("/r", { exists: (p) => p.endsWith("README.md"), readFile: () => readme });
    assert.equal(r.status, "fail");
    assert.ok(r.detail.includes("body"));
  });
});

describe("security-docs command (Gate K integration, real run)", () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "shipcheck-secdocs-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("RED meta: exits 1 when SECURITY.md is empty and README lacks a trust model", () => {
    writeFileSync(join(tmp, "SECURITY.md"), "");
    writeFileSync(join(tmp, "README.md"), "# Tool\n\n## Install\nnpm i\n");
    const { exitCode, stdout } = run(["security-docs"], tmp);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes("security-md"));
    assert.ok(stdout.includes("threat-model"));
  });

  it("exits 0 when SECURITY.md has a contact and README has a trust model", () => {
    writeFileSync(join(tmp, "SECURITY.md"), "# Security\n\n## Reporting\nEmail: sec@example.com\n\nPlease report issues.\n");
    writeFileSync(join(tmp, "README.md"), "# Tool\n\n## Trust model\n\n**Data touched:** nothing leaves the machine. **No telemetry.**\n");
    const { exitCode, stdout } = run(["security-docs"], tmp);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("passed"));
  });
});
