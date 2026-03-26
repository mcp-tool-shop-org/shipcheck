import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const BIN = join(__dirname, "..", "bin", "shipcheck.mjs");

describe("version consistency", () => {
  it("package.json version is semver", () => {
    assert.match(pkg.version, /^\d+\.\d+\.\d+/);
  });

  it("version is >= 1.0.0", () => {
    const major = parseInt(pkg.version.split(".")[0], 10);
    assert.ok(major >= 1, `Expected major >= 1, got ${major}`);
  });

  it("CHANGELOG.md contains current version", () => {
    const changelog = readFileSync(join(__dirname, "..", "CHANGELOG.md"), "utf8");
    assert.ok(changelog.includes(`[${pkg.version}]`), `CHANGELOG missing [${pkg.version}]`);
  });

  it("--version flag outputs correct version", () => {
    const stdout = execFileSync("node", [BIN, "--version"], { encoding: "utf8" });
    assert.ok(stdout.includes(pkg.version), `Expected version ${pkg.version} in output: ${stdout}`);
  });
});
