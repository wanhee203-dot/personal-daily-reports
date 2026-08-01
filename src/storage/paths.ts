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

export function resolveReportPaths(
  sourcePath: string,
  projectRoot: string,
  runId: string
): ReportPaths {
  const identity = resolveDailySource(sourcePath, projectRoot);
  const cacheRoot = path.join(
    projectRoot,
    ".daily-report-cache"
  );
  const runRoot = path.join(cacheRoot, runId);
  const finalOutputDir = path.join(
    identity.sourceDir,
    "images"
  );

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
