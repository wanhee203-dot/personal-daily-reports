import { describe, expect, it } from "vitest";
import { parseCliArguments } from "../../src/cli/arguments";

describe("parseCliArguments", () => {
  it("uses scale 1 by default", () => {
    const options = parseCliArguments(["node", "cli", "report.md"]);
    expect(options).toMatchObject({
      markdownFile: "report.md",
      scale: 1,
      dryRun: false,
      force: false
    });
  });

  it("accepts scale 2", () => {
    const options = parseCliArguments([
      "node",
      "cli",
      "report.md",
      "--scale",
      "2"
    ]);
    expect(options.scale).toBe(2);
  });
});
