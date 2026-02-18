import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

type FindingLevel = "fail" | "warn" | "info";
type Finding = { level: FindingLevel; code: string; message: string; hint?: string };

export type ShipcheckReport = {
  path: string;
  packageName?: string;
  version?: string;
  score: number; // 0..100
  findings: Finding[];
  summary: {
    fails: number;
    warnings: number;
    infos: number;
  };
};

function safeReadJson(filePath: string): any | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function add(findings: Finding[], level: FindingLevel, code: string, message: string, hint?: string) {
  findings.push({ level, code, message, hint });
}

function finalize(root: string, name: string | undefined, version: string | undefined, findings: Finding[]): ShipcheckReport {
  const fails = findings.filter((f) => f.level === "fail").length;
  const warnings = findings.filter((f) => f.level === "warn").length;
  const infos = findings.filter((f) => f.level === "info").length;

  // Extremely simple scoring (you can refine later):
  let score = 100;
  score -= fails * 30;
  score -= warnings * 10;
  score = Math.max(0, Math.min(100, score));

  return {
    path: root,
    packageName: name,
    version,
    score,
    findings,
    summary: { fails, warnings, infos },
  };
}

export async function auditPackage(path: string): Promise<ShipcheckReport> {
  const root = resolve(path);
  const findings: Finding[] = [];

  const pkgPath = join(root, "package.json");
  const pkg = existsSync(pkgPath) ? safeReadJson(pkgPath) : null;

  if (!pkg) {
    add(
      findings,
      "fail",
      "PKG.MISSING",
      "package.json not found or invalid JSON.",
      "Run `npm init -y` (or fix JSON) in the target folder.",
    );
    return finalize(root, undefined, undefined, findings);
  }

  const name = typeof pkg.name === "string" ? pkg.name : undefined;
  const version = typeof pkg.version === "string" ? pkg.version : undefined;

  // 1) Basics
  if (!name) add(findings, "fail", "PKG.NAME.MISSING", "package.json is missing `name`.");
  if (!version) add(findings, "warn", "PKG.VERSION.MISSING", "package.json is missing `version`.");

  // 2) README / LICENSE
  if (!existsSync(join(root, "README.md"))) {
    add(findings, "warn", "DOC.README.MISSING", "README.md is missing.", "Most packages should ship a README.");
  }
  if (!existsSync(join(root, "LICENSE")) && !pkg.license) {
    add(findings, "warn", "DOC.LICENSE.MISSING", "No LICENSE file and no `license` field.");
  }

  // 3) Types
  const hasTypesField = typeof pkg.types === "string" || typeof pkg.typings === "string";
  const typesCandidate =
    typeof pkg.types === "string" ? pkg.types : typeof pkg.typings === "string" ? pkg.typings : null;

  if (!hasTypesField) {
    add(
      findings,
      "warn",
      "TS.TYPES.MISSING",
      "No `types`/`typings` field in package.json.",
      "If you publish TypeScript types, set `types` to your .d.ts entry (e.g. build/index.d.ts).",
    );
  } else if (typesCandidate) {
    const typesPath = join(root, typesCandidate);
    if (!existsSync(typesPath)) {
      add(findings, "fail", "TS.TYPES.BROKEN", `Types entry points to missing file: ${typesCandidate}`);
    }
  }

  // 4) Exports sanity
  if (!pkg.exports) {
    add(
      findings,
      "info",
      "PKG.EXPORTS.MISSING",
      "No `exports` map found.",
      "Consider adding `exports` to avoid deep-import chaos and to define ESM/CJS entrypoints explicitly.",
    );
  }

  // 5) Bin executability (if present)
  if (pkg.bin && typeof pkg.bin === "object") {
    for (const [binName, rel] of Object.entries(pkg.bin)) {
      if (typeof rel === "string" && !existsSync(join(root, rel))) {
        add(findings, "fail", "PKG.BIN.BROKEN", `bin '${binName}' points to missing file: ${rel}`);
      }
    }
  }

  // 6) Quick “will it build?”
  const hasTsc = existsSync(join(root, "tsconfig.json"));
  if (hasTsc) {
    const r = spawnSync("npm", ["run", "-s", "build"], { cwd: root, encoding: "utf8" });
    if (r.status !== 0) {
      add(findings, "fail", "BUILD.FAIL", "npm run build failed.", (r.stderr || r.stdout || "").slice(0, 400));
    }
  } else {
    // Check if it's even a typescript project before warning
    add(findings, "info", "BUILD.TSCONFIG.MISSING", "No tsconfig.json found; skipping build check.");
  }

  return finalize(root, name, version, findings);
}

export async function packPreview(path: string): Promise<any> {
  const root = resolve(path);
  // npm pack --json prints metadata including filename; it also creates a tarball.
  // We need to capture the output carefully.
  // We'll rename the tarball after to avoid clutter or just let npm handle it. 
  // npm pack --dry-run is available in newer npm, but let's stick to safe non-dry run that produces output and delete it.
  
  // NOTE: On Windows, cleaning up the tarball might be tricky if open, but npm pack finishes quickly.
  
  const r = spawnSync("npm", ["pack", "--json"], { cwd: root, encoding: "utf8" });
  const out = (r.stdout || "").trim();

  // Try to find the tarball name to clean it up.
  // The output of `npm pack --json` is a JSON array.
  let tarballName: string | undefined;

  let parsed: any;
  try {
    // npm might print other logs before the JSON, find the JSON array start
    const jsonStart = out.indexOf('[');
    const jsonEnd = out.lastIndexOf(']');
    if (jsonStart >= 0 && jsonEnd >= 0) {
        const jsonStr = out.substring(jsonStart, jsonEnd + 1);
        parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
            tarballName = parsed[0].filename;
        }
    } else {
        parsed = null;
    }
  } catch {
    parsed = null;
  }
  
  // Cleanup tarball if we found a name
  if (tarballName) {
      try {
          // Note: In a real tool we'd use fs.unlinkSync(join(root, tarballName));
          // For now, let's leave it or assume the user deletes it, 
          // or better yet, actually implement the cleanup.
          const { unlinkSync } = await import("node:fs");
          const tarballPath = join(root, tarballName);
          if (existsSync(tarballPath)) {
            unlinkSync(tarballPath);
          }
      } catch (e) {
          // ignore cleanup error
      }
  }

  if (r.status !== 0) {
    return {
      ok: false,
      error: "npm pack failed",
      stderr: (r.stderr || "").slice(0, 800),
    };
  }

  // Best-effort: show what npm reports; keep it read-only (don’t try to unpack).
  return {
    ok: true,
    pack: parsed,
  };
}

export function explainFailure(code: string) {
  const map: Record<string, { meaning: string; fixes: string[] }> = {
    "PKG.MISSING": {
      meaning: "The target folder doesn’t contain a readable package.json.",
      fixes: ["Run `npm init -y`", "Fix JSON syntax errors in package.json"],
    },
    "TS.TYPES.BROKEN": {
      meaning: "`types`/`typings` points to a file that does not exist.",
      fixes: ["Ensure `tsc` emits .d.ts", "Point `types` to the emitted declaration entrypoint"],
    },
    "BUILD.FAIL": {
      meaning: "`npm run build` failed in the package folder.",
      fixes: ["Run the build locally and fix TypeScript errors", "Ensure build outputs match package.json entrypoints"],
    },
  };

  return map[code] ?? {
    meaning: "Unknown code (shipcheck doesn’t have a canned explanation yet).",
    fixes: ["Search the findings output for the full message and hint."],
  };
}
