import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DailyReport } from "../../src/schema/report-types";
import { DailyReportPage } from "../../src/template/DailyReportPage";

const report: DailyReport = {
  meta: {
    title: "科研工程风个人日报",
    date: "2026-08-01",
    owner: "Wenzel",
    version: "V1"
  },
  projects: [
    {
      code: "PRJ-002",
      title: "第二项目",
      status: "planned",
      summary: "第二项目摘要。",
      progress: ["第二项目进展。"],
      issues: [],
      next: ["第二项目下一步。"]
    },
    {
      code: "PRJ-001",
      title: "第一项目",
      status: "completed",
      summary: "第一项目摘要。",
      progress: ["第一项目进展。"],
      issues: [],
      next: ["第一项目下一步。"]
    }
  ],
  globalNextActions: ["完成日报生成器。"]
};

describe("DailyReportPage", () => {
  it("keeps project order and exposes the report root", () => {
    render(<DailyReportPage report={report} />);

    const root = screen.getByTestId("daily-report");
    expect(root).toHaveAttribute("id", "daily-report");

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings.slice(0, 2)).toEqual(["第二项目", "第一项目"]);
  });
});
