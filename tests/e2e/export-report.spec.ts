import {
  cp,
  mkdtemp,
  mkdir,
  readFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";
import { generateReport } from "../../src/core/generate-report";

test("generates complete artifacts and then uses cache", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "pdr-e2e-"));
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
    path.resolve("tests/fixtures/visual-reference.md"),
    sourcePath
  );

  const first = await generateReport({
    sourcePath,
    projectRoot,
    scale: 1,
    dryRun: false,
    force: false,
    verbose: false
  });

  expect(first.status).toBe("generated");
  if (first.status !== "generated") throw new Error("expected generated");

  const pngBytes = await readFile(
    path.join(first.outputDir, "report.png")
  );
  const png = PNG.sync.read(pngBytes);
  expect(png.width).toBe(1080);
  expect(png.height).toBe(first.manifest.render.cssHeight);

  const pdfBytes = await readFile(
    path.join(first.outputDir, "report.pdf")
  );
  const pdf = await PDFDocument.load(pdfBytes);
  expect(pdf.getPageCount()).toBe(1);

  const manifest = JSON.parse(
    await readFile(
      path.join(first.outputDir, "manifest.json"),
      "utf8"
    )
  );
  expect(manifest.reportDate).toBe("2026-08-01");
  expect(manifest.outputs.png).toBe("report.png");

  const second = await generateReport({
    sourcePath,
    projectRoot,
    scale: 1,
    dryRun: false,
    force: false,
    verbose: false
  });

  expect(second.status).toBe("cached");
});
