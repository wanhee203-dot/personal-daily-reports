export interface ProjectSourceLocation {
  headingLine: number;
  codeLine?: number;
  statusLine?: number;
  summaryLine?: number;
  sectionLines: Partial<
    Record<"今日进展" | "当前问题" | "下一步", number>
  >;
}

export interface ReportSourceLocations {
  frontMatterStartLine: number;
  projects: ProjectSourceLocation[];
  globalNextHeadingLine?: number;
}
