import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReportProject } from "../../src/schema/report-types";
import { ProjectCard } from "../../src/template/components/ProjectCard";

const project: ReportProject = {
  code: "PRJ-HC",
  title: "HC 耦合酸蚀程序",
  status: "in-progress",
  summary: "项目摘要。",
  progress: ["完成网格。"],
  issues: [],
  next: ["运行程序。"]
};

describe("ProjectCard", () => {
  it("renders all fixed sections and the empty issue text", () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByText("PRJ-HC")).toBeInTheDocument();
    expect(screen.getByText("HC 耦合酸蚀程序")).toBeInTheDocument();
    expect(screen.getByText("今日进展")).toBeInTheDocument();
    expect(screen.getByText("当前问题")).toBeInTheDocument();
    expect(screen.getByText("下一步")).toBeInTheDocument();
    expect(screen.getByText("暂无待解决问题")).toBeInTheDocument();
  });
});
