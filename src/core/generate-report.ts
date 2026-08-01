import {
  access,
  mkdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { exportArtifacts } from "../exporter/export-artifacts";
import { parseReportFile } from "../parser/parse-report";
import { startRenderServer } from "../server/start-render-server";
import {
  isOutputCurrent,
  sha256File
} from "../storage/cache";
import { createManifest } from "../storage/manifest";
import { resolveReportPaths } from "../storage/paths";
import { publishRunDirectory } from "../storage/publish";
import {
  GENERATOR_VERSION,
  TEMPLATE_NAME,
  TEMPLATE_VERSION
} from "./constants";
import type { GenerateReportResult } from "./result";

export interface GenerateReportOptions {
  sourcePath: string;
  projectRoot: string;
  scale: 1 | 2;
  dryRun: boolean;
  force: boolean;
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

export async function generateReport(
  options: GenerateReportOptions
): Promise<GenerateReportResult> {
  const sourcePath = path.resolve(options.sourcePath);
  await requireMarkdownFile(sourcePath);

  const report = await parseReportFile(sourcePath);
  const warnings: string[] = [];

  if (report.projects.length > 8) {
    warnings.push(
      `Project count ${report.projects.length} exceeds the recommended limit 8`
    );
  }

  if (options.dryRun) {
    return {
      status: "dry-run",
      report,
      warnings
    };
  }

  const sourceHash = await sha256File(sourcePath);
  const runId = `run-${Date.now()}-${process.pid}`;
  const paths = resolveReportPaths(
    sourcePath,
    report.meta.date,
    options.projectRoot,
    runId
  );

  const fingerprint = {
    sourceHash,
    templateVersion: TEMPLATE_VERSION,
    generatorVersion: GENERATOR_VERSION,
    scale: options.scale
  };

  if (
    !options.force &&
    (await isOutputCurrent(paths.finalOutputDir, fingerprint))
  ) {
    return {
      status: "cached",
      outputDir: paths.finalOutputDir,
      warnings
    };
  }

  await mkdir(paths.tempOutputDir, { recursive: true });

  const server = await startRenderServer(report);

  try {
    const measurement = await exportArtifacts({
      url: server.url,
      pngPath: paths.tempPngPath,
      pdfPath: paths.tempPdfPath,
      scale: options.scale
    });

    if (measurement.warning) {
      warnings.push(measurement.warning);
    }

    await writeFile(
      paths.tempJsonPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8"
    );

    const manifest = createManifest({
      source: path.relative(options.projectRoot, sourcePath),
      sourceHash,
      reportDate: report.meta.date,
      template: {
        name: TEMPLATE_NAME,
        version: TEMPLATE_VERSION
      },
      generatorVersion: GENERATOR_VERSION,
      generatedAt: new Date().toISOString(),
      render: {
        cssWidth: measurement.cssWidth,
        cssHeight: measurement.cssHeight,
        scale: options.scale,
        pngWidth: measurement.pngWidth,
        pngHeight: measurement.pngHeight
      }
    });

    await writeFile(
      paths.tempManifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    );

    await publishRunDirectory(
      paths.tempOutputDir,
      paths.finalOutputDir
    );

    return {
      status: "generated",
      outputDir: paths.finalOutputDir,
      manifest,
      warnings
    };
  } finally {
    await server.close();
    await rm(paths.runRoot, { recursive: true, force: true });
  }
}
