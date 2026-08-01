import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256File } from "../../src/storage/cache";
import { resolveReportPaths } from "../../src/storage/paths";
import { publishRunDirectory } from "../../src/storage/publish";

describe("storage utilities", () => {
  it("resolves the dated output directory", () => {
    const root = "H:\\Workshop\\PDR\\personal-daily-reports";
    const paths = resolveReportPaths(
      path.join(root, "reports", "source", "2026", "08", "2026-08-01.md"),
      "2026-08-01",
      root,
      "run-1"
    );

    expect(paths.finalOutputDir).toBe(
      path.join(root, "reports", "rendered", "2026", "08", "2026-08-01")
    );
  });

  it("hashes identical content identically", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "pdr-hash-"));
    const first = path.join(root, "a.md");
    const second = path.join(root, "b.md");
    await writeFile(first, "same", "utf8");
    await writeFile(second, "same", "utf8");

    expect(await sha256File(first)).toBe(await sha256File(second));
  });

  it("replaces a final directory and removes the old content", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "pdr-publish-"));
    const temp = path.join(root, "temp");
    const final = path.join(root, "final");
    await mkdir(temp);
    await mkdir(final);
    await writeFile(path.join(temp, "report.png"), "new");
    await writeFile(path.join(final, "report.png"), "old");

    await publishRunDirectory(temp, final);

    expect(await readFile(path.join(final, "report.png"), "utf8")).toBe("new");
  });
});
