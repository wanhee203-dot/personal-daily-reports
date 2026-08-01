import path from "node:path";
import { resolveDailySource } from "../source/daily-source";

export interface ReportPaths {
  projectRoot: string;
  sourcePath: string;
  cacheRoot: string;
  runRoot: string;
  finalOutputDir: string;
  tempPdfPath: string;
  finalPdfPath: string;
}

export interface LegacyReportPaths {
  projectRoot: string;
  sourcePath: string;
  cacheRoot: string;
  runRoot: string;
  tempOutputDir: string;
  finalOutputDir: string;
  tempPngPath: string;
  tempPdfPath: string;
  tempJsonPath: string;
  tempManifestPath: string;
}

export function resolveReportPaths(
  sourcePath: string,
  projectRoot: string,
  runId: string
): ReportPaths;
export function resolveReportPaths(
  sourcePath: string,
  reportDate: string,
  projectRoot: string,
  runId: string
): LegacyReportPaths;
export function resolveReportPaths(
  sourcePath: string,
  projectRootOrReportDate: string,
  runIdOrProjectRoot: string,
  legacyRunId?: string
): ReportPaths | LegacyReportPaths {
  if (legacyRunId !== undefined) {
    const reportDate = projectRootOrReportDate;
    const projectRoot = runIdOrProjectRoot;
    const [year, month] = reportDate.split("-");
    const cacheRoot = path.join(projectRoot, ".daily-report-cache");
    const runRoot = path.join(cacheRoot, legacyRunId);
    const tempOutputDir = path.join(runRoot, "output");
    const finalOutputDir = path.join(
      projectRoot,
      "reports",
      "rendered",
      year,
      month,
      reportDate
    );

    return {
      projectRoot,
      sourcePath,
      cacheRoot,
      runRoot,
      tempOutputDir,
      finalOutputDir,
      tempPngPath: path.join(tempOutputDir, "report.png"),
      tempPdfPath: path.join(tempOutputDir, "report.pdf"),
      tempJsonPath: path.join(tempOutputDir, "report.json"),
      tempManifestPath: path.join(tempOutputDir, "manifest.json")
    };
  }

  const projectRoot = projectRootOrReportDate;
  const runId = runIdOrProjectRoot;
  const identity = resolveDailySource(sourcePath, projectRoot);
  const cacheRoot = path.join(projectRoot, ".daily-report-cache");
  const runRoot = path.join(cacheRoot, runId);
  const finalOutputDir = path.join(identity.sourceDir, "images");

  return {
    projectRoot,
    sourcePath,
    cacheRoot,
    runRoot,
    finalOutputDir,
    tempPdfPath: path.join(
      runRoot,
      `${identity.outputStem}.pdf`
    ),
    finalPdfPath: path.join(
      finalOutputDir,
      `${identity.outputStem}.pdf`
    )
  };
}
