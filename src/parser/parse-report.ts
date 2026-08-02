import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { ZodError } from "zod";
import { validateDailyReport } from "../schema/report-schema";
import type {
  DailyReport,
  ProjectStatus,
  ReportProject
} from "../schema/report-types";
import { ParseReportError } from "./parse-error";
import type {
  ProjectSourceLocation,
  ReportSourceLocations
} from "./source-locations";

type SectionName = "今日进展" | "当前问题" | "下一步";

interface MutableProject {
  title: string;
  code?: string;
  status?: ProjectStatus;
  summaryLines: string[];
  progress: string[];
  issues: string[];
  next: string[];
}

const sectionTarget: Record<
  SectionName,
  keyof Pick<MutableProject, "progress" | "issues" | "next">
> = {
  今日进展: "progress",
  当前问题: "issues",
  下一步: "next"
};

function fail(
  message: string,
  filePath: string,
  line: number
): never {
  throw new ParseReportError(message, filePath, line);
}

function parseFrontMatter(
  lines: string[],
  filePath: string
): { meta: unknown; bodyStartIndex: number } {
  if (lines[0]?.trim() !== "---") {
    fail("Front Matter must start on line 1", filePath, 1);
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );

  if (closingIndex < 0) {
    fail("Front Matter closing delimiter is missing", filePath, 1);
  }

  const yamlText = lines.slice(1, closingIndex).join("\n");

  try {
    return {
      meta: YAML.parse(yamlText),
      bodyStartIndex: closingIndex + 1
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid YAML";
    fail(`Invalid Front Matter: ${message}`, filePath, 2);
  }
}

function finalizeProject(
  project: MutableProject,
  location: ProjectSourceLocation,
  filePath: string
): ReportProject {
  if (!project.code) {
    fail(
      `Project "${project.title}" is missing code`,
      filePath,
      location.headingLine
    );
  }
  if (!project.status) {
    fail(
      `Project "${project.title}" is missing status`,
      filePath,
      location.headingLine
    );
  }
  if (project.summaryLines.length === 0) {
    fail(
      `Project ${project.code} is missing a summary blockquote`,
      filePath,
      location.headingLine
    );
  }

  for (const section of ["今日进展", "当前问题", "下一步"] as const) {
    if (!location.sectionLines[section]) {
      fail(
        `Project ${project.code} is missing "### ${section}"`,
        filePath,
        location.headingLine
      );
    }
  }

  return {
    code: project.code,
    title: project.title,
    status: project.status,
    summary: project.summaryLines.join(" ").trim(),
    progress: project.progress,
    issues: project.issues,
    next: project.next
  };
}

export function parseReportMarkdown(
  source: string,
  filePath: string
): DailyReport {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, bodyStartIndex } = parseFrontMatter(lines, filePath);
  const locations: ReportSourceLocations = {
    frontMatterStartLine: 1,
    projects: []
  };

  const projects: ReportProject[] = [];
  const globalNextActions: string[] = [];

  let currentProject: MutableProject | undefined;
  let currentLocation: ProjectSourceLocation | undefined;
  let currentSection: SectionName | undefined;
  let inGlobalNext = false;

  const closeCurrentProject = () => {
    if (currentProject && currentLocation) {
      projects.push(
        finalizeProject(currentProject, currentLocation, filePath)
      );
      locations.projects.push(currentLocation);
    }
    currentProject = undefined;
    currentLocation = undefined;
    currentSection = undefined;
  };

  for (let index = bodyStartIndex; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (line === "") continue;

    if (line.startsWith("## ")) {
      closeCurrentProject();
      const title = line.slice(3).trim();

      if (title === "全局下一步计划") {
        inGlobalNext = true;
        locations.globalNextHeadingLine = lineNumber;
        continue;
      }

      if (inGlobalNext) {
        fail(
          "Projects cannot appear after 全局下一步计划",
          filePath,
          lineNumber
        );
      }

      currentProject = {
        title,
        summaryLines: [],
        progress: [],
        issues: [],
        next: []
      };
      currentLocation = {
        headingLine: lineNumber,
        sectionLines: {}
      };
      continue;
    }

    if (inGlobalNext) {
      if (!line.startsWith("- ")) {
        fail(
          "全局下一步计划 only accepts top-level '- ' list items",
          filePath,
          lineNumber
        );
      }
      globalNextActions.push(line.slice(2).trim());
      continue;
    }

    if (!currentProject || !currentLocation) {
      fail(
        "Content must be inside a project or 全局下一步计划",
        filePath,
        lineNumber
      );
    }

    if (line.startsWith("code:")) {
      currentProject.code = line.slice("code:".length).trim();
      currentLocation.codeLine = lineNumber;
      continue;
    }

    if (line.startsWith("status:")) {
      currentProject.status = line
        .slice("status:".length)
        .trim() as ProjectStatus;
      currentLocation.statusLine = lineNumber;
      continue;
    }

    if (line.startsWith(">")) {
      currentProject.summaryLines.push(
        line.replace(/^>\s?/, "").trim()
      );
      currentLocation.summaryLine ??= lineNumber;
      continue;
    }

    if (line.startsWith("### ")) {
      const section = line.slice(4).trim();
      if (!(section in sectionTarget)) {
        fail(
          `Unsupported project section: ${section}`,
          filePath,
          lineNumber
        );
      }
      currentSection = section as SectionName;
      currentLocation.sectionLines[currentSection] = lineNumber;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!currentSection) {
        fail(
          "Project list item appears before a recognized section",
          filePath,
          lineNumber
        );
      }
      const value = line.slice(2).trim();
      currentProject[sectionTarget[currentSection]].push(value);
      continue;
    }

    fail(`Unsupported Markdown syntax: ${line}`, filePath, lineNumber);
  }

  closeCurrentProject();

  if (!locations.globalNextHeadingLine) {
    fail(
      'Missing "## 全局下一步计划"',
      filePath,
      lines.length
    );
  }

  const candidate = {
    meta,
    projects,
    globalNextActions
  };

  try {
    return validateDailyReport(candidate);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      const projectIndex =
        issue.path[0] === "projects" &&
        typeof issue.path[1] === "number"
          ? issue.path[1]
          : undefined;
      const line =
        projectIndex === undefined
          ? 1
          : locations.projects[projectIndex]?.headingLine ?? 1;
      fail(issue.message, filePath, line);
    }
    throw error;
  }
}

export async function parseReportFile(
  filePath: string
): Promise<DailyReport> {
  const source = await readFile(filePath, "utf8");
  const report = parseReportMarkdown(source, filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  if (baseName !== report.meta.date) {
    throw new ParseReportError(
      `file name date "${baseName}" does not match Front Matter date "${report.meta.date}"`,
      filePath,
      1
    );
  }

  return report;
}
