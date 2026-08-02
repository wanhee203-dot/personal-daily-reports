import { Command } from "commander";

export interface CliOptions {
  markdownFile: string;
  open: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export function parseCliArguments(argv: string[]): CliOptions {
  const program = new Command();

  program
    .name("daily-report")
    .argument("<markdown-file>")
    .option("--open", "open output directory after success", false)
    .option("--dry-run", "parse and validate only", false)
    .option("--verbose", "show detailed logging", false)
    .exitOverride();

  program.parse(argv);
  const raw = program.opts<{
    open: boolean;
    dryRun: boolean;
    verbose: boolean;
  }>();

  return {
    markdownFile: program.args[0],
    open: raw.open,
    dryRun: raw.dryRun,
    verbose: raw.verbose
  };
}
