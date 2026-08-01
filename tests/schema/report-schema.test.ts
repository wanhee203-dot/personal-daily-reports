import { describe, expect, it } from "vitest";
import { validateDailyReport } from "../../src/schema/report-schema";

const validReport = {
  meta: {
    title: "个人日报",
    date: "2026-08-01",
    owner: "Wenzel",
    version: "V1",
    subtitle: "RESEARCH & ENGINEERING OPERATIONS LOG"
  },
  projects: [
    {
      code: "PRJ-HC",
      title: "HC 耦合酸蚀程序",
      status: "in-progress",
      summary: "完成网格稀疏化。",
      progress: ["完成网格生成。"],
      issues: ["暂无。"],
      next: ["运行完整程序。"]
    }
  ],
  globalNextActions: ["完成日报生成器。"]
};

describe("validateDailyReport", () => {
  it("accepts a valid report and normalizes empty issues", () => {
    const report = validateDailyReport(validReport);
    expect(report.projects[0].issues).toEqual([]);
  });

  it("rejects an unknown status", () => {
    const input = structuredClone(validReport);
    input.projects[0].status = "working";
    expect(() => validateDailyReport(input)).toThrow(/status/i);
  });

  it("rejects duplicate project codes", () => {
    const input = structuredClone(validReport);
    input.projects.push({ ...input.projects[0] });
    expect(() => validateDailyReport(input)).toThrow(/duplicate project code/i);
  });

  it("rejects an invalid date", () => {
    const input = structuredClone(validReport);
    input.meta.date = "2026/08/01";
    expect(() => validateDailyReport(input)).toThrow(/YYYY-MM-DD/);
  });

  it("rejects an empty next-action list", () => {
    const input = structuredClone(validReport);
    input.projects[0].next = [];
    expect(() => validateDailyReport(input)).toThrow(/next/i);
  });
});
