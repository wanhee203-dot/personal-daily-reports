import { mkdtemp, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import type { DailyReport } from "../../src/schema/report-types";
import { startRenderServer } from "../../src/server/start-render-server";
import { exportArtifacts } from "../../src/exporter/export-artifacts";

const report: DailyReport = {
  meta: {
    title: "科研工程风个人日报",
    date: "2026-08-01",
    owner: "Wenzel"
  },
  projects: [
    {
      code: "PRJ-001",
      title: "日报生成器",
      status: "in-progress",
      summary: "实现本地无头渲染。",
      progress: ["完成 React 页面。"],
      issues: [],
      next: ["导出 PNG 和 PDF。"]
    }
  ],
  globalNextActions: ["完成第一版。"]
};

test("exports non-empty PNG and PDF", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "pdr-export-"));
  const server = await startRenderServer(report);

  try {
    const result = await exportArtifacts({
      url: server.url,
      pngPath: path.join(output, "report.png"),
      pdfPath: path.join(output, "report.pdf"),
      scale: 1
    });

    expect(result.cssWidth).toBe(1080);
    expect(result.cssHeight).toBeGreaterThanOrEqual(1920);
    expect((await stat(path.join(output, "report.png"))).size).toBeGreaterThan(0);
    expect((await stat(path.join(output, "report.pdf"))).size).toBeGreaterThan(0);
  } finally {
    await server.close();
  }
});
