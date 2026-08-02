import {
  access,
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { generateReport } from "../../src/core/generate-report";

test("generates only daily month images numeric range PDF", async () => {
  const projectRoot = await mkdtemp(
    path.join(os.tmpdir(), "pdr-e2e-")
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
    dryRun: false,
    verbose: false
  });

  expect(result.status).toBe("generated");
  if (result.status !== "generated") {
    throw new Error("expected generated");
  }
  expect(result.outputPath).toBe(
    path.join(sourceDir, "images", "30-31.pdf")
  );
  expect(await readdir(path.join(sourceDir, "images"))).toEqual([
    "30-31.pdf"
  ]);

  const pdf = await PDFDocument.load(
    await readFile(result.outputPath)
  );
  expect(pdf.getPageCount()).toBe(1);
  await expect(
    access(path.join(projectRoot, "reports", "rendered"))
  ).rejects.toThrow();
  await expect(
    access(path.join(projectRoot, ".daily-report-cache"))
  ).rejects.toThrow();
});
