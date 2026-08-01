import {
  cp,
  mkdtemp,
  mkdir,
  stat
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateReport } from "../../src/core/generate-report";

describe("generateReport", () => {
  it("dry-runs ordinary daily Markdown without writing output", async () => {
    const projectRoot = await mkdtemp(
      path.join(os.tmpdir(), "pdr-dry-run-")
    );
    const sourceDir = path.join(
      projectRoot,
      "daily",
      "2026-07"
    );
    await mkdir(sourceDir, { recursive: true });
    const sourcePath = path.join(
      sourceDir,
      "2026-07-30-31.md"
    );
    await cp(
      path.resolve("tests/fixtures/plain-daily.md"),
      sourcePath
    );
    const referenceDir = path.join(
      projectRoot,
      "template-reference"
    );
    await mkdir(referenceDir, { recursive: true });
    await cp(
      path.resolve("template-reference/figma-reference.png"),
      path.join(referenceDir, "figma-reference.png")
    );

    const result = await generateReport({
      sourcePath,
      projectRoot,
      dryRun: true,
      verbose: false
    });

    expect(result.status).toBe("dry-run");
    if (result.status !== "dry-run") {
      throw new Error("expected dry-run");
    }
    expect(result.document.title).toBe(
      "2026年7月30—31日日报"
    );
    expect(result.outputPath).toBe(
      path.join(sourceDir, "images", "30-31.pdf")
    );
    await expect(
      stat(path.join(sourceDir, "images"))
    ).rejects.toThrow();
    await expect(
      stat(path.join(projectRoot, ".daily-report-cache"))
    ).rejects.toThrow();
  });
});
