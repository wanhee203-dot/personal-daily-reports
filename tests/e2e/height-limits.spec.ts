import path from "node:path";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { DailyReport, ReportProject } from "../../src/schema/report-types";
import { parseReportMarkdown } from "../../src/parser/parse-report";
import { startRenderServer } from "../../src/server/start-render-server";
import { exportArtifacts } from "../../src/exporter/export-artifacts";

test("warns for a long report below the hard maximum", async () => {
  const fixturePath = path.resolve("tests/fixtures/valid-long.md");
  const report = parseReportMarkdown(
    await readFile(fixturePath, "utf8"),
    "2026-08-01.md"
  );
  const server = await startRenderServer(report);

  try {
    const result = await exportArtifacts({
      url: server.url,
      pngPath: path.resolve("test-results/long-report.png"),
      pdfPath: path.resolve("test-results/long-report.pdf"),
      scale: 1
    });

    expect(result.cssHeight).toBeGreaterThan(10_000);
    expect(result.cssHeight).toBeLessThanOrEqual(16_000);
    expect(result.warning).toMatch(/10000/);
  } finally {
    await server.close();
  }
});

test("rejects a report above the hard maximum", async () => {
  const longItem = "超长内容".repeat(30);
  const makeItems = () => Array.from({ length: 8 }, () => longItem);
  const projects: ReportProject[] = Array.from(
    { length: 8 },
    (_, index) => ({
      code: `PRJ-HARD-${index + 1}`,
      title: `高度硬限制验证项目 ${index + 1}`,
      status: "blocked",
      summary: longItem,
      progress: makeItems(),
      issues: makeItems(),
      next: makeItems()
    })
  );
  const report: DailyReport = {
    meta: {
      title: "超长日报硬限制验证",
      date: "2026-08-01",
      owner: "Wenzel"
    },
    projects,
    globalNextActions: [longItem]
  };
  const server = await startRenderServer(report);

  try {
    await expect(
      exportArtifacts({
        url: server.url,
        pngPath: path.resolve("test-results/hard-limit-report.png"),
        pdfPath: path.resolve("test-results/hard-limit-report.pdf"),
        scale: 1
      })
    ).rejects.toThrow(/exceeds 16000px/);
  } finally {
    await server.close();
  }
});
