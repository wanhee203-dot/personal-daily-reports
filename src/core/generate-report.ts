import {
  access,
  mkdir,
  rmdir,
  rm,
  stat
} from "node:fs/promises";
import path from "node:path";
import { exportPdf } from "../exporter/export-pdf";
import type { PosterDocument } from "../markdown/document-types";
import { parseMarkdownFile } from "../markdown/parse-markdown";
import {
  startRenderServer,
  type RenderServer
} from "../server/start-render-server";
import { resolveDailySource } from "../source/daily-source";
import { resolveReportPaths } from "../storage/paths";
import { publishPdf } from "../storage/publish-pdf";
import type { GenerateReportResult } from "./result";

export interface GenerateReportOptions {
  sourcePath: string;
  projectRoot: string;
  dryRun: boolean;
  verbose: boolean;
}

async function requireMarkdownFile(filePath: string): Promise<void> {
  if (path.extname(filePath).toLowerCase() !== ".md") {
    throw new Error(`Input must be a .md file: ${filePath}`);
  }

  await access(filePath);
  const value = await stat(filePath);

  if (!value.isFile()) {
    throw new Error(`Input is not a file: ${filePath}`);
  }
}

async function removeEmptyCacheRoot(
  cacheRoot: string
): Promise<void> {
  try {
    await rmdir(cacheRoot);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOTEMPTY" && code !== "ENOENT") {
      throw error;
    }
  }
}

export async function generateReport(
  options: GenerateReportOptions
): Promise<GenerateReportResult> {
  const sourcePath = path.resolve(options.sourcePath);
  await requireMarkdownFile(sourcePath);

  const identity = resolveDailySource(
    sourcePath,
    options.projectRoot
  );
  const markdown = await parseMarkdownFile(
    sourcePath,
    options.projectRoot
  );
  const poster: PosterDocument = {
    ...markdown,
    dateLabel: identity.dateLabel,
    sourceName: path.basename(sourcePath)
  };
  const runId = `run-${Date.now()}-${process.pid}`;
  const paths = resolveReportPaths(
    sourcePath,
    options.projectRoot,
    runId
  );

  if (options.dryRun) {
    return {
      status: "dry-run",
      document: poster,
      outputPath: paths.finalPdfPath,
      warnings: []
    };
  }

  await mkdir(paths.runRoot, { recursive: true });
  let server: RenderServer | undefined;

  try {
    server = await startRenderServer(poster);
    const measurement = await exportPdf({
      url: server.url,
      pdfPath: paths.tempPdfPath
    });
    await publishPdf(paths.tempPdfPath, paths.finalPdfPath);

    return {
      status: "generated",
      outputPath: paths.finalPdfPath,
      outputDir: paths.finalOutputDir,
      measurement,
      warnings: measurement.warning
        ? [measurement.warning]
        : []
    };
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(paths.runRoot, { recursive: true, force: true });
      await removeEmptyCacheRoot(paths.cacheRoot);
    }
  }
}
