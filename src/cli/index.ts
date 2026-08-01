#!/usr/bin/env node
import path from "node:path";
import open from "open";
import { generateReport } from "../core/generate-report";
import { parseCliArguments } from "./arguments";
import { printError, printResult } from "./console-reporter";

async function main(): Promise<void> {
  const options = parseCliArguments(process.argv);
  const sourcePath = path.resolve(options.markdownFile);

  const result = await generateReport({
    sourcePath,
    projectRoot: process.cwd(),
    scale: options.scale,
    dryRun: options.dryRun,
    force: options.force,
    verbose: options.verbose
  });

  printResult(result);

  if (
    options.open &&
    result.status !== "dry-run"
  ) {
    await open(result.outputDir);
  }
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
