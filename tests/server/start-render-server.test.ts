import { describe, expect, it } from "vitest";
import type { DailyReport } from "../../src/schema/report-types";
import { startRenderServer } from "../../src/server/start-render-server";

const report: DailyReport = {
  meta: {
    title: "个人日报",
    date: "2026-08-01",
    owner: "Wenzel"
  },
  projects: [
    {
      code: "PRJ-001",
      title: "项目",
      status: "planned",
      summary: "摘要。",
      progress: ["进展。"],
      issues: [],
      next: ["下一步。"]
    }
  ],
  globalNextActions: ["继续。"]
};

describe("startRenderServer", () => {
  it("serves report JSON from loopback", async () => {
    const server = await startRenderServer(report);

    try {
      expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:/);
      const response = await fetch(`${server.url}/__report-data.json`);
      expect(response.ok).toBe(true);
      expect(await response.json()).toEqual(report);
    } finally {
      await server.close();
    }
  });
});
