import path from "node:path";
import type { GenerateReportResult } from "../core/result";
import { ParseReportError } from "../parser/parse-error";

export function printResult(result: GenerateReportResult): void {
  console.log("Personal Daily Reports");
  console.log("");

  if (result.status === "dry-run") {
    console.log("Parse");
    console.log("  ✓ Markdown parsed");
    console.log(`  ✓ ${result.report.projects.length} projects`);
    console.log("  ✓ Schema validation");
  } else if (result.status === "cached") {
    console.log("Cache");
    console.log("  ✓ Output is current");
    console.log(`  ${result.outputDir}`);
  } else {
    console.log("Export");
    console.log("  ✓ report.png");
    console.log("  ✓ report.pdf");
    console.log("  ✓ report.json");
    console.log("  ✓ manifest.json");
    console.log("");
    console.log("Output");
    console.log(`  ${result.outputDir}`);
    console.log(
      `  ${result.manifest.render.pngWidth} × ${result.manifest.render.pngHeight}px`
    );
  }

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

export function printError(error: unknown): void {
  if (error instanceof ParseReportError) {
    console.error(error.message);
    console.error("");
    console.error("File:");
    console.error(`  ${error.filePath}`);
    console.error("");
    console.error("Location:");
    console.error(`  line ${error.line}`);
    return;
  }

  const message =
    error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error(`Working directory: ${path.resolve(".")}`);
}
