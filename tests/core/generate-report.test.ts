import { cp, mkdtemp, mkdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateReport } from "../../src/core/generate-report";

describe("generateReport", () => {
  it("supports dry-run without creating rendered output", async () => {
    const projectRoot = await mkdtemp(
      path.join(os.tmpdir(), "pdr-dry-run-")
    );
    const sourceDir = path.join(
      projectRoot,
      "reports",
      "source",
      "2026",
      "08"
    );
    await mkdir(sourceDir, { recursive: true });
    const sourcePath = path.join(sourceDir, "2026-08-01.md");
    await cp(
      path.resolve("tests/fixtures/valid-basic.md"),
      sourcePath
    );

    const result = await generateReport({
      sourcePath,
      projectRoot,
      scale: 1,
      dryRun: true,
      force: false,
      verbose: false
    });

    expect(result.status).toBe("dry-run");
    await expect(
      stat(path.join(projectRoot, "reports", "rendered"))
    ).rejects.toThrow();
  });
});
