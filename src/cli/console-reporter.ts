import path from "node:path";
import type { GenerateReportResult } from "../core/result";
import { ParseReportError } from "../parser/parse-error";

export function printResult(result: GenerateReportResult): void {
  console.log("Personal Daily Reports");
  console.log("");

  if (result.status === "dry-run") {
    console.log("Parse");
    console.log("  ✓ Markdown parsed");
    console.log(`  PDF: ${result.outputPath}`);
  } else {
    console.log("Export");
    console.log(`  ✓ ${path.basename(result.outputPath)}`);
    console.log("");
    console.log("Output");
    console.log(`  ${result.outputPath}`);
    console.log(
      `  ${result.measurement.cssWidth} × ` +
        `${result.measurement.cssHeight}px`
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
