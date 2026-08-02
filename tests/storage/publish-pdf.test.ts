import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publishPdf } from "../../src/storage/publish-pdf";

describe("publishPdf", () => {
  it("replaces an existing PDF", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "pdr-publish-pdf-")
    );
    const tempPdf = path.join(root, "run", "30-31.pdf");
    const finalPdf = path.join(
      root,
      "daily",
      "2026-07",
      "images",
      "30-31.pdf"
    );
    await mkdir(path.dirname(tempPdf), { recursive: true });
    await mkdir(path.dirname(finalPdf), { recursive: true });
    await writeFile(tempPdf, "new");
    await writeFile(finalPdf, "old");

    await publishPdf(tempPdf, finalPdf);

    expect(await readFile(finalPdf, "utf8")).toBe("new");
  });

  it("keeps the existing PDF when the temporary file is missing", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "pdr-publish-pdf-missing-")
    );
    const tempPdf = path.join(root, "run", "9.pdf");
    const finalPdf = path.join(
      root,
      "daily",
      "2026-07",
      "images",
      "9.pdf"
    );
    await mkdir(path.dirname(finalPdf), { recursive: true });
    await writeFile(finalPdf, "old");

    await expect(
      publishPdf(tempPdf, finalPdf)
    ).rejects.toThrow();
    expect(await readFile(finalPdf, "utf8")).toBe("old");
  });

  it("rejects an empty temporary PDF before touching the destination", async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), "pdr-publish-pdf-empty-")
    );
    const tempPdf = path.join(root, "run", "1.pdf");
    const finalPdf = path.join(root, "images", "1.pdf");
    await mkdir(path.dirname(tempPdf), { recursive: true });
    await mkdir(path.dirname(finalPdf), { recursive: true });
    await writeFile(tempPdf, "");
    await writeFile(finalPdf, "old");

    await expect(
      publishPdf(tempPdf, finalPdf)
    ).rejects.toThrow(/missing or empty/i);
    expect(await readFile(finalPdf, "utf8")).toBe("old");
  });
});
