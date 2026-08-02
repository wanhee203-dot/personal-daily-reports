import { describe, expect, it, vi } from "vitest";
import { parseCliArguments } from "../../src/cli/arguments";

describe("parseCliArguments", () => {
  it("defaults to PDF-only options", () => {
    expect(
      parseCliArguments([
        "node",
        "cli",
        "daily/2026-08/2026-08-01.md"
      ])
    ).toEqual({
      markdownFile: "daily/2026-08/2026-08-01.md",
      open: false,
      dryRun: false,
      verbose: false
    });
  });

  it.each(["--scale", "--force"])(
    "rejects removed option %s",
    (option) => {
      const stderr = vi
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      try {
        expect(() =>
          parseCliArguments([
            "node",
            "cli",
            "report.md",
            option
          ])
        ).toThrow();
      } finally {
        stderr.mockRestore();
      }
    }
  );

  it("keeps open, dry-run, and verbose controls", () => {
    expect(
      parseCliArguments([
        "node",
        "cli",
        "report.md",
        "--open",
        "--dry-run",
        "--verbose"
      ])
    ).toMatchObject({
      open: true,
      dryRun: true,
      verbose: true
    });
  });
});
