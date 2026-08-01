import path from "node:path";

export interface ReportPaths {
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
  reportDate: string,
  projectRoot: string,
  runId: string
): ReportPaths {
  const [year, month] = reportDate.split("-");
  const cacheRoot = path.join(projectRoot, ".daily-report-cache");
  const runRoot = path.join(cacheRoot, runId);
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
