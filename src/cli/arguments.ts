import { Command, Option } from "commander";

export interface CliOptions {
  markdownFile: string;
  scale: 1 | 2;
  open: boolean;
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
}

export function parseCliArguments(argv: string[]): CliOptions {
  const program = new Command();

  program
    .name("daily-report")
    .argument("<markdown-file>")
    .addOption(
      new Option("--scale <scale>", "PNG scale")
        .choices(["1", "2"])
        .default("1")
    )
    .option("--open", "open output directory after success", false)
    .option("--dry-run", "parse and validate only", false)
    .option("--force", "ignore cache and regenerate", false)
    .option("--verbose", "show detailed logging", false)
    .exitOverride();

  program.parse(argv);
  const raw = program.opts<{
    scale: "1" | "2";
    open: boolean;
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
  }>();

  return {
    markdownFile: program.args[0],
    scale: Number(raw.scale) as 1 | 2,
    open: raw.open,
    dryRun: raw.dryRun,
    force: raw.force,
    verbose: raw.verbose
  };
}
